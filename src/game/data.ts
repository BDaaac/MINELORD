import { AiType, Directive, DirectiveId, Inventory, MineDef, MineType, RoundConfig } from "./types";

export const MODEL_OPTIONS = ["gemini-3.1-flash", "gemini-3.1-flash-lite-preview", "gemini-3-flash-preview", "gemini-2.5-flash"];
export const DEFAULT_MODEL = "gemini-3.1-flash";

export const ROUND_TABLE: RoundConfig[] = [
  { round: 1, sappers: 1, size: 6, mines: 3, ai: "Rookie" },
  { round: 2, sappers: 2, size: 7, mines: 4, ai: "Rookie+" },
  { round: 3, sappers: 3, size: 8, mines: 5, ai: "Analyst" },
  { round: 4, sappers: 1, size: 9, mines: 6, ai: "The Colonel", boss: true },
  { round: 5, sappers: 2, size: 8, mines: 5, ai: "Gambler" },
  { round: 6, sappers: 3, size: 9, mines: 6, ai: "Hunter" },
  { round: 7, sappers: 1, size: 10, mines: 7, ai: "The Ghost", boss: true },
  { round: 8, sappers: 3, size: 10, mines: 7, ai: "Gambler" },
  { round: 9, sappers: 3, size: 10, mines: 8, ai: "The Machine", boss: true },
];

export const AI_LABELS: Record<AiType, string> = {
  Rookie: "random clicks",
  "Rookie+": "random + caution",
  Analyst: "strict number logic",
  "The Colonel": "probability and corners",
  Gambler: "risk spikes",
  Hunter: "cluster seeker",
  "The Ghost": "pattern memory",
  "The Machine": "Gemini 3.1 Flash",
};

export const MINE_DEFS: Record<MineType, MineDef> = {
  normal: { type: "normal", name: "Обычная", glyph: "💣", unlockedRound: 1, maxSpecial: 99, description: "Стандартная мина." },
  phantom: { type: "phantom", name: "Phantom", glyph: "👻", unlockedRound: 3, maxSpecial: 2, description: "Не влияет на цифры соседей." },
  sticky: { type: "sticky", name: "Sticky", glyph: "🕸️", unlockedRound: 3, maxSpecial: 2, description: "Задерживает сапёра на 2 хода." },
  nova: { type: "nova", name: "Nova", glyph: "💥", unlockedRound: 4, maxSpecial: 2, description: "Большой взрыв, усиливает CHAIN." },
  mirror: { type: "mirror", name: "Mirror", glyph: "🪞", unlockedRound: 4, maxSpecial: 2, description: "Показывает числа ниже реальных." },
  bait: { type: "bait", name: "Bait", glyph: "🎣", unlockedRound: 5, maxSpecial: 2, description: "Притягивает рискованные AI." },
  timer: { type: "timer", name: "Timer", glyph: "⏱️", unlockedRound: 5, maxSpecial: 2, description: "Взрывается сама через 5 ходов AI." },
  vortex: { type: "vortex", name: "Vortex", glyph: "🌀", unlockedRound: 6, maxSpecial: 2, description: "Телепортирует AI в случайную клетку." },
  watcher: { type: "watcher", name: "Watcher", glyph: "👁️", unlockedRound: 6, maxSpecial: 2, description: "Показывает следующий ход AI заранее." },
  lock: { type: "lock", name: "Lock", glyph: "🔒", unlockedRound: 6, maxSpecial: 2, description: "AI вынужден идти рядом." },
  skull: { type: "skull", name: "Skull", glyph: "💀", unlockedRound: 6, maxSpecial: 2, description: "Обход активирует соседнюю мину." },
  decoy: { type: "decoy", name: "Decoy", glyph: "◇", unlockedRound: 1, maxSpecial: 1, description: "Фейковая мина от директивы DECOY." },
};

