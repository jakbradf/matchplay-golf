import { PinIcon } from './GolfIcon';

// closestTeam: null | 0 | 1
export default function ClosestToPinSelector({ teams, closestTeam, onChange }) {
  return (
    <div className="closest-to-pin" style={{ margin: '0 0 16px' }}>
      <div className="closest-to-pin-label">
        <PinIcon size={14} color="#7a6008" />
        Closest to Pin
      </div>
      <div className="toggle-group">
        <button
          className={`toggle-option${closestTeam === 0 ? ' selected' : ''}`}
          onClick={() => onChange(closestTeam === 0 ? null : 0)}
        >
          {teams[0].name}
        </button>
        <button
          className={`toggle-option${closestTeam === 1 ? ' selected' : ''}`}
          onClick={() => onChange(closestTeam === 1 ? null : 1)}
        >
          {teams[1].name}
        </button>
      </div>
    </div>
  );
}
