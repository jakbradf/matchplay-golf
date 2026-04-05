import ScoreInput from './ScoreInput';
import { PinIcon } from './GolfIcon';
import { getTeamBestNet } from '../utils/scoring';

export default function TeamScoringSection({
  team,
  teamIndex,
  hole,
  teamScores,
  onScoreChange,
  onClosestChange,
  otherTeamName,
}) {
  const bestNet = getTeamBestNet(teamScores, team.players, hole);
  const hasClosest = teamScores?.closestToPin === true;

  return (
    <div className="team-scoring-section">
      <div className="team-scoring-header">
        <span className="team-scoring-name">{team.name}</span>
        {bestNet !== Infinity && (
          <span className="team-best-net">Best net: {bestNet}</span>
        )}
      </div>

      {team.players.map((player, pIdx) => (
        <ScoreInput
          key={pIdx}
          player={player}
          playerIndex={pIdx}
          hole={hole}
          gross={teamScores?.[`player${pIdx}gross`] ?? null}
          onChange={(val) => onScoreChange(teamIndex, pIdx, val)}
        />
      ))}

      {hole.isParThree && (
        <div className="closest-to-pin">
          <div className="closest-to-pin-label">
            <PinIcon size={14} color="#7a6008" />
            Closest to Pin
          </div>
          <div className="toggle-group">
            <button
              className={`toggle-option${hasClosest ? ' selected' : ''}`}
              onClick={() => onClosestChange(teamIndex, true)}
            >
              {team.name}
            </button>
            <button
              className={`toggle-option${!hasClosest && teamScores?.closestToPin !== undefined ? '' : ''}`}
              onClick={() => onClosestChange(teamIndex, false)}
              style={
                teamScores?.closestToPin === false
                  ? { borderColor: 'var(--gold)', background: 'var(--gold)', color: 'white' }
                  : {}
              }
            >
              Neither
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
