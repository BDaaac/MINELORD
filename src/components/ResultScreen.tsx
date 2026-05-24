import { Home, RotateCcw, StepForward } from "lucide-react";
import { GameState } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

export function ResultScreen({
  state,
  onNext,
  onRestart,
  onMenu,
}: {
  state: GameState;
  onNext: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const win = state.result === "win";
  return (
    <main className="screen">
      <TerminalFrame title={win ? "> MISSION COMPLETE" : "> MISSION FAILED"} danger={!win}>
        <div className="result-panel">
          {win ? (
            <>
              <h1>MISSION COMPLETE</h1>
              <p>💣 ВЗРЫВОВ: {state.stats.explosions}</p>
              <p>⚡ SPEED KILLS: {state.stats.speedKills}</p>
              <p>💰 ЗАРАБОТАНО: {state.stats.earnedThisRound}</p>
              <p>🏆 РАУНД: {state.config.round}</p>
            </>
          ) : (
            <>
              <h1>MISSION FAILED</h1>
              <p>Сапёр добрался до цели.</p>
              <p>Твои мины оказались слишком предсказуемы.</p>
              <p>РАУНДОВ ВЫЖИТО: {Math.max(0, state.config.round - 1)}</p>
              <p>РЕКОРД: {state.stats.bestRound}</p>
            </>
          )}
          <div className="menu-row">
            {win ? (
              <button className="terminal-button terminal-button--primary" onClick={onNext}>
                <StepForward size={18} /> NEXT ROUND
              </button>
            ) : (
              <button className="terminal-button terminal-button--danger" onClick={onRestart}>
                <RotateCcw size={18} /> TRY AGAIN
              </button>
            )}
            <button className="terminal-button" onClick={onMenu}>
              <Home size={18} /> MAIN MENU
            </button>
          </div>
        </div>
      </TerminalFrame>
    </main>
  );
}
