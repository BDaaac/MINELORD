export type Screen =
  | "title"
  | "howto"
  | "arsenal"
  | "directive"
  | "boss"
  | "placement"
  | "running"
  | "shop"
  | "result";

export type MineType =
  | "normal"
  | "phantom"
  | "sticky"
  | "nova"
  | "mirror"
  | "bait"
  | "timer"
  | "vortex"
  | "watcher"
  | "lock"
  | "skull"
  | "decoy";

export type DirectiveId =
  | "decoy"
  | "cluster"
  | "fog"
  | "mimic"
  | "chain"
  | "saboteur"
  | "blackout"
  | "swap"
  | "paranoia"
  | "overclock"
  | "ghostField"
  | "doubleMine"
  | "lastStand"
  | "intel";

export type AiType =
  | "Rookie"
  | "Rookie+"
  | "Analyst"
  | "The Colonel"
  | "Gambler"
  | "Hunter"
  | "The Ghost"
  | "The Machine";

export type PhaseResult = "win" | "lose" | null;

export interface Coord {
  row: number;
  col: number;
}

export interface Mine {
  id: string;
  row: number;
  col: number;
  type: MineType;
  armedAtStep?: number;
}

export interface Cell {
  row: number;
  col: number;
  revealed: boolean;
  value: number;
  displayValue: number;
  exploded: boolean;
}

export interface Sapper {
  id: string;
  name: string;
  row: number;
  col: number;
  alive: boolean;
  reached: boolean;
  steps: number;
  phased: boolean;
  stuck: number;
  type: AiType;
  visitedCells: Set<string>;
}

export interface RoundConfig {
  round: number;
  sappers: number;
  size: number;
  mines: number;
  ai: AiType;
  boss?: boolean;
}

export interface Directive {
  id: DirectiveId;
  name: string;
  serial: string;
  short: string;
  description: string;
  unlockRound: number;
  purchasable: boolean;
}

export interface MineDef {
  type: MineType;
  name: string;
  glyph: string;
  unlockedRound: number;
  maxSpecial: number;
  description: string;
}

export interface Inventory {
  normal: number;
  phantom: number;
  sticky: number;
  nova: number;
  mirror: number;
  bait: number;
  timer: number;
  vortex: number;
  watcher: number;
  lock: number;
  skull: number;
  placementSeconds: number;
  directiveDeck: DirectiveId[];
  directiveDiscard: DirectiveId[];
  scout: boolean;
}

export interface Stats {
  coins: number;
  earnedThisRound: number;
  explosions: number;
  speedKills: number;
  survivedRounds: number;
  bestRound: number;
}

export interface GeminiSettings {
  model: string;
  activeKeyIndex: number;
  exhaustedKeyIndexes: number[];
  requestCounts: Record<string, number>;
  status: string;
}

export interface GameState {
  screen: Screen;
  roundIndex: number;
  config: RoundConfig;
  board: Cell[][];
  mines: Mine[];
  defuse: Coord;
  sappers: Sapper[];
  selectedMine: MineType;
  selectedDirective?: DirectiveId;
  directiveChoices: DirectiveId[];
  timer: number;
  result: PhaseResult;
  log: string[];
  inventory: Inventory;
  stats: Stats;
  gemini: GeminiSettings;
  machineThoughts: string[];
  flash: boolean;
  paused: boolean;
  confirmMenu: boolean;
  sapperView: boolean;
}

export interface MachineMove {
  cell: string;
  reason: string;
}
