import { Play } from "lucide-react";
import { DIRECTIVES, MINE_DEFS, SYNERGIES } from "../game/data";
import { availableMineCount, placedMineCount, totalMineLimit, unlockedMines } from "../game/logic";
import { GameState, MineType } from "../game/types";
import { Board } from "./Board";
import { TerminalFrame } from "./TerminalFrame";

export function PlacementScreen({
  state,
  onCellClick,
  onMineSelect,
  onStart,
}: {
  state: GameState;
  onCellClick: (row: number, col: number) => void;
  onMineSelect: (type: MineType) => void;
  onStart: () => void;
}) {
  const canStart = state.mines.filter((mine) => mine.type !== "decoy").length > 0;
  const mineTypes = unlockedMines(state.config.round);
  if (state.selectedDirective === "decoy") mineTypes.push("decoy");

  const synergy = SYNERGIES.find(
    (item) => item.directive === state.selectedDirective && state.mines.some((mine) => mine.type === item.mine),
  );

  return (
    <main className="screen game-layout">
      <TerminalFrame title={`РАУНД ${state.config.round} - ФАЗА РАССТАНОВКИ`}>
        <div className="status-strip">
          <div className="status-chip">
            <span className="status-chip__label">МИНЫ</span>
            <strong>{state.mines.length}/{totalMineLimit(state)}</strong>
          </div>
          <div className="status-chip">
            <span className="status-chip__label">ДИРЕКТИВА</span>
            <strong>{state.selectedDirective ? DIRECTIVES[state.selectedDirective].name : "---"}</strong>
          </div>
          <div className="status-chip">
            <span className="status-chip__label">ЦЕЛЬ</span>
            <strong>ЗАЩИТИТЬ [★]</strong>
          </div>
        </div>

        {synergy ? <div className="synergy-line">&gt; [СИНЕРГИЯ] {synergy.name}: {synergy.text}</div> : null}

        <div className="placement-summary">
          <span>Выбери тип мины и расставь ловушки так, чтобы сапер не дошел до [★].</span>
          <span>Выбрано: {MINE_DEFS[state.selectedMine].glyph} {MINE_DEFS[state.selectedMine].name}</span>
        </div>

        <div className="mine-palette">
          {mineTypes.map((type) => {
            const def = MINE_DEFS[type];
            const left = availableMineCount(state, type) - placedMineCount(state, type);
            return (
              <button
                className={`mine-token ${state.selectedMine === type ? "mine-token--active" : ""}`}
                key={type}
                disabled={left <= 0 && state.selectedMine !== type}
                onClick={() => onMineSelect(type)}
                title={def.description}
              >
                <span>{def.glyph}</span>
                <small>{left}</small>
              </button>
            );
          })}
        </div>

        <Board
          board={state.board}
          mines={state.mines}
          defuse={state.defuse}
          sappers={state.sappers}
          phase="placement"
          onCellClick={onCellClick}
        />

        <div className="footer-help">
          <span>Тап по клетке: поставить или убрать {MINE_DEFS[state.selectedMine].name}</span>
          <button className="terminal-button terminal-button--primary" disabled={!canStart} onClick={onStart}>
            <Play size={18} /> ЗАПУСТИТЬ САПЕРА
          </button>
        </div>
      </TerminalFrame>
    </main>
  );
}
