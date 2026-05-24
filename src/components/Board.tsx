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
        const sapper = phase !== "placement"
          ? sappers.find((item) => item.row === cell.row && item.col === cell.col && item.alive)
          : undefined;
        const isDefuse = defuse.row === cell.row && defuse.col === cell.col;
        // MY VIEW always shows mines; SAPPER VIEW never shows mines
        const showMine = !sapperView;
        // Show numbers during placement on non-mine cells so player can plan strategy
        const showNumber =
          (phase === "placement" && !mine) ||
          (cell.revealed && cell.displayValue > 0);
        let content: string | number = "";
        if (sapper) {
          content = ">_";
        } else if (isDefuse) {
          content = "[★]";
        } else if (cell.exploded) {
          content = "[✕]";
        } else if (sapperView) {
          if (!cell.revealed) {
            content = "[■]";
          } else if (cell.displayValue > 0) {
            content = cell.displayValue;
          }
        } else if (showMine && mine) {
          content = MINE_DEFS[mine.type].glyph;
        } else if (showNumber && cell.displayValue > 0) {
          content = cell.displayValue;
        }
        return (
          <button
            className={[
              "cell",
              isDefuse ? "cell--defuse" : "",
              cell.revealed ? "cell--revealed" : "",
              cell.exploded ? "cell--exploded" : "",
              sapper ? "cell--sapper" : "",
              mine && showMine ? "cell--mine" : "",
              showNumber ? `cell--value-${Math.min(cell.displayValue, 5)}` : "",
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
