import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import Header from '../components/Header';
import MatchStateBlock from '../components/MatchStateBlock';
import Scorecard from '../components/Scorecard';
import { computeMatchScore, getMatchStatus, adjustTeamsForCourse } from '../utils/scoring';
import { TrophyIcon } from '../components/GolfIcon';

export default function WatchGame() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { game, scores, course, loading, error } = useGame(code);

  if (loading) {
    return (
      <div className="app-container">
        <Header title="Live Scores" />
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !game || !course) {
    return (
      <div className="app-container">
        <Header title="Live Scores" />
        <div className="error-screen">
          <h2>Game Not Found</h2>
          <p>{error || 'This game does not exist or has been deleted.'}</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const adjTeams = adjustTeamsForCourse(game.teams, course);
  const isComplete = game.status === 'complete';
  const isActive = game.status === 'active';

  const [t0pts, t1pts] = computeMatchScore(scores, adjTeams, course.holes);
  const status = getMatchStatus([t0pts, t1pts], [game.teams[0].name, game.teams[1].name]);
  const isAllSquare = status === 'ALL SQUARE';
  const winnerIdx = t0pts > t1pts ? 0 : t1pts > t0pts ? 1 : null;

  const liveIndicator = isActive ? (
    <div className="live-badge">LIVE</div>
  ) : null;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header
        title={isComplete ? 'Final Results' : `${course.name.split(' ')[0]} — Live`}
        rightElement={liveIndicator}
      />

      <div className="page" style={{ flex: 1, overflowY: 'auto' }}>
        {isActive && (
          <MatchStateBlock scores={scores} teams={adjTeams} courseHoles={course.holes} currentHole={game.currentHole} />
        )}

        {isComplete && (
          <div className="results-banner" style={{ marginBottom: 16 }}>
            <div className="results-trophy">
              <TrophyIcon size={48} color="rgba(255,255,255,0.9)" />
            </div>
            {isAllSquare ? (
              <>
                <div className="results-winner">All Square</div>
                <div className="results-score">Tied match</div>
              </>
            ) : (
              <>
                <div className="results-winner">{game.teams[winnerIdx].name}</div>
                <div className="results-score">{status}</div>
              </>
            )}
            <div className="results-subtitle">{game.course.name}</div>
          </div>
        )}

        <div className="match-summary" style={{ marginBottom: 16 }}>
          <div className={`summary-team${winnerIdx === 0 ? ' leader' : ''}`}>
            <div className="summary-team-name">{game.teams[0].name}</div>
            <div className="summary-points">{t0pts}</div>
          </div>
          <div className="summary-vs">PTS</div>
          <div className={`summary-team${winnerIdx === 1 ? ' leader' : ''}`}>
            <div className="summary-team-name">{game.teams[1].name}</div>
            <div className="summary-points">{t1pts}</div>
          </div>
        </div>

        <Scorecard scores={scores} teams={game.teams} course={course} />

        {isActive && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--grey-500)', marginTop: 12 }}>
            Scores update live as the round progresses
          </p>
        )}
      </div>
    </div>
  );
}
