export default function GmPlayerScoreRow({ player, hole, gross, onChange, strokes = 0 }) {
  const chipValues = [hole.par - 1, hole.par, hole.par + 1, hole.par + 2];
  const net = gross != null ? gross - strokes : null;

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
      <div className="gm-chip-row">
        {chipValues.map((v) => (
          <button
            key={v}
            className={`gm-chip${gross === v ? ' selected' : ''}`}
            onClick={() => onChange(gross === v ? null : v)}
            aria-label={`Score ${v}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
