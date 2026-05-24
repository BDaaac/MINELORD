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
  const totalGames = Number(localStorage.getItem("minelord-games") || "0");
  const totalKills = Number(localStorage.getItem("minelord-kills") || "0");

  return (
    <main className="screen">
      <TerminalFrame title={win ? "> MISSION COMPLETE" : "> MISSION FAILED"} danger={!win}>
        <div className="result-panel">
          {win ? (
            <>
              <h1>MISSION COMPLETE</h1>
              <div className="result-divider">─────────────────────────────────</div>
              <div className="result-stats">
                <p><span className="result-label">💥 ПОДРЫВОВ</span><span className="result-value">{state.stats.explosions}</span></p>
                <p><span className="result-label">⚡ SPEED KILLS</span><span className="result-value">{state.stats.speedKills}</span></p>
                <p><span className="result-label">🧹 CLEAN SWEEP</span><span className="result-value">ДА</span></p>
                <p><span className="result-label">Ȼ  ЗАРАБОТАНО</span><span className="result-value">{state.stats.earnedThisRound} credits</span></p>
              </div>
              <div className="result-divider">─────────────────────────────────</div>
              <p className="result-round">&gt; РАУНД {state.config.round} пройден</p>
            </>
          ) : (
            <>
              <h1>MISSION FAILED</h1>
              <div className="result-divider">─────────────────────────────────</div>
              <p>Сапёр достиг Defuse Point.</p>
              <p>Твои мины оказались слишком предсказуемы.</p>
              <div className="result-divider">─────────────────────────────────</div>
              <div className="result-stats">
                <p><span className="result-label">РАУНДОВ ВЫЖИТО</span><span className="result-value">{Math.max(0, state.config.round - 1)}</span></p>
                <p><span className="result-label">РЕКОРД</span><span className="result-value">{state.stats.bestRound}</span></p>
                <p><span className="result-label">ИГР СЫГРАНО</span><span className="result-value">{totalGames}</span></p>
                <p><span className="result-label">САПЁРОВ УБИТО</span><span className="result-value">{totalKills}</span></p>
              </div>
            </>
          )}
          <div className="menu-row">
            {win ? (
              <button className="terminal-button terminal-button--primary" onClick={onNext}>
                <StepForward size={18} /> PROCEED TO SUPPLY DEPOT
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
