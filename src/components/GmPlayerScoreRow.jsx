export default function GmPlayerScoreRow({ player, hole, gross, onChange, strokes = 0 }) {
  const net = gross != null ? gross - strokes : null;

  const decrement = () => {
    if (gross == null) onChange(hole.par + 2);
    else if (gross > 1) onChange(gross - 1);
  };
  const increment = () => {
    if (gross == null) onChange(hole.par);
    else onChange(gross + 1);
  };

  return (
    <div className="gm-player-row">
      <div className="gm-player-info">
        <div className="gm-player-name-row">
          <span className="gm-player-name">{player.name}</span>
          {strokes > 0 && (
            <div className="gm-player-dots" title={`+${strokes} stroke${strokes > 1 ? 's' : ''}`}>
              {Array.from({ length: strokes }).map((_, i) => (
                <span key={i} className="gm-dot" />
              ))}
            </div>
          )}
        </div>
        <div className="gm-player-meta">
          hcp {player.handicap}{net != null ? ` net ${net}` : ''}
        </div>
      </div>
      <div className="score-controls">
        <button className="score-btn minus" onClick={decrement} aria-label="Decrease score">−</button>
        <div className={`score-display${gross == null ? ' empty' : ''}`}>{gross != null ? gross : '—'}</div>
        <button className="score-btn plus" onClick={increment} aria-label="Increase score">+</button>
      </div>
    </div>
  );
}
