import { computeMatchScore, getMatchStatus } from '../utils/scoring';

export default function MatchStatusBar({ scores, teams, courseHoles }) {
  const cumulative = computeMatchScore(scores, teams, courseHoles);
  const status = getMatchStatus(cumulative, [teams[0].name, teams[1].name]);
  const isAllSquare = status === 'ALL SQUARE';

  return (
    <div className={`match-status-bar${isAllSquare ? ' all-square' : ''}`}>
      {status}
    </div>
  );
}
