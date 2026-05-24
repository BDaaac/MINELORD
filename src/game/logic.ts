import { BOSS_NICKNAMES, DEFAULT_MODEL, DIRECTIVES, initialInventory, MINE_DEFS, MOVE_PHRASES, ROUND_TABLE, SAPPER_NICKNAMES, SHOP_ITEMS } from "./data";
import { awardAchievement, setAchievementProgress } from "./achievements";
import {
  AiType,
  Cell,
  Coord,
  DirectiveId,
  GameState,
  Mine,
  MineType,
  RoundConfig,
  Sapper,
  ShopOffer,
  UnlockState,
} from "./types";

const dirs = [-1, 0, 1];
const REROLL_COST = 2;

const EMPTY_UNLOCKS: UnlockState = {
  blackout: false,
  doubleMine: false,
  vortex: false,
  ghostField: false,
  forbiddenSlot: false,
};

export function coordKey(coord: Coord) {
  return `${coord.row}:${coord.col}`;
}

export function rerollShop(state: GameState): GameState {
  if (state.stats.coins < REROLL_COST) return state;
  return {
    ...state,
    shopRerolls: state.shopRerolls + 1,
    shopOffers: generateShopOffers(state),
    stats: { ...state.stats, coins: state.stats.coins - REROLL_COST },
    log: appendLog(state.log, `> SUPPLY DEPOT: offers rerolled for ${REROLL_COST} credits.`),
  };
}

export function cellName(row: number, col: number) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

export function parseCellName(name: string): Coord | null {
  const match = /^([A-Z])(\d{1,2})$/i.exec(name.trim());
  if (!match) return null;
  return {
    col: match[1].toUpperCase().charCodeAt(0) - 65,
    row: Number(match[2]) - 1,
  };
}

export function inBounds(size: number, coord: Coord) {
  return coord.row >= 0 && coord.row < size && coord.col >= 0 && coord.col < size;
}

export function neighbors(size: number, row: number, col: number) {
  const cells: Coord[] = [];
  for (const dr of dirs) {
    for (const dc of dirs) {
      if (dr === 0 && dc === 0) continue;
      const next = { row: row + dr, col: col + dc };
      if (inBounds(size, next)) cells.push(next);
    }
  }
  return cells;
}

export function orthogonalNeighbors(size: number, row: number, col: number) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter((coord) => inBounds(size, coord));
}

export function getRound(index: number): RoundConfig {
  if (index < ROUND_TABLE.length) return ROUND_TABLE[index];
  const aiPool: AiType[] = ["Rookie+", "Analyst", "Gambler", "Hunter", "The Ghost"];
  return {
    round: index + 1,
    sappers: 2 + (index % 3),
    size: 10,
    mines: 7,
    ai: aiPool[index % aiPool.length],
  };
}

export function createBoard(size: number, mines: Mine[], directive?: DirectiveId) {
  const board = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col): Cell => {
      const adjacent = neighbors(size, row, col);
      const real = adjacent.filter((n) => {
        const mine = mines.find((item) => item.row === n.row && item.col === n.col);
        return mine && mine.type !== "phantom";
      }).length;
      const mirrorPenalty = adjacent.some((n) =>
        mines.some((mine) => mine.row === n.row && mine.col === n.col && mine.type === "mirror"),
      )
        ? 2
        : 0;
      const decoyBoost = adjacent.filter((n) =>
        mines.some((mine) => mine.row === n.row && mine.col === n.col && mine.type === "decoy"),
      ).length;
      // CLUSTER: center zone shows +1 (confuses AI about danger density)
      const clusterBoost =
        directive === "cluster" && row >= 1 && row <= size - 2 && col >= 1 && col <= size - 2 ? 1 : 0;
      return {
        row,
        col,
        revealed: false,
        value: real + decoyBoost,
        displayValue: Math.max(0, real + decoyBoost - mirrorPenalty + clusterBoost),
        exploded: false,
      };
    }),
  );
  // MIMIC: highest-value non-mine cell becomes invisible (shows 0)
  if (directive === "mimic" && mines.length > 0) {
    let maxVal = 0;
    let mr = -1;
    let mc = -1;
    for (const row of board) {
      for (const cell of row) {
        if (!mines.some((m) => m.row === cell.row && m.col === cell.col) && cell.displayValue > maxVal) {
          maxVal = cell.displayValue;
          mr = cell.row;
          mc = cell.col;
        }
      }
    }
    if (mr >= 0) board[mr][mc] = { ...board[mr][mc], displayValue: 0 };
  }
  return board;
}

export function randomDefuse(size: number): Coord {
  const min = size >= 5 ? 1 : 0;
  const max = size >= 5 ? size - 2 : size - 1;
  return {
    row: min + Math.floor(Math.random() * (max - min + 1)),
    col: min + Math.floor(Math.random() * (max - min + 1)),
  };
}

export function createSappers(config: RoundConfig): Sapper[] {
  const size = config.size;
  const usedCells = new Set<string>();
  const edgeCells = {
    top:    Array.from({ length: size }, (_, col) => ({ row: 0,        col })),
    bottom: Array.from({ length: size }, (_, col) => ({ row: size - 1, col })),
    left:   Array.from({ length: size }, (_, row) => ({ row, col: 0        })),
    right:  Array.from({ length: size }, (_, row) => ({ row, col: size - 1 })),
  } as const;
  const edgeOrder = shuffle(["top", "bottom", "left", "right"] as const);
  const bossNick = BOSS_NICKNAMES[config.ai];
  const nickPool = shuffle([...SAPPER_NICKNAMES]);

  return Array.from({ length: config.sappers }, (_, index) => {
    const edge = edgeOrder[index % edgeOrder.length];
    const available = edgeCells[edge].filter((c) => !usedCells.has(coordKey(c)));
    const allEdge = (["top", "bottom", "left", "right"] as const)
      .flatMap((e) => edgeCells[e])
      .filter((c) => !usedCells.has(coordKey(c)));
    const pool = available.length ? available : allEdge;
    const start = shuffle(pool)[0] ?? { row: 0, col: 0 };
    usedCells.add(coordKey(start));
    const nickname = bossNick ?? (nickPool[index] || `АГЕНТ-${index + 1}`);
    return {
      id: `sapper-${index + 1}`,
      name: `SAPPER_${String(index + 1).padStart(2, "0")}`,
      nickname,
      row: start.row,
      col: start.col,
      alive: true,
      reached: false,
      steps: 0,
      phased: false,
      stuck: 0,
      type: config.ai,
      visitedCells: new Set([coordKey(start)]),
    };
  });
}

