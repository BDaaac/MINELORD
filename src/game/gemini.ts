import { Cell, Coord, GeminiSettings, MachineMove, Mine, Sapper } from "./types";
import { cellName, coordKey, parseCellName } from "./logic";

function keyLabel(index: number) {
  return `KEY_${String(index + 1).padStart(2, "0")}`;
}

function buildPrompt(board: Cell[][], defuse: Coord, sapper: Sapper) {
  const visited = new Set(sapper.visitedCells);
  const opened = board
    .flat()
    .filter((cell) => cell.revealed)
    .map((cell) => `${cellName(cell.row, cell.col)}=${cell.displayValue}`);
  const closed = board
    .flat()
    .filter((cell) => !cell.revealed && !visited.has(coordKey(cell)))
    .map((cell) => cellName(cell.row, cell.col));

  return `You are an expert sapper on a ${board.length}x${board.length} board.
Current sapper position: ${cellName(sapper.row, sapper.col)}.
Opened cells with numbers: ${opened.length ? opened.join(", ") : "none"}.
Closed unvisited cells: ${closed.join(", ")}.
Defuse Point is at: ${cellName(defuse.row, defuse.col)}.
Choose exactly one next closed cell to open.
Return strict JSON only: {"cell":"D4","reason":"short sentence"}`;
}

function localFallbackMove(board: Cell[][], defuse: Coord, sapper: Sapper, mines: Mine[]): MachineMove {
  const visited = new Set(sapper.visitedCells);
  const candidates = board
    .flat()
    .filter((cell) => !cell.revealed && !visited.has(coordKey(cell)))
    .map((cell) => {
      const distance = Math.abs(cell.row - defuse.row) + Math.abs(cell.col - defuse.col);
      const fromSapper = Math.abs(cell.row - sapper.row) + Math.abs(cell.col - sapper.col);
      const suspected =
        cell.displayValue +
        mines.filter((mine) => Math.abs(mine.row - cell.row) <= 1 && Math.abs(mine.col - cell.col) <= 1).length;
      return { cell, score: distance + fromSapper * 0.5 + suspected * 2 };
    });

  candidates.sort((a, b) => a.score - b.score);
  const pick = candidates[0]?.cell;
  return {
    cell: pick ? cellName(pick.row, pick.col) : cellName(sapper.row, sapper.col),
    reason: "local fallback selected the lowest-risk unvisited cell",
  };
}

export interface GeminiMoveResult {
  move: MachineMove;
  settings: GeminiSettings;
  thoughts: string[];
  usedFallback: boolean;
}

export async function requestMachineMove(
  settings: GeminiSettings,
  board: Cell[][],
  defuse: Coord,
  sapper: Sapper,
  mines: Mine[],
): Promise<GeminiMoveResult> {
  const thoughts: string[] = [`> ${settings.model}: analyzing ${board.length}x${board.length} board...`];

  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.model,
        prompt: buildPrompt(board, defuse, sapper),
      }),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        move: MachineMove;
        keyIndex: number;
        status: string;
      };

      if (payload.move && parseCellName(payload.move.cell)) {
        return {
          move: payload.move,
          usedFallback: false,
          thoughts: [...thoughts, `> ${keyLabel(payload.keyIndex)} active.`, `> Cell ${payload.move.cell}: ${payload.move.reason}`],
          settings: {
            ...settings,
            activeKeyIndex: payload.keyIndex,
            requestCounts: {
              ...settings.requestCounts,
              [keyLabel(payload.keyIndex)]: (settings.requestCounts[keyLabel(payload.keyIndex)] || 0) + 1,
            },
            status: payload.status || `${keyLabel(payload.keyIndex)} active`,
          },
        };
      }
    }
  } catch {
    thoughts.push("> Gemini proxy unavailable. Switching to local fallback.");
  }

  const move = localFallbackMove(board, defuse, sapper, mines);
  return {
    move,
    usedFallback: true,
    thoughts: [...thoughts, "> AI proxy offline. LOCAL FALLBACK ACTIVE.", `> ${move.cell}: ${move.reason}`],
    settings: {
      ...settings,
      status: "Proxy offline. Local fallback active.",
    },
  };
}

export function activeGeminiKeyLabel(index: number) {
  return keyLabel(index);
}
