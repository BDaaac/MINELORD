import { useState } from "react";
import { DIRECTIVES, MINE_DEFS } from "../game/data";
import { TerminalFrame } from "./TerminalFrame";

export function ArsenalScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"directives" | "mines">("directives");

  return (
    <main className="screen">
      <TerminalFrame title="> АРСЕНАЛ - СЕКРЕТНЫЕ ДОКУМЕНТЫ">
        <div className="arsenal-tabs">
          <button className={`run-control-button ${tab === "directives" ? "mine-token--active" : ""}`} onClick={() => setTab("directives")}>
            [ ДИРЕКТИВЫ ]
          </button>
          <button className={`run-control-button ${tab === "mines" ? "mine-token--active" : ""}`} onClick={() => setTab("mines")}>
            [ МИНЫ ]
          </button>
        </div>

        <div className="arsenal-list">
          {tab === "directives"
            ? Object.values(DIRECTIVES).map((directive) => (
                <div className="arsenal-row" key={directive.id}>
                  <strong>{directive.unlockRound > 1 ? `██████ - раунд ${directive.unlockRound}` : directive.name}</strong>
                  <span>{directive.unlockRound > 1 ? directive.short : directive.description}</span>
                </div>
              ))
            : Object.values(MINE_DEFS)
                .filter((mine) => mine.type !== "decoy")
                .map((mine) => (
                  <div className="arsenal-row" key={mine.type}>
                    <strong>{mine.unlockedRound > 1 ? `██████ - раунд ${mine.unlockedRound}` : `${mine.glyph} ${mine.name}`}</strong>
                    <span>{mine.description}</span>
                  </div>
                ))}
        </div>

        <button className="terminal-button terminal-button--primary" onClick={onBack}>
          НАЗАД В МЕНЮ
        </button>
      </TerminalFrame>
    </main>
  );
}
