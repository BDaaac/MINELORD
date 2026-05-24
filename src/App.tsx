import { useCallback, useEffect, useRef } from "react";
import { BossIntro } from "./components/BossIntro";
import { AudioToggle } from "./components/AudioToggle";
import { AchievementsScreen } from "./components/AchievementsScreen";
import { ArsenalScreen } from "./components/ArsenalScreen";
import { DirectiveSelect } from "./components/DirectiveSelect";
import { HowToPlay } from "./components/HowToPlay";
import { PlacementScreen } from "./components/PlacementScreen";
import { ResultScreen } from "./components/ResultScreen";
import { RunningScreen } from "./components/RunningScreen";
import { ShopScreen } from "./components/ShopScreen";
import { TitleScreen } from "./components/TitleScreen";
import { useInterval } from "./hooks/useInterval";
import { useBackgroundMusic } from "./hooks/useBackgroundMusic";
import { requestMachineMove } from "./game/gemini";
import {
  afterBossIntro,
  applyAiMove,
  beginPlacement,
  buyUpgrade,
  createInitialGame,
  enterShop,
  parseCellName,
  rerollShop,
  setupRound,
  startRunning,
  toggleMine,
} from "./game/logic";
import { MineType } from "./game/types";
import { useState } from "react";

export function App() {
  const [state, setState] = useState(createInitialGame);
  const machineBusy = useRef(false);
  const pendingMoveRef = useRef<{ sapperId: string; coord?: { row: number; col: number }; reason?: string } | null>(null);
  const audio = useBackgroundMusic(state.screen, state.result);

  useEffect(() => {
    if (state.screen !== "running") {
      pendingMoveRef.current = null;
      machineBusy.current = false;
    }
  }, [state.screen]);

  const startCampaign = useCallback(() => {
    audio.armAndPlay();
    setState((current) => setupRound(current, 0));
  }, [audio]);

  useInterval(
    () => {
      if (state.screen !== "running" || state.result || state.paused || state.confirmMenu) return;

      const sapper = state.sappers.find((item) => item.alive && !item.reached);
      if (!sapper) return;

      if (pendingMoveRef.current) {
        const pending = pendingMoveRef.current;
        pendingMoveRef.current = null;
        setState((current) => applyAiMove(current, pending.sapperId, pending.coord, pending.reason));
        return;
      }

      if (state.config.ai === "The Machine") {
        if (machineBusy.current) return;

        machineBusy.current = true;
        const snapshot = state;
        setState((current) => ({
          ...current,
          log: [...current.log, `> ${sapper.name}: анализирует маршрут...`].slice(-90),
        }));

        void requestMachineMove(snapshot.gemini, snapshot.board, snapshot.defuse, sapper, snapshot.mines)
          .then((result) => {
            const coord = parseCellName(result.move.cell);

            setState((current) => {
              if (current.screen !== "running" || current.result || current.paused || current.confirmMenu) {
                return current;
              }

              const updated = {
                ...current,
                gemini: result.settings,
                machineThoughts: [...current.machineThoughts, ...result.thoughts].slice(-30),
              };

              pendingMoveRef.current = {
                sapperId: sapper.id,
                coord: coord || undefined,
                reason: result.move.reason,
              };

              return updated;
            });
          })
          .finally(() => {
            machineBusy.current = false;
          });

        return;
      }

      setState((current) => {
        const active = current.sappers.find((item) => item.alive && !item.reached);
        if (!active) return current;
        pendingMoveRef.current = { sapperId: active.id };
        return {
          ...current,
          log: [...current.log, `> ${active.name}: анализирует сектор...`].slice(-90),
        };
      });
    },
    state.screen === "running" && !state.paused && !state.confirmMenu
      ? (state.selectedDirective === "overclock" ? 600 : 1200)
      : null,
  );

  useInterval(
    () => {
      if (!state.flash) return;
      setState((current) => ({ ...current, flash: false }));
    },
    state.flash ? 180 : null,
  );

  if (state.screen === "title") {
    return (
      <TitleScreen
        muted={audio.muted}
        onAudioToggle={audio.toggleMuted}
        onHowTo={() => {
          audio.armAndPlay();
          setState((current) => ({ ...current, screen: "howto" }));
        }}
        onArsenal={() => {
          audio.armAndPlay();
          setState((current) => ({ ...current, screen: "arsenal" }));
        }}
        onAchievements={() => {
          audio.armAndPlay();
          setState((current) => ({ ...current, screen: "achievements" }));
        }}
        onStart={startCampaign}
      />
    );
  }

  if (state.screen === "howto") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <HowToPlay
          onBack={() => {
            audio.armAndPlay();
            setState((current) => ({ ...current, screen: "title" }));
          }}
          onStart={startCampaign}
        />
      </>
    );
  }

  if (state.screen === "arsenal") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <ArsenalScreen onBack={() => {
          audio.armAndPlay();
          setState((current) => ({ ...current, screen: "title" }));
        }} />
      </>
    );
  }

  if (state.screen === "achievements") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <AchievementsScreen onBack={() => {
          audio.armAndPlay();
          setState((current) => ({ ...current, screen: "title" }));
        }} />
      </>
    );
  }

  if (state.screen === "directive") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <DirectiveSelect
          choices={state.directiveChoices}
          round={state.config.round}
          onBack={() => setState((current) => ({ ...current, screen: "title" }))}
          onPick={(directive) => setState((current) => beginPlacement(current, directive))}
        />
      </>
    );
  }

  if (state.screen === "boss") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <BossIntro
          ai={state.config.ai}
          onBack={() => setState((current) => ({ ...current, screen: "directive" }))}
          onContinue={() => {
            audio.armAndPlay();
            setState(afterBossIntro);
          }}
        />
      </>
    );
  }

  if (state.screen === "placement") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <PlacementScreen
          state={state}
          onBack={() => setState((current) => ({
            ...current,
            screen: current.config.boss ? "boss" : "directive",
          }))}
          onCellClick={(row, col) => setState((current) => toggleMine(current, row, col))}
          onMineSelect={(type: MineType) => setState((current) => ({ ...current, selectedMine: type }))}
          onStart={() => {
            audio.armAndPlay();
            setState(startRunning);
          }}
        />
      </>
    );
  }

  if (state.screen === "running") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <RunningScreen
          state={state}
          onPauseToggle={() =>
            setState((current) => ({
              ...current,
              paused: !current.paused,
              confirmMenu: false,
            }))
          }
          onMenuAsk={() =>
            setState((current) => ({
              ...current,
              paused: true,
              confirmMenu: true,
              log: [...current.log, "> Выйти в меню? [Y] да  [N] нет"].slice(-90),
            }))
          }
          onMenuConfirm={() => setState(createInitialGame())}
          onMenuCancel={() =>
            setState((current) => ({
              ...current,
              confirmMenu: false,
              paused: false,
            }))
          }
          onViewToggle={() =>
            setState((current) => ({
              ...current,
              sapperView: !current.sapperView,
            }))
          }
          onGiveUp={() =>
            setState((current) => ({
              ...current,
              screen: "result",
              result: "lose",
              paused: false,
              confirmMenu: false,
              log: [...current.log, "> MINELORD: игрок сдался. MISSION FAILED."].slice(-90),
            }))
          }
        />
      </>
    );
  }

  if (state.screen === "shop") {
    return (
      <>
        <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
        <ShopScreen
          state={state}
          onBack={() => setState((current) => ({ ...current, screen: "result" }))}
          onBuy={(id) => setState((current) => buyUpgrade(current, id))}
          onReroll={() => setState((current) => rerollShop(current))}
          onContinue={() => {
            audio.armAndPlay();
            setState((current) => setupRound(current, current.roundIndex + 1));
          }}
        />
      </>
    );
  }

  return (
    <>
      <AudioToggle muted={audio.muted} onToggle={audio.toggleMuted} />
      <ResultScreen
        state={state}
        onMenu={() => setState(createInitialGame())}
        onNext={() => {
          audio.armAndPlay();
          setState((current) => enterShop(current));
        }}
        onRestart={() => setState(createInitialGame())}
      />
    </>
  );
}
