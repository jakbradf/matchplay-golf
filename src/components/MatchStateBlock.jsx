import { computeMatchScore, getHoleResultsSeries } from '../utils/scoring';

const WIN = '#0a8f4d';
const LOSE = '#c8332c';
const HALVE = '#1a1a1a';
const EMPTY = '#eef2ef';
const INK = '#0e1a13';
const GREEN = '#00a651';

function barStyle(result, isCurrent) {
  let bg = EMPTY, height = 3;
  if (result === 1) { bg = WIN; height = 26; }
  else if (result === -1) { bg = LOSE; height = 14; }
  else if (result === 0) { bg = HALVE; height = 3; }

  if (isCurrent) {
    return {
      height: Math.max(height, 26),
      background: result == null ? 'transparent' : bg,
      boxShadow: `inset 0 0 0 2px ${result == null ? GREEN : bg}`,
    };
  }
  return { height, background: bg };
}

export default function MatchStateBlock({ scores, teams, courseHoles, currentHole }) {
  const [t0, t1] = computeMatchScore(scores, teams, courseHoles);
  const diff = t0 - t1;
  const results = getHoleResultsSeries(scores, teams, courseHoles);
  const played = results.filter((r) => r != null).length;

  const leadingTeam = diff > 0 ? teams[0] : teams[1];
  const standingLabel = diff === 0 ? 'All square' : `${leadingTeam.name} ${Math.abs(diff)} up`;
  const standingColor = diff === 0 ? INK : GREEN;

  return (
    <div className="gm-match-block">
      <div className="gm-match-row">
        <div className="gm-match-standing" style={{ color: standingColor }}>{standingLabel}</div>
        <div className="gm-match-sub">
          {played ? `through ${played} ${18 - played} to play` : 'not started'}
        </div>
      </div>
      <div className="gm-hole-strip">
        {courseHoles.map((hole, i) => (
          <div key={hole.number} className="gm-strip-bar" style={barStyle(results[i], hole.number === currentHole)} />
        ))}
      </div>
    </div>
  );
}
