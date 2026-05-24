import { ArrowLeft, Trophy } from "lucide-react";
import { ACHIEVEMENTS, achievementStats, readAchievementSave } from "../game/achievements";
import { TerminalFrame } from "./TerminalFrame";

function PixelCover({ pixels, locked }: { pixels: string[]; locked: boolean }) {
  return (
    <div className={`achievement-cover ${locked ? "achievement-cover--locked" : ""}`} aria-hidden="true">
      {pixels.flatMap((row, rowIndex) =>
        row.split("").map((pixel, colIndex) => (
          <span
            className={pixel === "1" ? "achievement-cover__pixel achievement-cover__pixel--on" : "achievement-cover__pixel"}
            key={`${rowIndex}-${colIndex}`}
          />
        )),
      )}
    </div>
  );
}

export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const save = readAchievementSave();
  const stats = achievementStats();

  return (
    <main className="screen screen--scroll">
      <TerminalFrame title={`> ДОСТИЖЕНИЯ - ${stats.unlocked}/${stats.total}`}>
        <div className="achievements-brief">
          <Trophy size={18} />
          <span>Боевые отметки MINELORD. Закрытые записи показывают условие, открытые - дату получения.</span>
        </div>

        <div className="achievements-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const record = save[achievement.id];
            const unlocked = Boolean(record?.unlockedAt);
            const progress = Math.round((record?.progress ?? 0) * 100);
            return (
              <article className={`achievement-card ${unlocked ? "achievement-card--unlocked" : ""}`} key={achievement.id}>
                <PixelCover pixels={achievement.cover} locked={!unlocked} />
                <div className="achievement-card__body">
                  <strong>{unlocked ? achievement.title : "████████████"}</strong>
                  <p>{unlocked ? achievement.description : achievement.hint}</p>
                  <div className="achievement-progress" aria-label={`progress ${progress}%`}>
                    <span style={{ width: `${unlocked ? 100 : progress}%` }} />
                  </div>
                  <small>
                    {unlocked && record?.unlockedAt
                      ? `UNLOCKED: ${new Date(record.unlockedAt).toLocaleDateString("ru-RU")}`
                      : `PROGRESS: ${progress}%`}
                  </small>
                </div>
              </article>
            );
          })}
        </div>

        <button className="terminal-button terminal-button--primary" onClick={onBack}>
          <ArrowLeft size={18} /> НАЗАД В МЕНЮ
        </button>
      </TerminalFrame>
    </main>
  );
}
