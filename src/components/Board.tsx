import type { CSSProperties } from "react";
import { Cell, Coord, Mine, Sapper } from "../game/types";
import { cellName, mineAt } from "../game/logic";
import { MINE_DEFS } from "../game/data";

export function Board({
  board,
  mines,
  defuse,
  sappers,
  phase,
  sapperView = false,
  onCellClick,
}: {
  board: Cell[][];
  mines: Mine[];
  defuse: Coord;
  sappers: Sapper[];
  phase: "placement" | "running" | "result";
  sapperView?: boolean;
  onCellClick?: (row: number, col: number) => void;
}) {
  return (
    <div
      className="board"
      style={{ "--board-size": board.length } as CSSProperties}
      role="grid"
      aria-label="Minefield"
    >
      {board.flat().map((cell) => {
        const mine = mineAt(mines, cell.row, cell.col);
        const sapper = sappers.find((item) => item.row === cell.row && item.col === cell.col && item.alive);
        const isDefuse = defuse.row === cell.row && defuse.col === cell.col;
        const showMine = !sapperView && (phase === "placement" || phase === "result" || cell.exploded);
        const content = sapper
          ? ">_"
          : isDefuse
            ? "[★]"
            : sapperView && cell.exploded
              ? "[✕]"
              : sapperView && !cell.revealed
                ? "[■]"
            : showMine && mine
              ? MINE_DEFS[mine.type].glyph
              : cell.revealed
                ? cell.displayValue || ""
                : "";
        return (
          <button
            className={[
              "cell",
              isDefuse ? "cell--defuse" : "",
              cell.revealed ? "cell--revealed" : "",
              cell.exploded ? "cell--exploded" : "",
              sapper ? "cell--sapper" : "",
              mine && showMine ? "cell--mine" : "",
              cell.revealed ? `cell--value-${Math.min(cell.displayValue, 5)}` : "",
              sapperView && !cell.revealed ? "cell--closed-sapper" : "",
            ].join(" ")}
            key={`${cell.row}:${cell.col}`}
            onClick={() => onCellClick?.(cell.row, cell.col)}
            title={cellName(cell.row, cell.col)}
            type="button"
            role="gridcell"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
