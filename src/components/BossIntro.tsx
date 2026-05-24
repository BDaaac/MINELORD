import { AlertTriangle, Play } from "lucide-react";
import { AI_LABELS } from "../game/data";
import { AiType } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

const quotes: Record<AiType, string> = {
  Rookie: "",
  "Rookie+": "",
  Analyst: "",
  Gambler: "",
  Hunter: "",
  "The Colonel": "30 лет в сапёрах. 0 ошибок.",
  "The Ghost": "Он не ищет мины. Он чувствует их.",
  "The Machine": "Это не человек. Это алгоритм.",
};

export function BossIntro({ ai, onContinue }: { ai: AiType; onContinue: () => void }) {
  return (
    <main className="screen">
      <TerminalFrame title="> BOSS DETECTED" danger>
        <div className="boss-intro">
          <AlertTriangle size={42} />
          <h1>{ai}</h1>
          <p>"{quotes[ai]}"</p>
          <div className="ability-row">
            <span>{AI_LABELS[ai]}</span>
            <span>{ai === "The Machine" ? "GEMINI THINKING" : "TACTICAL AI"}</span>
          </div>
          <button className="terminal-button terminal-button--danger" onClick={onContinue}>
            <Play size={18} /> PREPARE YOUR MINES
          </button>
        </div>
      </TerminalFrame>
    </main>
  );
}
