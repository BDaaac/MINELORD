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
  const debriefLines = state.machineThoughts.length
    ? state.machineThoughts.slice(-8)
    : state.log.slice(-10);

  return (
    <main className="screen">
      <TerminalFrame title={win ? "> MISSION COMPLETE" : "> MISSION FAILED"} danger={!win}>
        <div className="result-panel">
          {win ? (
            <>
              <h1>MISSION COMPLETE</h1>
              <div className="result-divider">---------------------------------</div>
              <div className="result-stats">
                <p><span className="result-label">EXPLOSIONS</span><span className="result-value">{state.stats.explosions}</span></p>
                <p><span className="result-label">SPEED KILLS</span><span className="result-value">{state.stats.speedKills}</span></p>
                <p><span className="result-label">CLEAN SWEEP</span><span className="result-value">YES</span></p>
                <p><span className="result-label">EARNED</span><span className="result-value">{state.stats.earnedThisRound} credits</span></p>
              </div>
              <div className="result-divider">---------------------------------</div>
              <p className="result-round">&gt; ROUND {state.config.round} COMPLETE</p>
            </>
          ) : (
            <>
              <h1>MISSION FAILED</h1>
              <div className="result-divider">---------------------------------</div>
              <p>Sapper reached the Defuse Point.</p>
              <p>Your minefield became too predictable.</p>
              <div className="result-divider">---------------------------------</div>
              <div className="result-stats">
                <p><span className="result-label">ROUNDS SURVIVED</span><span className="result-value">{Math.max(0, state.config.round - 1)}</span></p>
                <p><span className="result-label">BEST ROUND</span><span className="result-value">{state.stats.bestRound}</span></p>
                <p><span className="result-label">GAMES PLAYED</span><span className="result-value">{totalGames}</span></p>
                <p><span className="result-label">SAPPERS ELIMINATED</span><span className="result-value">{totalKills}</span></p>
              </div>
            </>
          )}

          <section className="result-debrief">
            <div className="result-debrief__title">&gt; SAPPER DEBRIEF</div>
            <div className="result-debrief__log">
              {debriefLines.map((line, index) => (
                <p key={`${index}-${line.slice(0, 24)}`}>{line}</p>
              ))}
            </div>
          </section>

          <div className="menu-row">
            {win ? (
              <button className="terminal-button terminal-button--primary" onClick={onNext}>
                <StepForward size={18} /> К СКЛАДУ СНАРЯЖЕНИЯ
              </button>
            ) : (
              <button className="terminal-button terminal-button--danger" onClick={onRestart}>
                <RotateCcw size={18} /> ЕЩЕ РАЗ
              </button>
            )}
            <button className="terminal-button" onClick={onMenu}>
              <Home size={18} /> ГЛАВНОЕ МЕНЮ
            </button>
          </div>
        </div>
      </TerminalFrame>
    </main>
  );
}