export function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickPhrase(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] || "";
}

function readUnlocks(): UnlockState {
  try {
    return { ...EMPTY_UNLOCKS, ...JSON.parse(localStorage.getItem("minelord-unlocks") || "{}") };
  } catch {
    return { ...EMPTY_UNLOCKS };
  }
}

function saveUnlocks(unlocks: UnlockState) {
  localStorage.setItem("minelord-unlocks", JSON.stringify(unlocks));
}

function fmtPhrase(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? key));
}

function sapLog(sapper: Sapper, msg: string): string {
  return `САПЁР [${sapper.nickname}]: ${msg}`;
}

// saboteur и swap требуют UI-взаимодействия — не реализованы
const UNIMPLEMENTED_DIRECTIVES = new Set<DirectiveId>(["saboteur", "swap"]);

export function directiveChoices(deck: DirectiveId[]) {
  const unique = Array.from(new Set(deck.length ? deck : Object.keys(DIRECTIVES) as DirectiveId[]))
    .filter((id) => !UNIMPLEMENTED_DIRECTIVES.has(id));
  return shuffle(unique).slice(0, Math.min(3, unique.length));
}

export function createInitialGame(): GameState {
  const isFirstTime = !localStorage.getItem("minelord-visited");
  if (isFirstTime) localStorage.setItem("minelord-visited", "1");
  awardAchievement("boot_sequence");
  const config = getRound(0);
  const defuse = randomDefuse(config.size);
  const mines: Mine[] = [];
  return {
    screen: isFirstTime ? "howto" : "title",
    roundIndex: 0,
    config,
    board: createBoard(config.size, mines),
    mines,
    defuse,
    sappers: createSappers(config),
    selectedMine: "normal",
    directiveChoices: directiveChoices(initialInventory.directiveDeck),
    timer: initialInventory.placementSeconds,
    result: null,
    log: ["> MINELORD boot sequence ready."],
    inventory: { ...initialInventory },
    stats: {
      coins: 0,
      earnedThisRound: 0,
      explosions: 0,
      speedKills: 0,
      survivedRounds: 0,
      bestRound: Number(localStorage.getItem("minelord-best") || "0"),
    },
    gemini: {
      model: localStorage.getItem("minelord-gemini-model") || DEFAULT_MODEL,
      activeKeyIndex: 0,
      exhaustedKeyIndexes: [],
      requestCounts: {},
      status: "Gemini offline until The Machine.",
    },
    machineThoughts: [],
    flash: false,
    paused: false,
    confirmMenu: false,
    sapperView: false,
    pendingAiMove: undefined,
    shopOffers: [],
    shopRerolls: 0,
    unlocks: readUnlocks(),
  };
}

export function setupRound(state: GameState, roundIndex: number): GameState {
  const config = getRound(roundIndex);
  const defuse = randomDefuse(config.size);
  const mines: Mine[] = [];
  const directiveDeck = state.inventory.directiveDeck.length
    ? state.inventory.directiveDeck
    : state.inventory.directiveDiscard.length
      ? shuffle(state.inventory.directiveDiscard)
      : initialInventory.directiveDeck;
  const next = {
    ...state,
    screen: "directive" as const,
    roundIndex,
    config,
    board: createBoard(config.size, mines),
    mines,
    defuse,
    sappers: createSappers(config),
    selectedMine: "normal" as MineType,
    selectedDirective: undefined,
    directiveChoices: directiveChoices(directiveDeck),
    inventory: {
      ...state.inventory,
      directiveDeck,
      directiveDiscard: state.inventory.directiveDeck.length ? state.inventory.directiveDiscard : [],
    },
    timer: state.inventory.placementSeconds,
    result: null,
    log: [`> ROUND ${config.round}: ${config.ai}. Выберите джокер.`],
    stats: { ...state.stats, earnedThisRound: 0, explosions: 0, speedKills: 0 },
    machineThoughts: [],
    flash: false,
    paused: false,
    confirmMenu: false,
    sapperView: false,
    pendingAiMove: undefined,
    shopOffers: [],
    shopRerolls: 0,
  };
  return next;
}

export function beginPlacement(state: GameState, directive: DirectiveId): GameState {
  awardAchievement("first_directive");
  const deck = state.inventory.directiveDeck.filter((id) => id !== directive);
  const discard = [...state.inventory.directiveDiscard, directive];
  return {
    ...state,
    screen: state.config.boss ? "boss" : "placement",
    selectedDirective: directive,
    board: createBoard(state.config.size, state.mines, directive),
    inventory: { ...state.inventory, directiveDeck: deck, directiveDiscard: discard },
    timer: state.inventory.placementSeconds,
    log: [`> DIRECTIVE ACCEPTED. MISSION BEGINS.`, `> ${DIRECTIVES[directive].name} armed.`],
  };
}

export function afterBossIntro(state: GameState): GameState {
  return { ...state, screen: "placement", timer: state.inventory.placementSeconds };
}

