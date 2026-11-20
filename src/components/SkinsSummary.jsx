import { formatMoney } from '../utils/skins';

// Hole-by-hole skins results. Standings and settle-up live in the leaderboard's Money tab.
export default function SkinsSummary({ skinsResult, value, currency, hiddenNote }) {
  const { holes, openCarry, openCarryWorth } = skinsResult;

  return (
    <div className="skins-card">
      <div className="skins-card-head">
        <span className="section-title-sm" style={{ marginBottom: 0 }}>Skins by hole</span>
        <span className="skins-card-rate">{formatMoney(value, currency)} per skin</span>
      </div>

      {openCarry > 0 && (
        <p className="skins-carry-note">
          {formatMoney(openCarryWorth, currency)} riding ({openCarry} hole{openCarry > 1 ? 's' : ''} carried)
          {hiddenNote ? ` · ${hiddenNote}` : ''}
        </p>
      )}

      <div className="skins-holes">
        {holes.map((h) => (
          <div key={h.hole.number} className={`skins-hole skins-hole-${h.status}`}>
            <span className="skins-hole-num">{h.hole.number}</span>
            <span className="skins-hole-who">
              {h.status === 'won' && h.winner.name}
              {h.status === 'carry' && 'Carry'}
              {(h.status === 'incomplete' || h.status === 'pending') && '–'}
            </span>
            <span className="skins-hole-worth">
              {(h.status === 'won' || h.status === 'carry') ? formatMoney(h.worth, currency) : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
