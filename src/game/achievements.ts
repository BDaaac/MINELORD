export type AchievementId =
  | "boot_sequence"
  | "first_directive"
  | "first_blood"
  | "clean_sweep"
  | "depot_deal"
  | "classified_unlock"
  | "synergy_online"
  | "colonel_down"
  | "ghost_down"
  | "machine_down";

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  hint: string;
  cover: string[];
}

export interface AchievementSave {
  unlockedAt?: string;
  progress: number;
}

const STORAGE_KEY = "minelord-achievements";

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "boot_sequence",
    title: "BOOT SEQUENCE",
    description: "Запусти MINELORD.",
    hint: "Открыть игру.",
    cover: ["00100", "01110", "11111", "00100", "00100"],
  },
  {
    id: "first_directive",
    title: "ORDER ACCEPTED",
    description: "Прими первую директиву.",
    hint: "Выбрать любую директиву перед раундом.",
    cover: ["11110", "10010", "11110", "10000", "10000"],
  },
  {
    id: "first_blood",
    title: "FIRST BLOOD",
    description: "Уничтожь первого сапера.",
    hint: "Пусть сапер наступит на мину.",
    cover: ["01010", "11111", "01110", "11111", "01010"],
  },
  {
    id: "clean_sweep",
    title: "CLEAN SWEEP",
    description: "Выиграй раунд без выживших саперов.",
    hint: "Все саперы должны быть устранены.",
    cover: ["10001", "01010", "00100", "01010", "10001"],
  },
  {
    id: "depot_deal",
    title: "DEPOT DEAL",
    description: "Купи любой оффер в Supply Depot.",
    hint: "Потратить кредиты после победы.",
    cover: ["11111", "10001", "11111", "10101", "11111"],
  },
  {
    id: "classified_unlock",
    title: "CLASSIFIED OPS",
    description: "Открой или купи новую директиву.",
    hint: "Дойди до unlock или купи директиву.",
    cover: ["11111", "10000", "11110", "10000", "11111"],
  },
  {
    id: "synergy_online",
    title: "SYNERGY ONLINE",
    description: "Запусти раунд с активной синергией.",
    hint: "Например CHAIN + Nova или BLACKOUT + Phantom.",
    cover: ["10101", "01110", "11111", "01110", "10101"],
  },
  {
    id: "colonel_down",
    title: "COLONEL DOWN",
    description: "Победи босса The Colonel.",
    hint: "Выиграть 4-й раунд.",
    cover: ["01110", "10101", "11111", "00100", "01110"],
  },
  {
    id: "ghost_down",
    title: "GHOST TRAPPED",
    description: "Победи босса The Ghost.",
    hint: "Выиграть 7-й раунд.",
    cover: ["01110", "11111", "10101", "11111", "10101"],
  },
  {
    id: "machine_down",
    title: "MACHINE BROKEN",
    description: "Победи финального босса The Machine.",
    hint: "Сломать Gemini-сапера в финале.",
    cover: ["11111", "10101", "11111", "01010", "11011"],
  },
];

export function readAchievementSave(): Record<AchievementId, AchievementSave> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Partial<Record<AchievementId, AchievementSave>>;
    return Object.fromEntries(
      ACHIEVEMENTS.map((achievement) => [
        achievement.id,
        {
          progress: Math.max(0, Math.min(1, raw[achievement.id]?.progress ?? 0)),
          unlockedAt: raw[achievement.id]?.unlockedAt,
        },
      ]),
    ) as Record<AchievementId, AchievementSave>;
  } catch {
    return Object.fromEntries(ACHIEVEMENTS.map((achievement) => [achievement.id, { progress: 0 }])) as Record<
      AchievementId,
      AchievementSave
    >;
  }
}

function writeAchievementSave(save: Record<AchievementId, AchievementSave>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function awardAchievement(id: AchievementId) {
  const save = readAchievementSave();
  if (save[id]?.unlockedAt) return false;
  save[id] = { progress: 1, unlockedAt: new Date().toISOString() };
  writeAchievementSave(save);
  return true;
}

export function setAchievementProgress(id: AchievementId, progress: number) {
  const save = readAchievementSave();
  if (save[id]?.unlockedAt) return;
  save[id] = { progress: Math.max(save[id]?.progress ?? 0, Math.max(0, Math.min(0.99, progress))) };
  writeAchievementSave(save);
}

export function achievementStats() {
  const save = readAchievementSave();
  const unlocked = ACHIEVEMENTS.filter((achievement) => Boolean(save[achievement.id]?.unlockedAt)).length;
  return { unlocked, total: ACHIEVEMENTS.length };
}
