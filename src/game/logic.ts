import { DEFAULT_MODEL, DIRECTIVES, initialInventory, MINE_DEFS, ROUND_TABLE } from "./data";
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
} from "./types";

const dirs = [-1, 0, 1];

export function coordKey(coord: Coord) {
  return `${coord.row}:${coord.col}`;
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

export function createBoard(size: number, mines: Mine[]) {
  return Array.from({ length: size }, (_, row) =>
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
      return {
        row,
        col,
        revealed: false,
        value: real + decoyBoost,
        displayValue: Math.max(0, real + decoyBoost - mirrorPenalty),
        exploded: false,
      };
    }),
  );
}

export function randomDefuse(size: number): Coord {
  return { row: Math.floor(size / 2), col: size - 2 };
}

export function createSappers(config: RoundConfig): Sapper[] {
  return Array.from({ length: config.sappers }, (_, index) => {
    const starts: Coord[] = [
      { row: 0, col: 0 },
      { row: config.size - 1, col: 0 },
      { row: 0, col: config.size - 1 },
      { row: config.size - 1, col: config.size - 1 },
    ];
    const start = starts[index % starts.length];
    return {
      id: `sapper-${index + 1}`,
      name: `SAPPER_${String(index + 1).padStart(2, "0")}`,
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

export function directiveChoices(deck: DirectiveId[]) {
  const unique = Array.from(new Set(deck.length ? deck : Object.keys(DIRECTIVES) as DirectiveId[]));
  return shuffle(unique).slice(0, Math.min(3, unique.length));
}

export function createInitialGame(): GameState {
  const config = getRound(0);
  const defuse = randomDefuse(config.size);
  const mines: Mine[] = [];
  return {
    screen: "title",
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
    timer: config.round === 1 ? 10 : 10,
    result: null,
    log: [`> ROUND ${config.round}: ${config.ai}. Выберите джокер.`],
    stats: { ...state.stats, earnedThisRound: 0, explosions: 0, speedKills: 0 },
    machineThoughts: [],
    flash: false,
    paused: false,
    confirmMenu: false,
    sapperView: false,
  };
  return next;
}

export function beginPlacement(state: GameState, directive: DirectiveId): GameState {
  const deck = state.inventory.directiveDeck.filter((id) => id !== directive);
  const discard = [...state.inventory.directiveDiscard, directive];
  return {
    ...state,
    screen: state.config.boss ? "boss" : "placement",
    selectedDirective: directive,
    inventory: { ...state.inventory, directiveDeck: deck, directiveDiscard: discard },
    timer: state.inventory.placementSeconds,
    log: [`> DIRECTIVE ACCEPTED. MISSION BEGINS.`, `> ${DIRECTIVES[directive].name} armed.`],
  };
}

export function afterBossIntro(state: GameState): GameState {
  return { ...state, screen: "placement", timer: state.inventory.placementSeconds };
}

export function startRunning(state: GameState): GameState {
  return {
    ...state,
    screen: "running",
    board: createBoard(state.config.size, state.mines),
    paused: false,
    confirmMenu: false,
    log: [
      `> ${state.config.ai}: запуск маршрута к ${cellName(state.defuse.row, state.defuse.col)}.`,
      state.config.ai === "The Machine" ? `> ${state.gemini.model} connected...` : "> AI анализирует поле...",
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
  return { ...state, mines, board: createBoard(state.config.size, mines) };
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
  const candidates = neighbors(size, sapper.row, sapper.col)
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
  if (foggy || state.config.ai === "Rookie") return shuffle(pool)[0] || null;

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
    return eliminateSapperAsStuck(state, sapperId, `> ${sapper.name}: maxMoves=${maxMoves}. Сапер зациклился и проиграл.`);
  }
  if (sapper.stuck > 0) {
    const sappers = state.sappers.map((item) =>
      item.id === sapperId ? { ...item, stuck: item.stuck - 1, steps: item.steps + 1 } : item,
    );
    return { ...state, sappers, log: appendLog(state.log, `> ${sapper.name}: застрял в Sticky-паутине...`) };
  }

  const visited = new Set(sapper.visitedCells);
  const forcedCell = forcedMove && inBounds(state.config.size, forcedMove) ? state.board[forcedMove.row][forcedMove.col] : null;
  const forcedIsDefuse = forcedMove?.row === state.defuse.row && forcedMove.col === state.defuse.col;
  const canUseForced =
    forcedMove &&
    forcedCell &&
    !visited.has(coordKey(forcedMove)) &&
    (!forcedCell.revealed || forcedIsDefuse);
  const move = canUseForced ? forcedMove : chooseAiMove(state, sapper);
  if (!move) {
    return eliminateSapperAsStuck(state, sapperId, `> ${sapper.name}: доступных клеток нет. Сапер застрял.`);
  }
  const mine = mineAt(state.mines, move.row, move.col);
  const cellLabel = cellName(move.row, move.col);
  const nextBoard = state.board.map((row) => row.map((cell) => ({ ...cell })));
  const nextSappers = state.sappers.map((item) => ({ ...item }));
  const target = nextSappers.find((item) => item.id === sapperId)!;
  target.row = move.row;
  target.col = move.col;
  target.steps += 1;
  target.visitedCells = new Set([...target.visitedCells, coordKey(move)]);

  const logs = [...state.log];
  if (reason) logs.push(`> ${sapper.name}: ${cellLabel} — ${reason}`);
  else logs.push(`> ${sapper.name}: открываю [${cellLabel}]...`);

  let stats = state.stats;
  let flash = false;
  if (mine && mine.type !== "decoy") {
    if (mine.type === "sticky" && target.stuck === 0) {
      target.stuck = 2;
      logs.push(`> ${cellLabel}: Sticky активирована. Сапер теряет 2 хода.`);
    } else if (state.config.ai === "The Ghost" && !target.phased) {
      target.phased = true;
      logs.push(`> ${target.name}: PHASE. Мина проигнорирована один раз.`);
    } else {
      target.alive = false;
      nextBoard[move.row][move.col].exploded = true;
      flash = true;
      const chainBonus =
        state.selectedDirective === "chain"
          ? neighbors(state.config.size, move.row, move.col).filter((n) => mineAt(state.mines, n.row, n.col)).length
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
      logs.push(`> ${cellLabel}: * * BOOM * * ${target.name} уничтожен. +${earned} монет`);
    }
  } else {
    nextBoard[move.row][move.col].revealed = true;
    logs.push(`> ${cellLabel}: безопасно. value = ${nextBoard[move.row][move.col].displayValue}`);
  }

  if (move.row === state.defuse.row && move.col === state.defuse.col && target.alive) {
    target.reached = true;
    logs.push(`> ${target.name}: DEFUSE POINT достигнут. MISSION FAILED.`);
    return {
      ...state,
      board: nextBoard,
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
    const cleanSweep = 2;
    const survivedRounds = Math.max(state.stats.survivedRounds, state.config.round);
    const bestRound = Math.max(state.stats.bestRound, state.config.round);
    localStorage.setItem("minelord-best", String(bestRound));
    return {
      ...state,
      board: nextBoard,
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

  return { ...state, board: nextBoard, sappers: nextSappers, stats, flash, log: appendLog(logs) };
}

export function appendLog(log: string[], line?: string) {
  const next = line ? [...log, line] : log;
  return next.slice(-90);
}

export function buyUpgrade(state: GameState, id: string): GameState {
  const itemPrice: Record<string, number> = {
    normal: 2,
    phantom: 4,
    sticky: 3,
    nova: 5,
    mirror: 4,
    directive: 3,
    scout: 4,
    time: 3,
  };
  const price = itemPrice[id] ?? 999;
  if (state.stats.coins < price) return state;
  const inventory = { ...state.inventory };
  if (id === "directive") {
    const missing = (Object.keys(DIRECTIVES) as DirectiveId[]).filter(
      (directive) => DIRECTIVES[directive].purchasable && !inventory.directiveDeck.includes(directive),
    );
    inventory.directiveDeck = [...inventory.directiveDeck, shuffle(missing)[0] || "blackout"];
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
    stats: { ...state.stats, coins: state.stats.coins - price },
    log: appendLog(state.log, `> SHOP: ${id} куплено за ${price} монет.`),
  };
}
