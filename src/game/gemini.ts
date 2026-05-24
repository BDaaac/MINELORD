import { Cell, Coord, GeminiSettings, MachineMove, Mine, Sapper } from "./types";
import { cellName, coordKey, parseCellName } from "./logic";

const GEMINI_KEYS = [
  "AIzaSyCwlGOjLkDFq25uJ4Bi305x2irxwQmL21g",
  "AIzaSyDajSjnMOBV6Q0Ki88LkFiSDqMsL-A-ICw",
  "AIzaSyAVduvmeZUhM__nXArnjcE3c84TaxJwQ2E",
  "AIzaSyBabCxgxvshuHf9aeKLj3PPNq-s_3t-p2E",
  "AIzaSyAS-7MM8mqY39lMgBn0r2fwwQh7adZQpxo",
  "AIzaSyDUH8uD-opAHEhqzubaUtuA_PwgBPPsY6w",
  "AIzaSyAQvYlMLmx0OLnMqIO7smxoeQsDdkSYlvE",
  "AIzaSyDD6yyxvTBpMjoZbkK8-3-xSuItEQaOfv8",
  "AIzaSyD_KR3X42YbKM0gMwbDcAi5Q_OpcnklPvk",
  "AIzaSyC9Cqkg26cWnz-OGoqJSmEIi8XuLoegab8",
  "AIzaSyAW2KWPXV-Fs5SXL8risq28UtyHIK-UaIM",
  "AIzaSyD1OwwnzHKNrk7mXqXKpezwq8VGIlTupLg",
  "AIzaSyBlj5z9mtDSKvyjv3L5X27PCG1ZpkadQoA",
];

let currentKeyIndex = 0;

const quotaStatuses = new Set([403, 429]);

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

function extractJson(text: string): MachineMove | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<MachineMove>;
    if (typeof parsed.cell === "string" && typeof parsed.reason === "string") {
      return { cell: parsed.cell.toUpperCase(), reason: parsed.reason };
    }
  } catch {
    return null;
  }
  return null;
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
  const usableKeys = Array.from(new Set(GEMINI_KEYS.map((key) => key.trim()).filter(Boolean)));

  for (let i = 0; i < usableKeys.length; i += 1) {
    const keyIndex = currentKeyIndex % usableKeys.length;
    const key = usableKeys[keyIndex];
    try {
      thoughts.push(`> ${keyLabel(keyIndex)} active.`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: buildPrompt(board, defuse, sapper) }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (quotaStatuses.has(response.status)) {
        currentKeyIndex += 1;
        continue;
      }

      const payload = await response.text();
      if (!response.ok) throw new Error(`${response.status}: ${payload}`);
      const parsedPayload = JSON.parse(payload);
      const text =
        parsedPayload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") ||
        payload;
      const move = extractJson(text);
      if (!move || !parseCellName(move.cell)) throw new Error(`Bad Gemini JSON: ${text}`);

      return {
        move,
        usedFallback: false,
        thoughts: [...thoughts, `> Cell ${move.cell}: ${move.reason}`],
        settings: {
          ...settings,
          activeKeyIndex: keyIndex,
          requestCounts: {
            ...settings.requestCounts,
            [keyLabel(keyIndex)]: (settings.requestCounts[keyLabel(keyIndex)] || 0) + 1,
          },
          status: `${keyLabel(keyIndex)} active`,
        },
      };
    } catch {
      currentKeyIndex += 1;
    }
  }

  const move = localFallbackMove(board, defuse, sapper, mines);
  return {
    move,
    usedFallback: true,
    thoughts: [...thoughts, "> All Gemini keys failed. SYSTEM FALLBACK.", `> ${move.cell}: ${move.reason}`],
    settings: {
      ...settings,
      activeKeyIndex: currentKeyIndex % Math.max(1, usableKeys.length),
      status: "All Gemini keys failed. Local fallback active.",
    },
  };
}

export function activeGeminiKeyLabel(index: number) {
  return keyLabel(index);
}
