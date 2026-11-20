import { formatMoney } from '../utils/skins';

// Hole-by-hole skins results. Standings and settle-up live in the leaderboard's Money tab.
export default function SkinsSummary({ skinsResult, value, currency, hiddenNote }) {
  const { holes, openCarry, openCarryWorth, playoff, units } = skinsResult;

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

      {playoff && (
        <div className="skins-playoff">
          <p className="skins-playoff-title">
            Pot after 18: {playoff.winners.length === units.length
              ? 'everyone level, nobody wins it'
              : playoff.split
              ? `split between ${playoff.winners.map((u) => u.name).join(' & ')}`
              : `${playoff.winners[0].name} takes ${formatMoney(playoff.worth, currency)}`}
          </p>
          <p className="skins-playoff-sub">
            Lowest net over holes {playoff.holeNumbers.join(', ')}:{' '}
            {units.map((u, i) => `${u.name} ${playoff.sums[i]}`).join(' · ')}
          </p>
        </div>
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