export function startRunning(state: GameState): GameState {
  const hasActiveSynergy = state.selectedDirective
    ? state.mines.some((mine) =>
        [
          ["chain", "nova"],
          ["blackout", "phantom"],
          ["overclock", "timer"],
          ["intel", "watcher"],
          ["doubleMine", "skull"],
        ].some(([directive, mineType]) => state.selectedDirective === directive && mine.type === mineType),
      )
    : false;
  if (hasActiveSynergy) awardAchievement("synergy_online");
  const breachLogs = state.sappers.map((s) => {
    const phrase = fmtPhrase(pickPhrase(MOVE_PHRASES.spawn), { cell: cellName(s.row, s.col) });
    return `> ${sapLog(s, phrase)}`;
  });
  return {
    ...state,
    screen: "running",
    board: createBoard(state.config.size, state.mines, state.selectedDirective),
    paused: false,
    confirmMenu: false,
    pendingAiMove: undefined,
    log: [
      `> ${state.config.ai}: запуск маршрута к ${cellName(state.defuse.row, state.defuse.col)}.`,
      state.config.ai === "The Machine" ? `> ${state.gemini.model} connected...` : "> AI анализирует поле...",
      ...breachLogs,
    ],
  };
}

export function availableMineCount(state: GameState, type: MineType) {
  if (type === "decoy") return state.selectedDirective === "decoy" ? 1 : 0;
  return state.inventory[type] || 0;
}

export function unlockedMines(round: number) {
  return (Object.keys(MINE_DEFS) as MineType[]).filter(
    (type) => type !== "decoy" && MINE_DEFS[type].unlockedRound <= round,
  );
}

export function placedMineCount(state: GameState, type?: MineType) {
  return state.mines.filter((mine) => !type || mine.type === type).length;
}

export function totalMineLimit(state: GameState) {
  return state.config.mines + Math.max(0, state.inventory.normal - 3);
}

export function canPlaceMine(state: GameState, type: MineType, coord: Coord) {
  if (!inBounds(state.config.size, coord)) return false;
  if (coord.row === state.defuse.row && coord.col === state.defuse.col) return false;
  if (state.mines.some((mine) => mine.row === coord.row && mine.col === coord.col)) return false;
  if (state.mines.length >= totalMineLimit(state)) return false;
  if (placedMineCount(state, type) >= availableMineCount(state, type)) return false;
  if (type !== "normal" && type !== "decoy" && placedMineCount(state, type) >= MINE_DEFS[type].maxSpecial) return false;
  return true;
}

export function toggleMine(state: GameState, row: number, col: number): GameState {
  if (state.screen !== "placement") return state;
  const existing = state.mines.find((mine) => mine.row === row && mine.col === col);
  let mines = state.mines;
  if (existing) {
    mines = state.mines.filter((mine) => mine.id !== existing.id);
  } else if (canPlaceMine(state, state.selectedMine, { row, col })) {
    mines = [
      ...state.mines,
      { id: `${state.selectedMine}-${Date.now()}-${row}-${col}`, row, col, type: state.selectedMine },
    ];
  }
  return { ...state, mines, board: createBoard(state.config.size, mines, state.selectedDirective) };
}

export function mineAt(mines: Mine[], row: number, col: number) {
  return mines.find((mine) => mine.row === row && mine.col === col);
}

export function distance(a: Coord, b: Coord) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function allClosedUnvisitedCells(state: GameState, sapper: Sapper) {
  const visited = new Set(sapper.visitedCells);
  return state.board.flat().filter((cell) => {
    const key = coordKey(cell);
    const isDefuse = cell.row === state.defuse.row && cell.col === state.defuse.col;
    return !visited.has(key) && (!cell.revealed || isDefuse);
  });
}

function eliminateSapperAsStuck(state: GameState, sapperId: string, message: string): GameState {
  const sappers = state.sappers.map((item) => (item.id === sapperId ? { ...item, alive: false } : item));
  const logs = appendLog(state.log, message);
  if (sappers.every((item) => !item.alive || item.reached)) {
    const cleanSweep = 2;
    const bestRound = Math.max(state.stats.bestRound, state.config.round);
    localStorage.setItem("minelord-best", String(bestRound));
    return {
      ...state,
      sappers,
      result: "win",
      screen: "result",
      stats: {
        ...state.stats,
        coins: state.stats.coins + cleanSweep,
        earnedThisRound: state.stats.earnedThisRound + cleanSweep,
        survivedRounds: Math.max(state.stats.survivedRounds, state.config.round),
        bestRound,
      },
      log: appendLog(logs, `> CLEAN SWEEP. Саперы потеряли маршрут. +${cleanSweep} монет`),
    };
  }
  return { ...state, sappers, log: logs };
}

