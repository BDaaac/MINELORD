import { useEffect } from "react";
import { DIRECTIVES } from "../game/data";
import { DirectiveId } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

export function DirectiveSelect({
  round,
  choices,
  timer,
  onPick,
}: {
  round: number;
  choices: DirectiveId[];
  timer: number;
  onPick: (directive: DirectiveId) => void;
}) {
  useEffect(() => {
    if (timer <= 0 && choices.length) onPick(choices[Math.floor(Math.random() * choices.length)]);
  }, [timer, choices, onPick]);

  return (
    <main className="screen">
      <TerminalFrame title={`> ROUND ${round} — SELECT DIRECTIVE`}>
        <div className={`timer-chip ${timer < 5 ? "timer-chip--danger" : ""}`}>
          &gt; Awaiting directive confirmation... {timer}s
        </div>
        <div className="directive-grid">
          {choices.map((id) => {
            const directive = DIRECTIVES[id];
            return (
              <button className="directive-card" key={id} onClick={() => onPick(id)}>
                <strong>██ DIRECTIVE #{directive.serial}</strong>
                <span className="directive-rule">───────────────────</span>
                <span className="directive-name">{directive.name}</span>
                <span>{directive.description}</span>
                <small>CLASSIFICATION: TOP SECRET</small>
              </button>
            );
          })}
        </div>
      </TerminalFrame>
    </main>
  );
}
