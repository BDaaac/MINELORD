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
  onHowTo,
  onArsenal,
  bestRound,
  muted,
  onAudioToggle,
}: {
  onStart: () => void;
  onHowTo: () => void;
  onArsenal: () => void;
  bestRound: number;
  muted: boolean;
  onAudioToggle: () => void;
}) {
  const typed = useTypewriter(logo, 5);
  return (
    <main className="screen title-screen">
      <MatrixRain />
      <TerminalFrame title="> MINELORD v1.0" action={<AudioToggle muted={muted} onToggle={onAudioToggle} />}>
        <pre className="ascii-logo">{typed}</pre>
        <p className="tagline">"Think like a Sapper. Play like a Villain."</p>
        <div className="menu-stack">
          <button className="terminal-button terminal-button--primary" onClick={onStart}>
            <Play size={18} /> START GAME
          </button>
          <button className="terminal-button" onClick={onHowTo}>
            <Terminal size={18} /> HOW TO PLAY
          </button>
          <button className="terminal-button" onClick={onArsenal}>
            <Settings size={18} /> ARSENAL
          </button>
          <button className="terminal-button" type="button" aria-label={`Leaderboard best round ${bestRound}`}>
            <Star size={18} /> LEADERBOARD
          </button>
        </div>
        <p className="prompt-line">&gt; awaiting command<span className="cursor">_</span></p>
      </TerminalFrame>
    </main>
  );
}
