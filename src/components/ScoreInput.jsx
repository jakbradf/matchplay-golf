import { getStrokesOnHole } from '../utils/scoring';
import PlayerAvatar from './PlayerAvatar';

export default function ScoreInput({ player, playerIndex, hole, gross, onChange, matchplayStrokes = 0 }) {
  const strokes = getStrokesOnHole(player.handicap, hole.strokeIndex);
  const net = gross != null ? gross - matchplayStrokes : null;

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
      <div className="player-score-info" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <PlayerAvatar name={player.name} photoURL={player.photoURL} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
        <div className="player-score-name">{player.name}</div>
        <div className="stroke-indicators-row">
          {strokes > 0 && (
            <div className="stroke-dots" title={`+${strokes} stroke${strokes > 1 ? 's' : ''} (HCP ${player.handicap})`}>
              {Array.from({ length: strokes }).map((_, i) => (
                <div key={i} className="stroke-dot" />
              ))}
            </div>
          )}
          {matchplayStrokes > 0 && (
            <div className="stroke-dots" title={`+${matchplayStrokes} matchplay stroke${matchplayStrokes > 1 ? 's' : ''} vs best player`}>
              {Array.from({ length: matchplayStrokes }).map((_, i) => (
                <div key={i} className="stroke-dot-ring" />
              ))}
            </div>
          )}
        </div>
        {gross != null && (
          <div className="score-net-badge">
            Net: {net} {net < hole.par ? '▼' : net === hole.par ? '=' : '▲'}
          </div>
        )}
        </div>
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
