import { formatMoney } from '../utils/skins';

// Live skins status for the hole currently being scored.
export default function SkinsHoleBanner({ skinsResult, holeNumber, currency }) {
  const h = skinsResult.holes.find((x) => x.hole.number === holeNumber);
  if (!h) return null;

  const isLast = holeNumber === skinsResult.holes[skinsResult.holes.length - 1].hole.number;
  let tone = 'open';
  let line;

  if (h.status === 'pending') {
    line = 'Earlier hole is missing scores, pot unknown';
  } else if (h.status === 'won') {
    tone = 'won';
    line = `${h.winner.name} takes ${formatMoney(h.worth, currency)}`;
  } else if (h.status === 'carry') {
    tone = 'carry';
    const everyone = h.tied.length === skinsResult.units.length;
    const who = everyone ? 'All tied' : `${h.tied.map((u) => u.name).join(' & ')} tied`;
    const po = isLast ? skinsResult.playoff : null;
    if (po) {
      tone = 'won';
      const range = po.holeNumbers.length > 1
        ? `holes ${po.holeNumbers[0]}–${po.holeNumbers[po.holeNumbers.length - 1]}`
        : `hole ${po.holeNumbers[0]}`;
      const allLevel = po.winners.length === skinsResult.units.length;
      line = allLevel
        ? `Everyone level on net ${po.best} over ${range}, nobody wins the pot`
        : po.split
          ? `${po.winners.map((u) => u.name).join(' & ')} share the pot, net ${po.best} over ${range}`
          : `${po.winners[0].name} takes the pot, lowest net over ${range} (${po.best})`;
      if (allLevel) tone = 'carry';
    } else {
      line = isLast
        ? `${who} on net ${h.best}, pot goes to lowest net over the carried holes`
        : `${who} on net ${h.best}, ${formatMoney(h.worth, currency)} carries to hole ${holeNumber + 1}`;
    }
  } else {
    line = h.carriedIn > 0
      ? `${h.carriedIn} hole${h.carriedIn > 1 ? 's' : ''} carried in`
      : 'Fresh pot';
  }

  return (
    <div className={`skins-banner skins-banner-${tone}`}>
      <div className="skins-banner-left">
        <span className="skins-banner-tag">Skins</span>
        <span className="skins-banner-line">{line}</span>
      </div>
      {h.status !== 'pending' && (
        <span className="skins-banner-worth">{formatMoney(h.worth, currency)}</span>
      )}
    </div>
  );
}
