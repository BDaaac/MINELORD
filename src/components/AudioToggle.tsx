export function AudioToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button className="audio-toggle" type="button" onClick={onToggle} aria-label={muted ? "Включить музыку" : "Выключить музыку"}>
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
