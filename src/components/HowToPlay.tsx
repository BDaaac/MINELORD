import { Bomb, CircleDot, Hash, Play } from "lucide-react";
import { TerminalFrame } from "./TerminalFrame";

export function HowToPlay({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <main className="screen">
      <TerminalFrame title="> MISSION BRIEFING">
        <div className="briefing-grid">
          <div>
            <p className="big-line">Ты — минёр. Не сапёр.</p>
            <ul className="terminal-list">
              <li><Bomb size={18} /> обычная мина уничтожает сапёра</li>
              <li><CircleDot size={18} /> Defuse Point — цель врага</li>
              <li><Hash size={18} /> число показывает мины рядом</li>
            </ul>
            <p>Один сапёр = одна жизнь. Одна мина может выиграть раунд.</p>
          </div>
          <div className="mini-demo">
            <span className="walker">&gt;_</span>
            <span>□</span>
            <span>□</span>
            <span className="danger-glyph">💣</span>
            <span className="boom">BOOM</span>
          </div>
        </div>
        <div className="menu-row">
          <button className="terminal-button terminal-button--primary" onClick={onStart}>
            <Play size={18} /> UNDERSTOOD. LET'S GO
          </button>
          <button className="terminal-button" onClick={onBack}>BACK</button>
        </div>
      </TerminalFrame>
    </main>
  );
}
