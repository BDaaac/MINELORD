import { useState } from "react";
import { DIRECTIVES } from "../game/data";
import { DirectiveId } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

export function DirectiveSelect({
  round,
  choices,
  onPick,
}: {
  round: number;
  choices: DirectiveId[];
  onPick: (directive: DirectiveId) => void;
}) {
  const [selected, setSelected] = useState<DirectiveId | null>(null);

  return (
    <main className="screen">
      <TerminalFrame title={`> РАУНД ${round} - ВЫБОР ДИРЕКТИВЫ`}>
        <div className="timer-chip">&gt; Ожидаю подтверждение директивы...</div>
        <div className="directive-grid">
          {choices.map((id) => {
            const directive = DIRECTIVES[id];
            return (
              <button
                className={`directive-card ${selected === id ? "directive-card--selected" : ""}`}
                key={id}
                onClick={() => setSelected(id)}
              >
                <strong>██ DIRECTIVE #{directive.serial}</strong>
                <span className="directive-rule">-------------------</span>
                <span className="directive-name">{directive.name}</span>
                <span>{directive.description}</span>
                <small>CLASSIFICATION: TOP SECRET</small>
              </button>
            );
          })}
        </div>
        <div className="directive-confirm-row">
          <button
            className="terminal-button terminal-button--primary"
            disabled={!selected}
            onClick={() => selected && onPick(selected)}
          >
            ПРИНЯТЬ ДИРЕКТИВУ{selected ? `: ${DIRECTIVES[selected].name}` : ""}
          </button>
        </div>
      </TerminalFrame>
    </main>
  );
}