export const DIRECTIVES: Record<DirectiveId, Directive> = {
  decoy: { id: "decoy", name: "DECOY", serial: "047", short: "Fake mine", description: "Фейковая мина влияет на цифры.", unlockRound: 1, purchasable: false },
  cluster: { id: "cluster", name: "CLUSTER", serial: "113", short: "False danger", description: "Зона показывает +1 к цифрам.", unlockRound: 1, purchasable: false },
  fog: { id: "fog", name: "FOG", serial: "204", short: "Blind opening", description: "AI первые 5 ходов слепой.", unlockRound: 1, purchasable: false },
  mimic: { id: "mimic", name: "MIMIC", serial: "319", short: "False safe cell", description: "Одна клетка выглядит безопасной.", unlockRound: 1, purchasable: false },
  chain: { id: "chain", name: "CHAIN", serial: "512", short: "Chain blast", description: "Цепная реакция при подрыве.", unlockRound: 1, purchasable: false },
  saboteur: { id: "saboteur", name: "SABOTEUR", serial: "611", short: "Move mine", description: "После 3 ходов можно передвинуть мину.", unlockRound: 1, purchasable: false },
  blackout: { id: "blackout", name: "BLACKOUT", serial: "730", short: "No numbers", description: "Убирает все цифры с поля на 3 хода.", unlockRound: 4, purchasable: true },
  swap: { id: "swap", name: "SWAP", serial: "808", short: "Mine swap", description: "Меняет 2 мины местами после старта AI.", unlockRound: 4, purchasable: true },
  paranoia: { id: "paranoia", name: "PARANOIA", serial: "909", short: "Skip rhythm", description: "AI пропускает каждый 3-й ход.", unlockRound: 4, purchasable: true },
  overclock: { id: "overclock", name: "OVERCLOCK", serial: "991", short: "Double tempo", description: "Сапёр делает 2 хода за раз.", unlockRound: 5, purchasable: true },
  ghostField: { id: "ghostField", name: "GHOST FIELD", serial: "010", short: "Zero field", description: "Всё поле выглядит как нули.", unlockRound: 5, purchasable: true },
  doubleMine: { id: "doubleMine", name: "DOUBLE MINE", serial: "222", short: "Double count", description: "Одна мина считается как две.", unlockRound: 5, purchasable: true },
  lastStand: { id: "lastStand", name: "LAST STAND", serial: "404", short: "Defuse trap", description: "40% шанс взрыва у Defuse Point.", unlockRound: 6, purchasable: true },
  intel: { id: "intel", name: "INTEL", serial: "777", short: "Route leak", description: "Видишь маршрут AI заранее.", unlockRound: 6, purchasable: true },
};

export const SHOP_ITEMS = [
  { id: "normal", section: "ordnance", label: "💣 +1 обычная мина", price: 2 },
  { id: "phantom", section: "ordnance", label: "👻 Phantom мина", price: 4 },
  { id: "sticky", section: "ordnance", label: "🕸️ Sticky мина", price: 3 },
  { id: "nova", section: "ordnance", label: "💥 Nova мина", price: 5 },
  { id: "mirror", section: "ordnance", label: "🪞 Mirror мина", price: 4 },
  { id: "bait", section: "ordnance", label: "🎣 Bait мина", price: 4 },
  { id: "timer", section: "ordnance", label: "⏱️ Timer мина", price: 5 },
  { id: "vortex", section: "ordnance", label: "🌀 Vortex мина", price: 6 },
  { id: "watcher", section: "ordnance", label: "👁️ Watcher мина", price: 6 },
  { id: "lock", section: "ordnance", label: "🔒 Lock мина", price: 6 },
  { id: "skull", section: "ordnance", label: "💀 Skull мина", price: 6 },
  { id: "directive", section: "ops", label: "▣ Новая директива", price: 3 },
] as const;

export const initialInventory: Inventory = {
  normal: 3,
  phantom: 0,
  sticky: 0,
  nova: 0,
  mirror: 0,
  bait: 0,
  timer: 0,
  vortex: 0,
  watcher: 0,
  lock: 0,
  skull: 0,
  placementSeconds: 15,
  directiveDeck: ["decoy", "cluster", "fog", "mimic"],
  directiveDiscard: [],
  scout: false,
};

export const SYNERGIES = [
  { directive: "chain", mine: "nova", name: "MEGA CHAIN", text: "радиус взрыва x3" },
  { directive: "blackout", mine: "phantom", name: "TOTAL BLIND", text: "Phantom полностью скрыт" },
  { directive: "overclock", mine: "timer", name: "RUSH", text: "Timer за 3 хода" },
  { directive: "intel", mine: "watcher", name: "OMNISCIENT", text: "видишь 3 хода вперёд" },
  { directive: "doubleMine", mine: "skull", name: "DEATH FIELD", text: "обход становится смертельным" },
] as const;
