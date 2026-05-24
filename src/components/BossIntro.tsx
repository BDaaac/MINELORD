import { Play } from "lucide-react";
import { AI_LABELS } from "../game/data";
import { AiType } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

const quotes: Record<AiType, string> = {
  Rookie: "",
  "Rookie+": "",
  Analyst: "",
  Gambler: "",
  Hunter: "",
  "The Colonel": "30 лет в сапёрах. Ни одной ошибки.",
  "The Ghost": "Он не ищет мины. Он чувствует их.",
  "The Machine": "Это не человек. Это алгоритм.",
};

const bossAbilities: Partial<Record<AiType, string[]>> = {
  "The Colonel": ["SCAN", "УГЛОВАЯ ТАКТИКА"],
  "The Ghost": ["PHASE", "MEMORY"],
  "The Machine": ["OVERCALCULATE", "ADAPT", "GEMINI THINKING"],
};

const bossWeakness: Partial<Record<AiType, string>> = {
  "The Colonel": "боится центра поля — загоняй в угол",
  "The Ghost": "меняй паттерн каждый раунд",
  "The Machine": "Phantom и Mirror скрывают информацию от логики",
};

export function BossIntro({
  ai,
  onContinue,
  onBack,
}: {
  ai: AiType;
  onContinue: () => void;
  onBack: () => void;
}) {
  const abilities = bossAbilities[ai] ?? [AI_LABELS[ai]];
  const weakness = bossWeakness[ai];

  return (
    <main className="screen boss-entry-screen">
      <TerminalFrame title="> ОБНАРУЖЕН БОСС" danger>
        <div className="boss-intro">
          <p className="boss-warning">&gt; BOSS DETECTED</p>
          <div className="boss-name-block">
            <div className="boss-name-bar">████████████████████████</div>
            <h1>{ai}</h1>
            <div className="boss-name-bar">████████████████████████</div>
          </div>
          {quotes[ai] ? <p className="boss-quote">"{quotes[ai]}"</p> : null}
          <div className="ability-row">
            {abilities.map((ability) => <span key={ability}>{ability}</span>)}
          </div>
          {weakness ? <p className="boss-weakness">&gt; СЛАБОСТЬ: {weakness}</p> : null}
          <div className="menu-row">
            <button className="terminal-button terminal-button--danger" onClick={onContinue}>
              <Play size={18} /> ПОДГОТОВИТЬ МИНЫ
            </button>
            <button className="terminal-button" onClick={onBack}>
              НАЗАД
            </button>
          </div>
        </div>
      </TerminalFrame>
    </main>
  );
}
