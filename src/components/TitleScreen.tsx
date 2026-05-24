import { Medal, Play, Settings, Terminal } from "lucide-react";
import { AudioToggle } from "./AudioToggle";
import { MatrixRain } from "./MatrixRain";
import { TerminalFrame } from "./TerminalFrame";

const logo = String.raw`
███╗   ███╗██╗███╗   ██╗███████╗██╗      ██████╗ ██████╗ ██████╗
████╗ ████║██║████╗  ██║██╔════╝██║     ██╔═══██╗██╔══██╗██╔══██╗
██╔████╔██║██║██╔██╗ ██║█████╗  ██║     ██║   ██║██████╔╝██║  ██║
██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██║     ██║   ██║██╔══██╗██║  ██║
██║ ╚═╝ ██║██║██║ ╚████║███████╗███████╗╚██████╔╝██║  ██║██████╔╝
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝

Think like a Sapper.
Play like a Villain.`;

export function TitleScreen({
  onStart,
  onHowTo,
  onArsenal,
  onAchievements,
  muted,
  onAudioToggle,
}: {
  onStart: () => void;
  onHowTo: () => void;
  onArsenal: () => void;
  onAchievements: () => void;
  muted: boolean;
  onAudioToggle: () => void;
}) {
  return (
    <main className="screen title-screen">
      <MatrixRain />
      <TerminalFrame title="> MINELORD v1.0" action={<AudioToggle muted={muted} onToggle={onAudioToggle} />}>
        <pre className="ascii-logo ascii-logo--desktop">{logo}</pre>
        <div className="ascii-logo-mobile" aria-label="MINELORD">
          <div className="ascii-logo-mobile__title">MINELORD</div>
          <div className="ascii-logo-mobile__tagline">Think like a Sapper.</div>
          <div className="ascii-logo-mobile__tagline">Play like a Villain.</div>
        </div>
        <div className="menu-stack">
          <button className="terminal-button terminal-button--primary" onClick={onStart}>
            <Play size={18} /> НАЧАТЬ ИГРУ
          </button>
          <button className="terminal-button" onClick={onHowTo}>
            <Terminal size={18} /> КАК ИГРАТЬ
          </button>
          <button className="terminal-button" onClick={onArsenal}>
            <Settings size={18} /> АРСЕНАЛ
          </button>
          <button className="terminal-button" onClick={onAchievements}>
            <Medal size={18} /> ДОСТИЖЕНИЯ
          </button>
        </div>
        <p className="prompt-line">
          &gt; ожидаю команду
          <span className="cursor">_</span>
        </p>
      </TerminalFrame>
    </main>
  );
}
