import { Play, Settings, Terminal } from "lucide-react";
import { useTypewriter } from "../hooks/useTypewriter";
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
  muted,
  onAudioToggle,
}: {
  onStart: () => void;
  onHowTo: () => void;
  onArsenal: () => void;
  muted: boolean;
  onAudioToggle: () => void;
}) {
  const typed = useTypewriter(logo, 18);

  return (
    <main className="screen title-screen">
      <MatrixRain />
      <TerminalFrame title="> MINELORD v1.0" action={<AudioToggle muted={muted} onToggle={onAudioToggle} />}>
        <pre className="ascii-logo">{typed}</pre>
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
        </div>
        <p className="prompt-line">
          &gt; ожидаю команду
          <span className="cursor">_</span>
        </p>
      </TerminalFrame>
    </main>
  );
}