export function chooseAiMove(state: GameState, sapper: Sapper): Coord | null {
  const size = state.config.size;
  const candidates = orthogonalNeighbors(size, sapper.row, sapper.col)
    .concat([
      { row: sapper.row + Math.sign(state.defuse.row - sapper.row), col: sapper.col },
      { row: sapper.row, col: sapper.col + Math.sign(state.defuse.col - sapper.col) },
    ])
    .filter((coord) => inBounds(size, coord));
  const unique = Array.from(new Map(candidates.map((coord) => [coordKey(coord), coord])).values());
  const visited = new Set(sapper.visitedCells);
  const available = unique.filter((coord) => {
    const key = coordKey(coord);
    const cell = state.board[coord.row][coord.col];
    const isDefuse = coord.row === state.defuse.row && coord.col === state.defuse.col;
    return !visited.has(key) && (!cell.revealed || isDefuse);
  });
  const pool = available.length ? available : allClosedUnvisitedCells(state, sapper).map((cell) => ({ row: cell.row, col: cell.col }));
  if (!pool.length) return null;
  const foggy = state.selectedDirective === "fog" && sapper.steps < 5;
  const totalBlind = state.selectedDirective === "blackout" && hasMineAccess(state, "phantom") && sapper.steps < 3;
  const ghostZero = state.selectedDirective === "ghostField" && sapper.steps < 4;
  if (foggy || totalBlind || ghostZero || state.config.ai === "Rookie") return shuffle(pool)[0] || null;

  const scored = pool.map((coord) => {
    const cell = state.board[coord.row][coord.col];
    const mine = mineAt(state.mines, coord.row, coord.col);
    const bait = mine?.type === "bait" ? -5 : 0;
    const revealedPenalty = cell.revealed ? 4 : 0;
    const centerFear =
      state.config.ai === "The Colonel"
        ? Math.max(0, 3 - distance(coord, { row: Math.floor(size / 2), col: Math.floor(size / 2) }))
        : 0;
    const hunterRisk = state.config.ai === "Hunter" ? Math.max(0, 4 - cell.displayValue) : cell.displayValue;
    const gambleRisk = state.config.ai === "Gambler" && Math.random() < 0.28 ? -cell.displayValue : cell.displayValue;
    const ghostMemory = state.config.ai === "The Ghost" ? Math.abs(coord.row - coord.col) % 3 : 0;
    const risk =
      (state.config.ai === "Hunter" ? hunterRisk : gambleRisk) * 3 + revealedPenalty + centerFear + ghostMemory + bait;
    return {
      coord,
      score: distance(coord, state.defuse) * 2 + risk,
    };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.coord || null;
}

export function applyAiMove(state: GameState, sapperId: string, forcedMove?: Coord, reason?: string): GameState {
  const sapper = state.sappers.find((item) => item.id === sapperId);
  if (!sapper || !sapper.alive || sapper.reached || state.result) return state;
  const maxMoves = state.config.size * state.config.size * 2;
  if (sapper.steps >= maxMoves) {
    return eliminateSapperAsStuck(state, sapperId, `> ${sapLog(sapper, "нет выхода. Зациклился — отступаю.")} (шаг ${sapper.steps})`);
  }
  if (sapper.stuck > 0) {
    const sappers = state.sappers.map((item) =>
      item.id === sapperId ? { ...item, stuck: item.stuck - 1, steps: item.steps + 1 } : item,
    );
    return { ...state, sappers, log: appendLog(state.log, `> ${sapLog(sapper, "заблокирован... жду.")}`) };
  }
  // PARANOIA: каждый 3-й шаг AI теряет ориентир и пропускает ход
  if (state.selectedDirective === "paranoia" && (sapper.steps + 1) % 3 === 0) {
    const sappers = state.sappers.map((item) =>
      item.id === sapperId ? { ...item, steps: item.steps + 1 } : item,
    );
    return { ...state, sappers, log: appendLog(state.log, `> ${sapLog(sapper, "PARANOIA: теряю ориентир. Замираю.")}`) };
  }

  const visited = new Set(sapper.visitedCells);
  const forcedCell = forcedMove && inBounds(state.config.size, forcedMove) ? state.board[forcedMove.row][forcedMove.col] : null;
  const forcedIsDefuse = forcedMove?.row === state.defuse.row && forcedMove.col === state.defuse.col;
  const allowedForcedKeys = new Set(
    orthogonalNeighbors(state.config.size, sapper.row, sapper.col)
      .concat([
        { row: sapper.row + Math.sign(state.defuse.row - sapper.row), col: sapper.col },
        { row: sapper.row, col: sapper.col + Math.sign(state.defuse.col - sapper.col) },
      ])
      .filter((coord) => inBounds(state.config.size, coord))
      .map((coord) => coordKey(coord)),
  );
  const canUseForced =
    forcedMove &&
    forcedCell &&
    allowedForcedKeys.has(coordKey(forcedMove)) &&
    !visited.has(coordKey(forcedMove)) &&
    (!forcedCell.revealed || forcedIsDefuse);
  const move = canUseForced ? forcedMove : chooseAiMove(state, sapper);
  if (!move) {
    return eliminateSapperAsStuck(state, sapperId, `> ${sapLog(sapper, "доступных клеток нет. Отступаю.")}`);
  }
  const mine = mineAt(state.mines, move.row, move.col);
  const cellLabel = cellName(move.row, move.col);
  const nextBoard = state.board.map((row) => row.map((cell) => ({ ...cell })));
  let nextMines = [...state.mines];
  const nextSappers = state.sappers.map((item) => ({ ...item }));
  const target = nextSappers.find((item) => item.id === sapperId)!;
  target.row = move.row;
  target.col = move.col;
  target.steps += 1;
  target.visitedCells = new Set([...target.visitedCells, coordKey(move)]);

  const logs = [...state.log];
  const thinkPool = MOVE_PHRASES.think[sapper.type as string] ?? MOVE_PHRASES.think["Rookie"];
  logs.push(`> ${sapLog(sapper, pickPhrase(thinkPool))}`);
  if (reason) {
    logs.push(`> ${sapLog(sapper, `${cellLabel} — ${reason}`)}`);
  }

  let stats = state.stats;
  let flash = false;
  if (mine && mine.type !== "decoy") {
    if (mine.type === "sticky" && target.stuck === 0) {
      target.stuck = 2;
      logs.push(`> ${cellLabel}: Sticky активирована. Сапер теряет 2 хода.`);
    } else if (mine.type === "timer" && mine.armedAtStep === undefined) {
      const fuse = state.selectedDirective === "overclock" ? 3 : 5;
      nextMines = nextMines.map((m) => m.id === mine.id ? { ...m, armedAtStep: target.steps + fuse } : m);
      logs.push(`> ${cellLabel}: TIMER armed. Detonation in ${fuse} AI moves!`);
    } else if (mine.type === "vortex") {
      const unvisited = state.board.flat().filter(
        (cell) =>
          !target.visitedCells.has(coordKey(cell)) &&
          !cell.revealed &&
          !(cell.row === state.defuse.row && cell.col === state.defuse.col) &&
          !mineAt(nextMines, cell.row, cell.col),
      );
      const dest = shuffle(unvisited)[0];
      if (dest) {
        target.row = dest.row;
        target.col = dest.col;
        logs.push(`> ${cellLabel}: 🌀 VORTEX! Сапер телепортирован на ${cellName(dest.row, dest.col)}.`);
      }
      nextMines = nextMines.filter((m) => m.id !== mine.id);
    } else if (mine.type === "watcher") {
      const tempSapper = { ...target, visitedCells: new Set(target.visitedCells) };
      const predicted: string[] = [];
      let tempState: GameState = { ...state, sappers: [tempSapper], mines: nextMines, board: nextBoard };
      const lookahead = state.selectedDirective === "intel" ? 3 : 2;
      for (let i = 0; i < lookahead; i++) {
        const nextMove = chooseAiMove(tempState, tempSapper);
        if (nextMove) {
          predicted.push(cellName(nextMove.row, nextMove.col));
          tempSapper.visitedCells = new Set([...tempSapper.visitedCells, coordKey(nextMove)]);
          tempSapper.row = nextMove.row;
          tempSapper.col = nextMove.col;
          tempState = { ...tempState, sappers: [tempSapper] };
        }
      }
      logs.push(`> ${cellLabel}: 👁️ WATCHER! Следующий маршрут: ${predicted.join(" → ") || "неизвестно"}`);
      nextMines = nextMines.filter((m) => m.id !== mine.id);
      nextBoard[move.row][move.col].revealed = true;
    } else if (mine.type === "lock") {
      target.stuck = 2;
      logs.push(`> ${cellLabel}: 🔒 LOCK! Сапер заблокирован на 2 хода.`);
      nextMines = nextMines.filter((m) => m.id !== mine.id);
    } else if (state.config.ai === "The Ghost" && !target.phased) {
      target.phased = true;
      logs.push(`> ${target.name}: PHASE. Мина проигнорирована один раз.`);
    } else {
      target.alive = false;
      nextBoard[move.row][move.col].exploded = true;
      flash = true;
      const chainRadius = state.selectedDirective === "chain" && mine.type === "nova" ? 2 : 1;
      const chainBonus =
        state.selectedDirective === "chain"
          ? state.mines.filter(
              (candidate) =>
                candidate.id !== mine.id &&
                candidate.type !== "decoy" &&
                Math.max(Math.abs(candidate.row - move.row), Math.abs(candidate.col - move.col)) <= chainRadius,
            ).length
          : 0;
      const speedKill = target.steps < 5 ? 1 : 0;
      const earned = 3 + speedKill * 2 + chainBonus;
      stats = {
        ...stats,
        coins: stats.coins + earned,
        earnedThisRound: stats.earnedThisRound + earned,
        explosions: stats.explosions + 1 + chainBonus,
        speedKills: stats.speedKills + speedKill,
      };
      logs.push(`> ${fmtPhrase(pickPhrase(MOVE_PHRASES.explosion), { cell: cellLabel })} +${earned} монет`);
      localStorage.setItem("minelord-kills", String(Number(localStorage.getItem("minelord-kills") || "0") + 1 + chainBonus));
      awardAchievement("first_blood");
    }
  } else {
    nextBoard[move.row][move.col].revealed = true;
    const val = nextBoard[move.row][move.col].displayValue;
    if (val > 0) {
      logs.push(`> ${sapLog(sapper, fmtPhrase(pickPhrase(MOVE_PHRASES.number), { cell: cellLabel, n: val }))}`);
    } else {
      logs.push(`> ${sapLog(sapper, fmtPhrase(pickPhrase(MOVE_PHRASES.safe), { cell: cellLabel }))}`);
    }
  }

  if (target.alive) {
    const adjacentSkull = nextMines.find(
      (m) =>
        m.type === "skull" &&
        !(m.row === move.row && m.col === move.col) &&
        Math.abs(target.row - m.row) <= 1 &&
        Math.abs(target.col - m.col) <= 1,
    );
    if (adjacentSkull) {
      if (state.selectedDirective === "doubleMine") {
        target.alive = false;
        nextBoard[target.row][target.col].exploded = true;
        flash = true;
        const earned = 5;
        stats = { ...stats, coins: stats.coins + earned, earnedThisRound: stats.earnedThisRound + earned, explosions: stats.explosions + 1 };
        logs.push(`> DEATH FIELD: SKULL ${cellName(adjacentSkull.row, adjacentSkull.col)} punished the bypass. ${target.name} eliminated. +${earned} credits`);
        awardAchievement("first_blood");
        nextMines = nextMines.filter((m) => m.id !== adjacentSkull.id);
      } else {
      const nbs = neighbors(state.config.size, adjacentSkull.row, adjacentSkull.col);
      const triggerMine = nbs
        .map((coord) => mineAt(nextMines, coord.row, coord.col))
        .find((m) => m && m.type !== "skull" && m.type !== "decoy" && m.type !== "vortex" && m.type !== "watcher" && m.type !== "timer");
    if (triggerMine) {
        target.alive = false;
        nextBoard[triggerMine.row][triggerMine.col].exploded = true;
        flash = true;
        const earned = 3;
        stats = { ...stats, coins: stats.coins + earned, earnedThisRound: stats.earnedThisRound + earned, explosions: stats.explosions + 1 };
        logs.push(`> 💀 SKULL ${cellName(adjacentSkull.row, adjacentSkull.col)}: мина ${cellName(triggerMine.row, triggerMine.col)} активирована. ${target.name} уничтожен. +${earned} монет`);
        awardAchievement("first_blood");
        nextMines = nextMines.filter((m) => m.id !== adjacentSkull.id && m.id !== triggerMine.id);
      } else {
        logs.push(`> 💀 SKULL ${cellName(adjacentSkull.row, adjacentSkull.col)}: рядом нет доступных мин.`);
        nextMines = nextMines.filter((m) => m.id !== adjacentSkull.id);
      }
      }
    }
  }

  if (target.alive) {
    const firingTimer = nextMines.find(
      (m) => m.type === "timer" && m.armedAtStep !== undefined && target.steps >= m.armedAtStep,
    );
    if (firingTimer) {
      nextBoard[firingTimer.row][firingTimer.col].exploded = true;
      const dist = Math.abs(target.row - firingTimer.row) + Math.abs(target.col - firingTimer.col);
      if (dist <= 2) {
        target.alive = false;
        flash = true;
        const earned = 3;
        stats = { ...stats, coins: stats.coins + earned, earnedThisRound: stats.earnedThisRound + earned, explosions: stats.explosions + 1 };
        logs.push(`> ⏱️ TIMER ${cellName(firingTimer.row, firingTimer.col)} взорвалась! ${target.name} в зоне. +${earned} монет`);
      } else {
        logs.push(`> ⏱️ TIMER ${cellName(firingTimer.row, firingTimer.col)} взорвалась. Сапер вне зоны.`);
      }
      nextMines = nextMines.filter((m) => m.id !== firingTimer.id);
    }
  }

  if (move.row === state.defuse.row && move.col === state.defuse.col && target.alive) {
    // LAST STAND: 40% шанс взрыва прямо у Defuse Point
    if (state.selectedDirective === "lastStand" && Math.random() < 0.4) {
      target.alive = false;
      nextBoard[move.row][move.col].exploded = true;
      flash = true;
      const earned = 4;
      stats = { ...stats, coins: stats.coins + earned, earnedThisRound: stats.earnedThisRound + earned, explosions: stats.explosions + 1 };
      logs.push(`> ⚡ LAST STAND! ${sapLog(sapper, `ловушка у ${cellLabel}! Уничтожен. +${earned} монет`)}`);
      awardAchievement("first_blood");
      localStorage.setItem("minelord-kills", String(Number(localStorage.getItem("minelord-kills") || "0") + 1));
      const surviving = nextSappers.filter((item) => item.alive && !item.reached);
      if (surviving.length === 0) {
        awardAchievement("clean_sweep");
        if (state.config.ai === "The Colonel") awardAchievement("colonel_down");
        if (state.config.ai === "The Ghost") awardAchievement("ghost_down");
        if (state.config.ai === "The Machine") awardAchievement("machine_down");
        const cleanSweep = 2;
        const bestRound = Math.max(stats.bestRound, state.config.round);
        localStorage.setItem("minelord-best", String(bestRound));
        return {
          ...state, board: nextBoard, mines: nextMines, sappers: nextSappers, flash,
          stats: { ...stats, coins: stats.coins + cleanSweep, earnedThisRound: stats.earnedThisRound + cleanSweep, survivedRounds: Math.max(stats.survivedRounds, state.config.round), bestRound },
          result: "win", screen: "result",
          log: appendLog(logs, `> CLEAN SWEEP. +${cleanSweep} монет`),
        };
      }
      return { ...state, board: nextBoard, mines: nextMines, sappers: nextSappers, stats, flash, log: appendLog(logs) };
    }
    target.reached = true;
    logs.push(`> ${fmtPhrase(pickPhrase(MOVE_PHRASES.defuse), { cell: cellLabel })}`);
    localStorage.setItem("minelord-games", String(Number(localStorage.getItem("minelord-games") || "0") + 1));
    return {
      ...state,
      board: nextBoard,
      mines: nextMines,
      sappers: nextSappers,
      stats,
      flash,
      result: "lose",
      screen: "result",
      log: appendLog(logs, "> Сапер добрался до цели."),
    };
  }

  const living = nextSappers.filter((item) => item.alive && !item.reached);
  if (living.length === 0) {
    awardAchievement("clean_sweep");
    if (state.config.ai === "The Colonel") awardAchievement("colonel_down");
    if (state.config.ai === "The Ghost") awardAchievement("ghost_down");
    if (state.config.ai === "The Machine") awardAchievement("machine_down");
    const cleanSweep = 2;
    const survivedRounds = Math.max(state.stats.survivedRounds, state.config.round);
    const bestRound = Math.max(state.stats.bestRound, state.config.round);
    localStorage.setItem("minelord-best", String(bestRound));
    return {
      ...state,
      board: nextBoard,
      mines: nextMines,
      sappers: nextSappers,
      stats: {
        ...stats,
        coins: stats.coins + cleanSweep,
        earnedThisRound: stats.earnedThisRound + cleanSweep,
        survivedRounds,
        bestRound,
      },
      flash,
      result: "win",
      screen: "result",
      log: appendLog(logs, `> CLEAN SWEEP. Все саперы подорвались. +${cleanSweep} монет`),
    };
  }

  return { ...state, board: nextBoard, mines: nextMines, sappers: nextSappers, stats, flash, log: appendLog(logs) };
}

export function appendLog(log: string[], line?: string) {
  const next = line ? [...log, line] : log;
  return next.slice(-90);
}

function nextCampaignRound(state: GameState) {
  return state.roundIndex + 2;
}

function directiveShopId(id: DirectiveId) {
  return `directive:${id}`;
}

function parseDirectiveShopId(id: string): DirectiveId | null {
  if (!id.startsWith("directive:")) return null;
  const directive = id.slice("directive:".length) as DirectiveId;
  return directive in DIRECTIVES ? directive : null;
}

function hasMineAccess(state: GameState, type: MineType) {
  if (type === "decoy") return false;
  return (state.inventory[type] || 0) > 0 || state.mines.some((mine) => mine.type === type);
}

function unlockedMineOffer(state: GameState, type: MineType) {
  if (type === "decoy") return false;
  if (MINE_DEFS[type].unlockedRound > nextCampaignRound(state)) return false;
  if (["vortex", "watcher", "lock", "skull"].includes(type)) return state.unlocks.vortex;
  return true;
}

function unlockedDirectiveOffer(state: GameState, directive: DirectiveId) {
  if (!DIRECTIVES[directive].purchasable) return false;
  if (DIRECTIVES[directive].unlockRound > nextCampaignRound(state)) return false;
  if (directive === "blackout") return state.unlocks.blackout;
  if (directive === "doubleMine") return state.unlocks.doubleMine;
  if (directive === "ghostField") return state.unlocks.ghostField;
  return true;
}

function evaluateUnlocks(state: GameState) {
  const kills = Number(localStorage.getItem("minelord-kills") || "0");
  setAchievementProgress("classified_unlock", state.config.round >= 3 || kills >= 3 ? 0.75 : Math.min(0.6, state.config.round / 4));
  setAchievementProgress("colonel_down", Math.min(0.99, state.config.round / 4));
  setAchievementProgress("ghost_down", Math.min(0.99, state.config.round / 7));
  setAchievementProgress("machine_down", Math.min(0.99, state.config.round / 9));
  const next: UnlockState = {
    ...state.unlocks,
    blackout: state.unlocks.blackout || kills >= 3 || state.config.round >= 3,
    doubleMine: state.unlocks.doubleMine || state.stats.explosions >= 2 || kills >= 6,
    vortex: state.unlocks.vortex || state.config.round >= 4,
    ghostField: state.unlocks.ghostField || state.config.round >= 6,
    forbiddenSlot: state.unlocks.forbiddenSlot || state.config.round >= 7,
  };
  if (
    (!state.unlocks.blackout && next.blackout) ||
    (!state.unlocks.doubleMine && next.doubleMine) ||
    (!state.unlocks.ghostField && next.ghostField)
  ) {
    awardAchievement("classified_unlock");
  }
  saveUnlocks(next);
  return next;
}

function offerBase(id: string) {
  const directive = parseDirectiveShopId(id);
  if (directive) {
    const def = DIRECTIVES[directive];
    return {
      label: `▣ ${def.name}`,
      price: directive === "intel" || directive === "lastStand" ? 5 : 4,
      note: def.description,
    };
  }

  if (id === "time") return { label: "+5 seconds setup", price: 3, note: "Permanent extra placement time." };
  if (id === "scout") return { label: "Scout route preview", price: 4, note: "Preview early sapper pressure before committing." };

  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (item) return { label: item.label, price: item.price, note: id in MINE_DEFS ? MINE_DEFS[id as MineType].description : "" };
  return { label: id, price: 3, note: "" };
}

function offerRarity(state: GameState, id: string): ShopOffer["rarity"] {
  const directive = parseDirectiveShopId(id);
  if (id === "time" || id === "scout") return "common";
  if (directive && ["ghostField", "lastStand", "intel"].includes(directive)) return "forbidden";
  if (id === "vortex" || id === "watcher" || id === "lock" || id === "skull") return "forbidden";
  if (directive || id === "nova" || id === "timer" || id === "bait") return "rare";
  return "common";
}

function offerKind(id: string): ShopOffer["kind"] {
  const directive = parseDirectiveShopId(id);
  if (id === "time" || id === "scout") return "classified";
  if (directive) return ["chain", "blackout", "overclock", "intel", "doubleMine"].includes(directive) ? "synergy" : "classified";
  if (id === "timer" || id === "skull" || id === "vortex") return "risk";
  if (["nova", "phantom", "watcher"].includes(id)) return "synergy";
  return "ordnance";
}

function shopPool(state: GameState) {
  const mines = (Object.keys(MINE_DEFS) as MineType[])
    .filter((type) => unlockedMineOffer(state, type))
    .map((type) => type as string);
  const directives = shopAvailableDirectiveIds(state)
    .filter((id) => unlockedDirectiveOffer(state, id))
    .map(directiveShopId);
  const utility = state.inventory.scout ? ["time"] : ["time", "scout"];
  return [...mines, ...directives, ...utility];
}

function synergyTargets(state: GameState) {
  const targets = new Set<string>();
  if (hasMineAccess(state, "nova")) targets.add(directiveShopId("chain"));
  if (hasMineAccess(state, "phantom")) targets.add(directiveShopId("blackout"));
  if (hasMineAccess(state, "timer")) targets.add(directiveShopId("overclock"));
  if (hasMineAccess(state, "watcher")) targets.add(directiveShopId("intel"));
  if (hasMineAccess(state, "skull")) targets.add(directiveShopId("doubleMine"));
  if (state.inventory.directiveDeck.includes("chain") || state.inventory.directiveDiscard.includes("chain")) targets.add("nova");
  if (state.inventory.directiveDeck.includes("blackout") || state.inventory.directiveDiscard.includes("blackout")) targets.add("phantom");
  if (state.inventory.directiveDeck.includes("overclock") || state.inventory.directiveDiscard.includes("overclock")) targets.add("timer");
  if (state.inventory.directiveDeck.includes("intel") || state.inventory.directiveDiscard.includes("intel")) targets.add("watcher");
  if (state.inventory.directiveDeck.includes("doubleMine") || state.inventory.directiveDiscard.includes("doubleMine")) targets.add("skull");
  return targets;
}

function weightedPick(ids: string[], state: GameState, picked: Set<string>) {
  const synergy = synergyTargets(state);
  const weighted = ids
    .filter((id) => !picked.has(id))
    .flatMap((id) => {
      let weight = 4;
      if (synergy.has(id)) weight += 9;
      if (offerKind(id) === "synergy") weight += 3;
      if (offerRarity(state, id) === "forbidden") weight = state.unlocks.forbiddenSlot ? weight + 1 : Math.max(1, weight - 3);
      if (id === "normal" && state.inventory.normal > 5) weight = 1;
      return Array.from({ length: Math.max(1, weight) }, () => id);
    });
  return shuffle(weighted)[0] || null;
}

export function generateShopOffers(state: GameState): ShopOffer[] {
  const pool = shopPool(state);
  const picked = new Set<string>();
  const offers: ShopOffer[] = [];
  const preferredKinds: ShopOffer["kind"][] = ["ordnance", "synergy", state.unlocks.forbiddenSlot ? "risk" : "classified"];

  for (const kind of preferredKinds) {
    const typedPool = pool.filter((id) => offerKind(id) === kind);
    const id = weightedPick(typedPool.length ? typedPool : pool, state, picked);
    if (!id) continue;
    picked.add(id);
    const base = offerBase(id);
    offers.push({
      uid: `${id}-${Date.now()}-${offers.length}-${Math.random().toString(16).slice(2)}`,
      itemId: id,
      label: base.label,
      price: base.price,
      rarity: offerRarity(state, id),
      kind: offerKind(id),
      note: synergyTargets(state).has(id) ? `[BUILD BIAS] ${base.note}` : base.note,
    });
  }

  while (offers.length < 3) {
    const id = weightedPick(pool, state, picked);
    if (!id) break;
    picked.add(id);
    const base = offerBase(id);
    offers.push({
      uid: `${id}-${Date.now()}-${offers.length}-${Math.random().toString(16).slice(2)}`,
      itemId: id,
      label: base.label,
      price: base.price,
      rarity: offerRarity(state, id),
      kind: offerKind(id),
      note: synergyTargets(state).has(id) ? `[BUILD BIAS] ${base.note}` : base.note,
    });
  }

  return offers;
}

export function enterShop(state: GameState): GameState {
  const unlocks = evaluateUnlocks(state);
  const withUnlocks = { ...state, unlocks };
  const unlockLog = [
    unlocks.blackout && !state.unlocks.blackout ? "> UNLOCK: BLACKOUT directives entered the pool." : "",
    unlocks.doubleMine && !state.unlocks.doubleMine ? "> UNLOCK: DOUBLE MINE directives entered the pool." : "",
    unlocks.vortex && !state.unlocks.vortex ? "> UNLOCK: forbidden ordnance entered the pool." : "",
    unlocks.ghostField && !state.unlocks.ghostField ? "> UNLOCK: GHOST FIELD directives entered the pool." : "",
    unlocks.forbiddenSlot && !state.unlocks.forbiddenSlot ? "> UNLOCK: forbidden offer slot enabled." : "",
  ].filter(Boolean);
  return {
    ...withUnlocks,
    screen: "shop",
    shopRerolls: 0,
    shopOffers: generateShopOffers(withUnlocks),
    log: appendLog([...state.log, ...unlockLog], "> SUPPLY DEPOT: three field offers generated."),
  };
}

export function shopAvailableDirectiveIds(state: GameState) {
  const owned = new Set<DirectiveId>([
    ...state.inventory.directiveDeck,
    ...state.inventory.directiveDiscard,
    ...(state.selectedDirective ? [state.selectedDirective] : []),
  ]);

  return (Object.keys(DIRECTIVES) as DirectiveId[]).filter(
    (directive) =>
      DIRECTIVES[directive].purchasable &&
      DIRECTIVES[directive].unlockRound <= nextCampaignRound(state) &&
      !owned.has(directive),
  );
}

export function canBuyUpgrade(state: GameState, id: string) {
  const directive = parseDirectiveShopId(id);
  if (directive) {
    const base = offerBase(id);
    return state.stats.coins >= base.price && shopAvailableDirectiveIds(state).includes(directive) && unlockedDirectiveOffer(state, directive);
  }

  if (id === "time" || id === "scout") {
    const base = offerBase(id);
    return state.stats.coins >= base.price && (id !== "scout" || !state.inventory.scout);
  }

  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item || state.stats.coins < item.price) return false;

  if (id === "directive") {
    return shopAvailableDirectiveIds(state).length > 0;
  }

  if (id in MINE_DEFS) {
    return unlockedMineOffer(state, id as MineType);
  }

  return true;
}

export function buyUpgrade(state: GameState, id: string): GameState {
  const directive = parseDirectiveShopId(id);
  if (directive) {
    const base = offerBase(id);
    if (!canBuyUpgrade(state, id)) return state;
    awardAchievement("depot_deal");
    awardAchievement("classified_unlock");
    return {
      ...state,
      inventory: {
        ...state.inventory,
        directiveDeck: [...state.inventory.directiveDeck, directive],
      },
      shopOffers: state.shopOffers.filter((offer) => offer.itemId !== id),
      stats: { ...state.stats, coins: state.stats.coins - base.price },
      log: appendLog(state.log, `> SUPPLY DEPOT: ${DIRECTIVES[directive].name} purchased for ${base.price}Ȼ.`),
    };
  }

  if (id === "time" || id === "scout") {
    const base = offerBase(id);
    if (!canBuyUpgrade(state, id)) return state;
    awardAchievement("depot_deal");
    const inventory = { ...state.inventory };
    if (id === "time") inventory.placementSeconds += 5;
    if (id === "scout") inventory.scout = true;
    return {
      ...state,
      inventory,
      shopOffers: state.shopOffers.filter((offer) => offer.itemId !== id),
      stats: { ...state.stats, coins: state.stats.coins - base.price },
      log: appendLog(state.log, `> SUPPLY DEPOT: ${id} purchased for ${base.price} credits.`),
    };
  }

  const item = SHOP_ITEMS.find((entry) => entry.id === id);
  if (!item || !canBuyUpgrade(state, id)) return state;
  awardAchievement("depot_deal");
  const price = item.price;
  const inventory = { ...state.inventory };

  if (id === "directive") {
    const missing = shopAvailableDirectiveIds(state);
    if (!missing.length) return state;
    inventory.directiveDeck = [...inventory.directiveDeck, shuffle(missing)[0]];
  } else if (id === "scout") {
    inventory.scout = true;
  } else if (id === "time") {
    inventory.placementSeconds += 5;
  } else {
    const mineType = id as Exclude<MineType, "decoy">;
    inventory[mineType] += 1;
  }
  return {
    ...state,
    inventory,
    shopOffers: state.shopOffers.filter((offer) => offer.itemId !== id),
    stats: { ...state.stats, coins: state.stats.coins - price },
    log: appendLog(state.log, `> SHOP: ${id} куплено за ${price} монет.`),
  };
}
