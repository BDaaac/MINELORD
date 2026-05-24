import { Play } from "lucide-react";
import { TerminalFrame } from "./TerminalFrame";

export function HowToPlay({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <main className="screen">
      <TerminalFrame title="> MISSION BRIEFING">
        <div className="howto-body">
          <p className="big-line">Ты — минёр. Не сапёр.</p>
          <div className="howto-divider">─────────────────────────────────</div>
          <p>Расставь мины на поле до старта.</p>
          <p>AI-сапёр будет искать путь к [★].</p>
          <p>Одна мина = одна смерть сапёра.</p>
          <p>Убей всех сапёров — победишь раунд.</p>
          <div className="howto-divider">─────────────────────────────────</div>
          <p className="howto-warn">&gt; Сапёры появляются с краёв поля.</p>
          <p className="howto-warn">&gt; Откуда — узнаешь только когда они придут.</p>
          <div className="howto-divider">─────────────────────────────────</div>
          <div className="howto-legend">
            <span><span className="howto-glyph">💣</span> обычная мина уничтожает сапёра</span>
            <span><span className="howto-glyph">[★]</span> Defuse Point — цель врага</span>
            <span><span className="howto-glyph">[ 3 ]</span> = 3 мины рядом с этой клеткой</span>
            <span><span className="howto-glyph">[■]</span> закрытая клетка в SAPPER VIEW</span>
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
