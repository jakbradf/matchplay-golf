import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import Header from '../components/Header';
import Scorecard from '../components/Scorecard';
import { computeMatchScore, getMatchStatus } from '../utils/scoring';
import { TrophyIcon } from '../components/GolfIcon';

export default function Results() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { game, scores, course, loading, error } = useGame(code);

  if (loading) {
    return (
      <div className="app-container">
        <Header title="Results" showBack backTo="/" />
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading results...</span>
        </div>
      </div>
    );
  }

  if (error || !game || !course) {
    return (
      <div className="app-container">
        <Header title="Results" showBack backTo="/" />
        <div className="error-screen">
          <h2>Not Found</h2>
          <p>Could not load game results.</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const [t0pts, t1pts] = computeMatchScore(scores, game.teams, course.holes);
  const status = getMatchStatus([t0pts, t1pts], [game.teams[0].name, game.teams[1].name]);
  const isAllSquare = status === 'ALL SQUARE';
  const winnerIdx = t0pts > t1pts ? 0 : t1pts > t0pts ? 1 : null;

  return (
    <div className="app-container">
      <Header title="Final Results" showBack backTo="/" />

      <div className="page">
        <div className="results-banner">
          <div className="results-trophy">
            <TrophyIcon size={56} color="rgba(255,255,255,0.9)" />
          </div>
          {isAllSquare ? (
            <>
              <div className="results-winner">All Square</div>
              <div className="results-score">Tied match</div>
            </>
          ) : (
            <>
              <div className="results-winner">
                {game.teams[winnerIdx].name}
              </div>
              <div className="results-score">{status}</div>
            </>
          )}
          <div className="results-subtitle">{game.course.name}</div>
        </div>

        {/* Points summary */}
        <div className="match-summary">
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

        <div className="divider" />

        <p className="section-title">Full Scorecard</p>
        <Scorecard scores={scores} teams={game.teams} course={course} />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate('/')}
          >
            Home
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => navigate('/create')}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
