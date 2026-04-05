import { getStrokesOnHole, getNetScore } from '../utils/scoring';

export default function ScoreInput({ player, playerIndex, hole, gross, onChange }) {
  const strokes = getStrokesOnHole(player.handicap, hole.strokeIndex);
  const net = gross != null ? getNetScore(gross, player.handicap, hole.strokeIndex) : null;

  const decrement = () => {
    if (gross == null) {
      onChange(hole.par + 2);
    } else if (gross > 1) {
      onChange(gross - 1);
    }
  };

  const increment = () => {
    if (gross == null) {
      onChange(hole.par);
    } else {
      onChange(gross + 1);
    }
  };

  return (
    <div className="player-score-row">
      <div className="player-score-info">
        <div className="player-score-name">{player.name}</div>
        {strokes > 0 && (
          <div className="stroke-dots">
            {Array.from({ length: strokes }).map((_, i) => (
              <div key={i} className="stroke-dot" title={`+${strokes} stroke${strokes > 1 ? 's' : ''}`} />
            ))}
          </div>
        )}
        {gross != null && (
          <div className="score-net-badge">
            Net: {net} {net < hole.par ? '▼' : net === hole.par ? '=' : '▲'}
          </div>
        )}
      </div>

      <div className="score-controls">
        <button
          className="score-btn minus"
          onClick={decrement}
          aria-label="Decrease score"
        >
          −
        </button>
        <div className={`score-display${gross == null ? ' empty' : ''}`}>
          {gross != null ? gross : '—'}
        </div>
        <button
          className="score-btn plus"
          onClick={increment}
          aria-label="Increase score"
        >
          +
        </button>
      </div>
    </div>
  );
}
