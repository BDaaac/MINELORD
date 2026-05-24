import { Bot, KeyRound } from "lucide-react";
import { activeGeminiKeyLabel } from "../game/gemini";
import { GameState } from "../game/types";
import { Board } from "./Board";
import { TerminalFrame } from "./TerminalFrame";

export function RunningScreen({
  state,
  onPauseToggle,
  onMenuAsk,
  onMenuConfirm,
  onMenuCancel,
  onGiveUp,
  onViewToggle,
}: {
  state: GameState;
  onPauseToggle: () => void;
  onMenuAsk: () => void;
  onMenuConfirm: () => void;
  onMenuCancel: () => void;
  onGiveUp: () => void;
  onViewToggle: () => void;
}) {
  return (
    <main className={`screen game-layout ${state.flash ? "screen-flash" : ""}`}>
      <TerminalFrame title={`РАУНД ${state.config.round} - ЖИВЫХ САПЕРОВ: ${state.sappers.filter((s) => s.alive).length}`}>
        <div className="run-grid">
          <div>
            <Board
              board={state.board}
              mines={state.mines}
              defuse={state.defuse}
              sappers={state.sappers}
              phase="running"
              sapperView={state.sapperView}
            />
            <div className="legend-line">&gt; РАУНД {state.config.round} - САПЕР ВЕДЕТ ПОИСК...</div>
          </div>
          <aside className="ai-panel">
            <div className="panel-heading"><Bot size={18} /> ЖУРНАЛ AI</div>
            {state.config.ai === "The Machine" ? (
              <div className="gemini-status">
                <div><KeyRound size={16} /> {activeGeminiKeyLabel(state.gemini.activeKeyIndex)} active</div>
                <div>{state.gemini.model}</div>
                <div>{state.gemini.status}</div>
              </div>
            ) : null}
            <div className="terminal-log">
              {state.log.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
              {state.machineThoughts.map((line, index) => (
                <p className="machine-thought" key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </aside>
        </div>
        <div className="run-controls">
            <button className="run-control-button" type="button" onClick={onPauseToggle}>
            [ {state.paused ? "ПРОДОЛЖИТЬ" : "ПАУЗА"} ]
          </button>
          <button className="run-control-button" type="button" onClick={onViewToggle}>
            [ {state.sapperView ? "МОЙ ВИД" : "ВИД САПЕРА"} ]
          </button>
          <button className="run-control-button" type="button" onClick={onMenuAsk}>
            [ МЕНЮ ]
          </button>
          <button className="run-control-button" type="button" onClick={onGiveUp}>
            [ СДАТЬСЯ ]
          </button>
        </div>
        {state.confirmMenu ? (
          <div className="menu-confirm">
            <span>&gt; Выйти в меню? [Y] да  [N] нет</span>
            <button className="run-control-button" type="button" onClick={onMenuConfirm}>[ Y ]</button>
            <button className="run-control-button" type="button" onClick={onMenuCancel}>[ N ]</button>
          </div>
        ) : null}
      </TerminalFrame>
    </main>
  );
}
