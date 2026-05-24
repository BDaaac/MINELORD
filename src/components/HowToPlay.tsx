import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { TerminalFrame } from "./TerminalFrame";

const INTRO =
  "MINELORD — ты больше не сапёр.\nТы командуешь минным полем.\nТвоя задача — не дать врагу добраться\nдо точки дефьюза.";

const SECTION_IDS = ["howto", "numbers", "legend", "remember"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const LEGEND_CARDS: { glyph: string; numClass?: string; label: string; desc: string }[] = [
  { glyph: "💣", label: "обычная мина", desc: "уничтожает сапёра" },
  { glyph: "★", label: "Defuse Point", desc: "цель врага, защити", numClass: "howto-star" },
  { glyph: ">_", label: "сапёр", desc: "позиция на поле" },
  { glyph: "3", label: "3 мины рядом", desc: "читай цифры!", numClass: "hg-num-3" },
  { glyph: "■", label: "закрытая", desc: "в SAPPER VIEW" },
];

export function HowToPlay({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const [charCount, setCharCount] = useState(0);
  const [sections, setSections] = useState<Set<SectionId>>(new Set());
  const [buttonVisible, setButtonVisible] = useState(false);
  const skipRef = useRef(false);

  const skipAll = () => {
    if (skipRef.current) return;
    skipRef.current = true;
    setCharCount(INTRO.length);
    setSections(new Set(SECTION_IDS));
    setButtonVisible(true);
  };

  useEffect(() => {
    let char = 0;
    const iv = setInterval(() => {
      if (skipRef.current) { clearInterval(iv); return; }
      char++;
      setCharCount(char);
      if (char >= INTRO.length) {
        clearInterval(iv);
        let delay = 250;
        for (const id of SECTION_IDS) {
          const d = delay;
          setTimeout(() => { if (!skipRef.current) setSections((prev) => new Set([...prev, id])); }, d);
          delay += 220;
        }
        setTimeout(() => { if (!skipRef.current) setButtonVisible(true); }, delay);
      }
    }, 30);
    return () => clearInterval(iv);
  }, []);

  const typing = charCount < INTRO.length;

  return (
    <main className="screen" onClick={skipAll} role="presentation">
      <TerminalFrame title="> MISSION BRIEFING">
        <div className="howto-body">

          {/* Intro — types character by character */}
          <div className="howto-intro">
            <p className="howto-intro-text">
              {INTRO.slice(0, charCount)}
              {typing && <span className="howto-cursor">█</span>}
            </p>
          </div>

          {/* КАК ИГРАТЬ */}
          {sections.has("howto") && (
            <div className="howto-section howto-section--in">
              <div className="howto-section-header">КАК ИГРАТЬ</div>
              <div className="howto-rule" />
              <ol className="howto-steps">
                <li>Расставь мины до старта миссии</li>
                <li>AI-сапёр появится с края поля</li>
                <li>Он будет читать цифры и искать безопасный путь к <span className="howto-star">[★]</span></li>
                <li>Одна мина = одна смерть сапёра</li>
                <li>Убей всех — победишь раунд</li>
              </ol>
            </div>
          )}

          {/* КАК РАБОТАЮТ ЦИФРЫ */}
          {sections.has("numbers") && (
            <div className="howto-section howto-section--in">
              <div className="howto-section-header">КАК РАБОТАЮТ ЦИФРЫ</div>
              <div className="howto-rule" />
              <p className="howto-text">Когда сапёр открывает клетку — появляется цифра.</p>
              <p className="howto-text">Цифра = сколько мин находится в соседних 8 клетках вокруг неё.</p>
              <div className="howto-demo-wrap">
                <div className="howto-demo-grid">
                  {(["·","·","·","·",null,"·","·","·","·"] as (string | null)[]).map((v, i) =>
                    v === null
                      ? <span key={i} className="hg-cell hg-num-3">3</span>
                      : <span key={i} className="hg-cell hg-empty">{v}</span>,
                  )}
                </div>
                <span className="hg-arrow">← здесь 3 мины рядом</span>
              </div>
              <p className="howto-text">Сапёр читает цифры и вычисляет, где мины — и куда безопасно идти.</p>
              <p className="howto-tip">Твоя задача: расставить мины так, чтобы цифры <em>запутали</em> сапёра.</p>
              <p className="howto-text">
                Лучшая расстановка — когда мина окружена другими минами.<br />
                Цифры везде высокие — сапёр не понимает куда идти и рискует.
              </p>
              <div className="howto-num-legend">
                <span><span className="hg-num-1">1</span> низкий риск</span>
                <span><span className="hg-num-2">2</span> средний</span>
                <span><span className="hg-num-3">3</span> высокий</span>
                <span><span className="hg-num-4">4</span> очень опасно</span>
              </div>
              <p className="howto-warn">&gt; Думай как сапёр — куда бы ты сам НЕ пошёл? Туда и ставь мину.</p>
            </div>
          )}

          {/* ЛЕГЕНДА */}
          {sections.has("legend") && (
            <div className="howto-section howto-section--in">
              <div className="howto-section-header">ЛЕГЕНДА</div>
              <div className="howto-rule" />
              <div className="howto-cards">
                {LEGEND_CARDS.map((c) => (
                  <div className="howto-card" key={c.glyph}>
                    <div className={["howto-card-glyph", c.numClass ?? ""].join(" ").trim()}>{c.glyph}</div>
                    <div className="howto-card-label">{c.label}</div>
                    <div className="howto-card-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ПОМНИ */}
          {sections.has("remember") && (
            <div className="howto-section howto-section--in">
              <div className="howto-section-header">ПОМНИ</div>
              <div className="howto-rule" />
              <p className="howto-warn">&gt; Сапёры появляются с краёв поля</p>
              <p className="howto-warn">&gt; Откуда — узнаешь когда они придут</p>
              <p className="howto-warn">&gt; Цифры — твой главный инструмент</p>
              <p className="howto-warn">&gt; Думай как сапёр чтобы его обмануть</p>
            </div>
          )}

        </div>

        <div className={`menu-row howto-buttons${buttonVisible ? " howto-buttons--visible" : ""}`}>
          <button
            className="terminal-button terminal-button--primary"
            disabled={!buttonVisible}
            onClick={(e) => { e.stopPropagation(); onStart(); }}
          >
            <Play size={18} /> ПОНЯЛ. НАЧНЁМ
          </button>
          <button className="terminal-button" onClick={(e) => { e.stopPropagation(); onBack(); }}>
            НАЗАД
          </button>
        </div>
      </TerminalFrame>
    </main>
  );
}
