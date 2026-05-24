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
      <TerminalFrame title={`ROUND ${state.config.round} — MINES: ${state.mines.length}/${totalMineLimit(state)}`}>
        <div className="hud-row">
          <span>DIRECTIVE: [{state.selectedDirective ? DIRECTIVES[state.selectedDirective].name : "---"}]</span>
        </div>
        {synergy ? <div className="synergy-line">&gt; [SYNERGY] {synergy.name}: {synergy.text}</div> : null}
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
          <span>ЛКМ = поставить/убрать выбранную мину: {MINE_DEFS[state.selectedMine].name}</span>
          <button className="terminal-button terminal-button--primary" disabled={!canStart} onClick={onStart}>
            <Play size={18} /> READY — START MISSION
          </button>
        </div>
      </TerminalFrame>
    </main>
  );
}
