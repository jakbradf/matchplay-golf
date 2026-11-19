import { formatMoney, formatSignedMoney } from '../utils/skins';

// Standings + hole-by-hole skins. Pass a computeSkins() result.
export default function SkinsSummary({ skinsResult, value, currency, hiddenNote }) {
  const { totals, holes, openCarry, openCarryWorth } = skinsResult;
  const ranked = [...totals].sort((a, b) => b.net - a.net);
  const anyResolved = holes.some((h) => h.status === 'won' || h.status === 'carry');

  return (
    <div className="skins-card">
      <div className="skins-card-head">
        <span className="section-title-sm" style={{ marginBottom: 0 }}>Skins</span>
        <span className="skins-card-rate">{formatMoney(value, currency)} per skin</span>
      </div>

      <div className="skins-standings">
        {ranked.map((t) => (
          <div key={t.unit.key} className="skins-standing-row">
            <div className="skins-standing-name">
              <span>{t.unit.name}</span>
              <span className="skins-standing-sub">
                {t.unit.sub ? `${t.unit.sub} · ` : ''}
                {t.holesWon > 0 ? `${t.skins} skin${t.skins > 1 ? 's' : ''} · ${t.holesWon} hole${t.holesWon > 1 ? 's' : ''}` : 'no skins yet'}
              </span>
            </div>
            <span className={`skins-standing-net${t.net > 0 ? ' up' : t.net < 0 ? ' down' : ''}`}>
              {formatSignedMoney(t.net, currency)}
            </span>
          </div>
        ))}
      </div>

      {openCarry > 0 && (
        <p className="skins-carry-note">
          {formatMoney(openCarryWorth, currency)} riding ({openCarry} hole{openCarry > 1 ? 's' : ''} carried)
          {hiddenNote ? ` · ${hiddenNote}` : ''}
        </p>
      )}

      {anyResolved && (
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
      )}
    </div>
  );
}
