import { Cell, Coord, GeminiSettings, MachineMove, Mine, Sapper } from "./types";
import { cellName, coordKey, parseCellName } from "./logic";

const GEMINI_KEYS = [
  "ТВОЙ_КЛЮЧ_1",
  "ТВОЙ_КЛЮЧ_2",
  "ТВОЙ_КЛЮЧ_3",
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
  return `Ты сапёр-эксперт. Поле ${board.length}x${board.length}.
Текущая позиция сапёра: ${cellName(sapper.row, sapper.col)}.
Открытые клетки с цифрами: ${opened.length ? opened.join(", ") : "нет"}.
Закрытые непосещённые клетки: ${closed.join(", ")}.
Defuse Point находится на: ${cellName(defuse.row, defuse.col)}.
Какую закрытую клетку открыть следующей?
Ответь строго JSON без markdown: {"cell":"D4","reason":"вероятность мины низкая"}`;
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
    reason: "локальный fallback выбрал непосещённую клетку с минимальным риском",
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
  const thoughts: string[] = [`> ${settings.model}: анализ поля ${board.length}x${board.length}...`];
  const usableKeys = GEMINI_KEYS.filter((key) => !key.startsWith("ТВОЙ_КЛЮЧ"));

  if (!usableKeys.length) {
    const move = localFallbackMove(board, defuse, sapper, mines);
    return {
      move,
      usedFallback: true,
      thoughts: [...thoughts, "> Gemini keys не настроены в src/game/gemini.ts. SYSTEM FALLBACK.", `> ${move.cell}: ${move.reason}`],
      settings: { ...settings, status: "Gemini keys missing. Local fallback active." },
    };
  }

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
    thoughts: [...thoughts, "> Все Gemini ключи исчерпаны. SYSTEM FALLBACK.", `> ${move.cell}: ${move.reason}`],
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
