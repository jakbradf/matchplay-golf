// The fourth chip covers "par+2 or worse": first tap sets double bogey, tapping it
// again while selected cycles further up (triple, quadruple, ...) before wrapping
// back to empty. This keeps exactly four chips and the original one-tap behaviour
// for birdie/par/bogey, while still reaching scores the design's flat par+2 cap can't.
const OVERFLOW_CAP = 4; // extra strokes past par+2 before the cycle wraps to empty

export default function GmPlayerScoreRow({ player, hole, gross, onChange, strokes = 0 }) {
  const chipValues = [hole.par - 1, hole.par, hole.par + 1];
  const overflowBase = hole.par + 2;
  const net = gross != null ? gross - strokes : null;
  const overflowSelected = gross != null && gross >= overflowBase;
  const overflowLabel = overflowSelected ? gross : overflowBase;

  const handleOverflowClick = () => {
    if (!overflowSelected) {
      onChange(overflowBase);
    } else if (gross >= overflowBase + OVERFLOW_CAP) {
      onChange(null);
    } else {
      onChange(gross + 1);
    }
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
        <button
          className={`gm-chip${overflowSelected ? ' selected' : ''}`}
          onClick={handleOverflowClick}
          aria-label={overflowSelected ? `Score ${overflowLabel}, tap to increase` : `Score ${overflowBase} or worse`}
          title={overflowSelected ? 'Tap to increase' : undefined}
        >
          {overflowLabel}
        </button>
      </div>
    </div>
  );
}
