import { Play, Settings, Star, Terminal } from "lucide-react";
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
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ `;

export function TitleScreen({
  onStart,
  onScreenChange,
  bestRound,
  muted,
  onAudioToggle,
}: {
  onStart: () => void;
  onScreenChange: (screen: "how-to-play" | "arsenal") => void;
  bestRound: number;
  muted: boolean;
  onAudioToggle: () => void;
}) {
  const typed = useTypewriter(logo, 5);
  return (
    <main className="screen title-screen">
      <MatrixRain />
      <TerminalFrame title="> MINELORD v1.0" action={<AudioToggle muted={muted} onToggle={onAudioToggle} />}>
        <div className="menu-container">
          <pre className="ascii-logo">{typed}</pre>
          <p className="tagline">"Думай как сапёр. Играй как злодей."</p>
          <div className="menu-stack">
            <button className="terminal-button terminal-button--primary" onClick={onStart}>
              <Play size={18} /> НАЧАТЬ ИГРУ
            </button>
            <button className="terminal-button" onClick={() => onScreenChange("how-to-play")}>
              <Terminal size={18} /> КАК ИГРАТЬ
            </button>
            <button className="terminal-button" onClick={() => onScreenChange("arsenal")}>
              <Settings size={18} /> АРСЕНАЛ
            </button>
            <button className="terminal-button" type="button" aria-label={`Leaderboard best round ${bestRound}`} disabled>
              <Star size={18} /> ЛИДЕРБОРД
            </button>
          </div>
        </div>
      </TerminalFrame>
    </main>
  );
}
