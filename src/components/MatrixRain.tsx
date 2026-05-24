const columns = Array.from({ length: 34 }, (_, index) => index);
const glyphs = "101001 MINELORD $ > _ 404 BOOM DEFUSE";

export function MatrixRain() {
  return (
    <div className="matrix-rain" aria-hidden="true">
      {columns.map((column) => (
        <span
          key={column}
          style={{
            left: `${(column / columns.length) * 100}%`,
            animationDelay: `${(column % 12) * -0.7}s`,
            animationDuration: `${7 + (column % 7)}s`,
          }}
        >
          {glyphs}
        </span>
      ))}
    </div>
  );
}
