import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import Header from '../components/Header';
import MatchStatusBar from '../components/MatchStatusBar';
import ScoreInput from '../components/ScoreInput';
import ClosestToPinSelector from '../components/ClosestToPinSelector';
import Scorecard from '../components/Scorecard';
import { updateGame, saveHoleScores } from '../firebase/gameService';
import { getTeamBestNet, getHoleResult, computeMatchScore, getMatchStatus } from '../utils/scoring';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/GolfIcon';

// ===== LOBBY =====
function LobbyView({ game, gameCode, navigate }) {
  const [starting, setStarting] = useState(false);

  const startGame = async () => {
    setStarting(true);
    try {
      await updateGame(gameCode, { status: 'active', currentHole: 1 });
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  const shareUrl = `${window.location.origin}/join?code=${gameCode}`;

  return (
    <div className="page">
      <div className="game-code-display">
        <div className="game-code-label">Game Code</div>
        <div className="game-code-value">{gameCode}</div>
        <div className="game-code-hint">{game.course.name}</div>
      </div>

      {game.teams.map((team, ti) => (
        <div className="card mt-8" key={ti}>
          <p className="section-title-sm">{team.name}</p>
          <ul className="players-list">
            {team.players.map((p, pi) => (
              <li key={pi} className="player-item">
                <span>{p.name}</span>
                <span className="player-hcp">HCP {p.handicap}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ marginTop: 24 }}>
        <button
          className="btn btn-primary btn-full"
          style={{ minHeight: 60, fontSize: '1.1rem' }}
          onClick={startGame}
          disabled={starting}
        >
          {starting ? 'Starting...' : 'Start Game'}
        </button>
      </div>

      <div className="card mt-12" style={{ textAlign: 'center' }}>
        <p className="section-title-sm">Share</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--grey-600)', marginBottom: 8 }}>
          Others can join with the code above or this link:
        </p>
        <div className="share-link">
          <span className="share-link-text">{shareUrl}</span>
          <button
            className="share-link-copy"
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== HOLE SCORING =====
function HoleScoringView({ game, scores, course, gameCode }) {
  const [currentHole, setCurrentHole] = useState(game.currentHole || 1);
  const [localScores, setLocalScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('score'); // 'score' | 'card'

  const hole = course.holes[currentHole - 1];
  const savedHoleScores = scores[String(currentHole)] || {};

  // Merge saved scores with local changes
  const effectiveScores = {
    team0: { ...savedHoleScores.team0, ...localScores.team0 },
    team1: { ...savedHoleScores.team1, ...localScores.team1 },
  };

  // Figure out closestToPin from effectiveScores
  const closestTeam =
    effectiveScores.team0?.closestToPin === true ? 0 :
    effectiveScores.team1?.closestToPin === true ? 1 : null;

  const handleScoreChange = useCallback((teamIdx, playerIdx, gross) => {
    const teamKey = `team${teamIdx}`;
    setLocalScores(prev => ({
      ...prev,
      [teamKey]: {
        ...(prev[teamKey] || {}),
        [`player${playerIdx}gross`]: gross,
      }
    }));
  }, []);

  const handleClosestChange = useCallback((teamIdx) => {
    // teamIdx = null means neither
    setLocalScores(prev => ({
      ...prev,
      team0: { ...(prev.team0 || {}), closestToPin: teamIdx === 0 },
      team1: { ...(prev.team1 || {}), closestToPin: teamIdx === 1 },
    }));
  }, []);

  const saveCurrentHole = async () => {
    // Merge local into saved
    const toSave = {
      team0: { ...savedHoleScores.team0, ...localScores.team0 },
      team1: { ...savedHoleScores.team1, ...localScores.team1 },
    };
    setSaving(true);
    try {
      await saveHoleScores(gameCode, currentHole, toSave);
      setLocalScores({});
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const goToHole = async (holeNum) => {
    await saveCurrentHole();
    setCurrentHole(holeNum);
    await updateGame(gameCode, { currentHole: holeNum });
  };

  const goNext = () => {
    if (currentHole < 18) goToHole(currentHole + 1);
  };

  const goPrev = () => {
    if (currentHole > 1) goToHole(currentHole - 1);
  };

  const finishGame = async () => {
    await saveCurrentHole();
    await updateGame(gameCode, { status: 'complete' });
  };

  // Count completed holes (both teams have at least one score)
  const completedHoles = course.holes.filter((h) => {
    const hs = scores[String(h.number)];
    return (
      hs &&
      (hs.team0?.player0gross != null || hs.team1?.player0gross != null)
    );
  });

  const allHoleScores = { ...scores };
  // Apply local scores for match status display
  if (Object.keys(localScores).length > 0) {
    allHoleScores[String(currentHole)] = {
      ...allHoleScores[String(currentHole)],
      team0: { ...(allHoleScores[String(currentHole)]?.team0 || {}), ...localScores.team0 },
      team1: { ...(allHoleScores[String(currentHole)]?.team1 || {}), ...localScores.team1 },
    };
  }

  const holeResult = getHoleResult(effectiveScores, game.teams, hole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <MatchStatusBar scores={allHoleScores} teams={game.teams} courseHoles={course.holes} />

      <div className="tabs" style={{ margin: '0', padding: '0 16px' }}>
        <button
          className={`tab-btn${activeTab === 'score' ? ' active' : ''}`}
          onClick={() => setActiveTab('score')}
        >
          Score Entry
        </button>
        <button
          className={`tab-btn${activeTab === 'card' ? ' active' : ''}`}
          onClick={() => setActiveTab('card')}
        >
          Scorecard
        </button>
      </div>

      {activeTab === 'score' && (
        <>
          <div style={{ padding: '16px 16px 0' }}>
            {/* Hole selector grid */}
            <div className="hole-selector-grid">
              {course.holes.map((h) => {
                const isCompleted = completedHoles.some(ch => ch.number === h.number);
                const isActive = h.number === currentHole;
                return (
                  <button
                    key={h.number}
                    className={`hole-selector-btn${isActive ? ' active' : ''}${!isActive && isCompleted ? ' completed' : ''}`}
                    onClick={() => h.number !== currentHole && goToHole(h.number)}
                  >
                    {h.number}
                  </button>
                );
              })}
            </div>

            {/* Hole info */}
            <div className="hole-info-header">
              <div className="hole-stat">
                <div className="hole-stat-label">Hole</div>
                <div className="hole-stat-value">{hole.number}</div>
              </div>
              <div className="hole-stat">
                <div className="hole-stat-label">Par</div>
                <div className={`hole-stat-value${hole.isParThree ? ' par-3' : ''}`}>{hole.par}</div>
              </div>
              <div className="hole-stat">
                <div className="hole-stat-label">Dist</div>
                <div className="hole-stat-value" style={{ fontSize: '1rem' }}>{hole.distance}m</div>
              </div>
              <div className="hole-stat">
                <div className="hole-stat-label">SI</div>
                <div className="hole-stat-value">{hole.strokeIndex}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
            {/* Closest to pin — for par 3s, shown above team sections */}
            {hole.isParThree && (
              <ClosestToPinSelector
                teams={game.teams}
                closestTeam={closestTeam}
                onChange={handleClosestChange}
              />
            )}

            {/* Team score sections */}
            {game.teams.map((team, ti) => {
              const teamScores = effectiveScores[`team${ti}`] || {};
              const bestNet = getTeamBestNet(teamScores, team.players, hole);
              return (
                <div key={ti} className="team-scoring-section">
                  <div className="team-scoring-header">
                    <span className="team-scoring-name">{team.name}</span>
                    {bestNet !== Infinity && (
                      <span className="team-best-net">Best net: {bestNet}</span>
                    )}
                  </div>
                  {team.players.map((player, pi) => (
                    <ScoreInput
                      key={pi}
                      player={player}
                      playerIndex={pi}
                      hole={hole}
                      gross={teamScores[`player${pi}gross`] ?? null}
                      onChange={(val) => handleScoreChange(ti, pi, val)}
                    />
                  ))}
                </div>
              );
            })}

            {/* Hole result preview */}
            {holeResult && (
              <div style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: holeResult.result === 'halved' ? 'var(--grey-100)' : 'var(--green-light)',
                color: holeResult.result === 'halved' ? 'var(--grey-700)' : 'var(--green-dark)',
                fontWeight: 700,
                fontSize: '0.9375rem',
                marginBottom: 8,
                border: `1px solid ${holeResult.result === 'halved' ? 'var(--grey-300)' : 'var(--green-mid)'}`,
              }}>
                {holeResult.result === 'halved'
                  ? 'Hole Halved'
                  : `${game.teams[parseInt(holeResult.result.replace('team', ''))].name} wins hole`}
                {holeResult.team0points + holeResult.team1points > 1
                  ? ` (+${Math.max(holeResult.team0points, holeResult.team1points)} pts)`
                  : ''}
              </div>
            )}

            {/* Save button */}
            <button
              className="btn btn-primary btn-full"
              onClick={saveCurrentHole}
              disabled={saving}
              style={{ marginBottom: 8 }}
            >
              {saving ? 'Saving...' : 'Save Scores'}
            </button>

            {currentHole === 18 && (
              <button
                className="btn btn-secondary btn-full"
                onClick={finishGame}
                disabled={saving}
              >
                Finish Game
              </button>
            )}
          </div>

          {/* Sticky hole navigation */}
          <div className="hole-nav">
            <button
              className="btn btn-secondary btn-sm"
              onClick={goPrev}
              disabled={currentHole === 1}
              style={{ minWidth: 100 }}
            >
              <ChevronLeftIcon size={16} />
              Prev
            </button>

            <span style={{ fontSize: '0.875rem', color: 'var(--grey-600)', fontWeight: 600 }}>
              {currentHole} / 18
            </span>

            <button
              className="btn btn-primary btn-sm"
              onClick={currentHole === 18 ? finishGame : goNext}
              style={{ minWidth: 100 }}
            >
              {currentHole === 18 ? 'Finish' : 'Next'}
              {currentHole !== 18 && <ChevronRightIcon size={16} />}
            </button>
          </div>
        </>
      )}

      {activeTab === 'card' && (
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          <Scorecard scores={allHoleScores} teams={game.teams} course={course} />
        </div>
      )}
    </div>
  );
}

// ===== MAIN GAME VIEW =====
export default function GameView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { game, scores, course, loading, error } = useGame(code);

  if (loading) {
    return (
      <div className="app-container">
        <Header title="Loading..." showBack backTo="/" />
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading game...</span>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="app-container">
        <Header title="Error" showBack backTo="/" />
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

  if (game.status === 'complete') {
    navigate(`/game/${code}/results`, { replace: true });
    return null;
  }

  const title = game.status === 'lobby'
    ? 'Game Lobby'
    : course
      ? `Hole ${game.currentHole} — ${course.name.split(' ')[0]}`
      : 'Scoring';

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header title={title} showBack backTo="/" />

      {game.status === 'lobby' && (
        <LobbyView game={game} gameCode={code} navigate={navigate} />
      )}

      {game.status === 'active' && course && (
        <HoleScoringView
          game={game}
          scores={scores}
          course={course}
          gameCode={code}
        />
      )}
    </div>
  );
}
