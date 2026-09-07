const WIN = '#0a8f4d';
const WIN_TINT = '#dff3e6';
const LOSE = '#c8332c';
const LOSE_TINT = '#fae4e2';
const INK = '#0e1a13';
const LINE = '#e3e9e5';

export default function SettledHoleBadge({ result, winningTeamName, net0, net1 }) {
  if (!result) return null;

  const halved = result === 'halved';
  const color = halved ? INK : WIN;
  const bg = halved ? '#ffffff' : WIN_TINT;
  const border = halved ? LINE : WIN;
  const word = halved ? 'Hole halved' : `${winningTeamName} wins the hole`;
  const sub = halved ? `both net ${net0}` : `net ${Math.min(net0, net1)} beats ${Math.max(net0, net1)}`;

  return (
    <div className="gm-settled" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="gm-settled-bar" style={{ background: color }} />
      <div>
        <div className="gm-settled-word" style={{ color }}>{word}</div>
        <div className="gm-settled-sub">{sub}</div>
      </div>
    </div>
  );
}
