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
    line = isLast
      ? `Tied, ${formatMoney(h.worth, currency)} left in the pot`
      : `Tied, ${formatMoney(h.worth, currency)} carries to hole ${holeNumber + 1}`;
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
