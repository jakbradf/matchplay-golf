import { formatMoney, formatSignedMoney } from '../utils/skins';

const WIN = '#0a8f4d';
const CARRY = '#d4af37';
const EMPTY = '#eef2ef';
const INK = '#0e1a13';
const GREEN = '#00a651';

function barStyle(status, isCurrent) {
  let bg = EMPTY, height = 3;
  if (status === 'won') { bg = WIN; height = 26; }
  else if (status === 'carry') { bg = CARRY; height = 14; }
  const empty = status !== 'won' && status !== 'carry';

  if (isCurrent) {
    return {
      height: Math.max(height, 26),
      background: empty ? 'transparent' : bg,
      boxShadow: `inset 0 0 0 2px ${empty ? GREEN : bg}`,
    };
  }
  return { height, background: bg };
}

// Skins game equivalent of MatchStateBlock: who's up the most, and the hole strip.
export default function SkinsStateBlock({ skinsResult, currency, currentHole }) {
  const { holes, totals } = skinsResult;
  const played = holes.filter((h) => h.status === 'won' || h.status === 'carry').length;
  const leader = [...totals].sort((a, b) => b.net - a.net)[0];
  const leaders = totals.filter((t) => t.net === leader.net);
  const leaderName = leaders.length > 2 ? `${leaders.length} tied` : leaders.map((t) => t.unit.name).join(' & ');
  const anyWon = totals.some((t) => t.net !== 0);
  const current = holes.find((h) => h.hole.number === currentHole);

  return (
    <div className="gm-match-block">
      <div className="gm-match-row">
        <div>
          <div className="gm-match-standing" style={{ color: anyWon ? GREEN : INK, fontSize: 28 }}>
            {anyWon ? `${leaderName} ${formatSignedMoney(leader.net, currency)}` : 'All square'}
          </div>
        </div>
        <div className="gm-match-sub">
          {current && current.status !== 'pending' ? `hole worth ${formatMoney(current.worth, currency)}` : ''}
          <br />
          {played ? `through ${played}, ${holes.length - played} to play` : 'not started'}
        </div>
      </div>
      <div className="gm-hole-strip">
        {holes.map((h) => (
          <div key={h.hole.number} className="gm-strip-bar" style={barStyle(h.status, h.hole.number === currentHole)} />
        ))}
      </div>
    </div>
  );
}
