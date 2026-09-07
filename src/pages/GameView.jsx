import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import Header from '../components/Header';
import MatchStateBlock from '../components/MatchStateBlock';
import SettledHoleBadge from '../components/SettledHoleBadge';
import GmPlayerScoreRow from '../components/GmPlayerScoreRow';
import ClosestToPinSelector from '../components/ClosestToPinSelector';
import Scorecard from '../components/Scorecard';
import { updateGame, saveHoleScores } from '../firebase/gameService';
import { getTeamBestNet, getHoleResult, getMatchplayStrokes, adjustTeamsForCourse } from '../utils/scoring';
import { ShareIcon, ChevronLeftIcon } from '../components/GolfIcon';

// ===== LOBBY =====
function LobbyView({ game, gameCode }) {
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
function HoleScoringView({ game, scores, course, gameCode, onShare }) {
  const navigate = useNavigate();
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
    setLocalScores(prev => ({
      ...prev,
      team0: { ...(prev.team0 || {}), closestToPin: teamIdx === 0 },
      team1: { ...(prev.team1 || {}), closestToPin: teamIdx === 1 },
    }));
  }, []);

  const handleExtraPointChange = useCallback((teamIdx, delta) => {
    const teamKey = `team${teamIdx}`;
    setLocalScores(prev => {
      const base = (prev[teamKey]?.extraPoints !== undefined
        ? prev[teamKey].extraPoints
        : savedHoleScores[teamKey]?.extraPoints) || 0;
      return {
        ...prev,
        [teamKey]: { ...(prev[teamKey] || {}), extraPoints: Math.max(0, base + delta) },
      };
    });
  }, [savedHoleScores]);

  const saveCurrentHole = async () => {
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

  const goNext = () => goToHole(Math.min(18, currentHole + 1));
  const goPrev = () => goToHole(Math.max(1, currentHole - 1));

  const finishGame = async () => {
    await saveCurrentHole();
    await updateGame(gameCode, { status: 'complete' });
  };

  const allHoleScores = { ...scores };
  if (Object.keys(localScores).length > 0) {
    allHoleScores[String(currentHole)] = {
      ...allHoleScores[String(currentHole)],
      team0: { ...(allHoleScores[String(currentHole)]?.team0 || {}), ...localScores.team0 },
      team1: { ...(allHoleScores[String(currentHole)]?.team1 || {}), ...localScores.team1 },
    };
  }

  const adjTeams = adjustTeamsForCourse(game.teams, course);
  const holeResult = getHoleResult(effectiveScores, adjTeams, hole);
  const allPlayers = adjTeams.flatMap(t => t.players);
  const minHandicap = Math.min(...allPlayers.map(p => p.handicap));

  const nextLabel = currentHole >= 18 ? 'Finish' : (holeResult ? `Hole ${currentHole + 1}` : 'Skip ahead');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Bespoke scoring header — game/course row, then the hole itself */}
      <div className="gm-score-header">
        <div className="gm-score-header-row1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button
              onClick={() => navigate('/')}
              aria-label="Back to home"
              style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', cursor: 'pointer', flexShrink: 0 }}
            >
              <ChevronLeftIcon size={18} color="#5b6b62" />
            </button>
            <span className="gm-score-eyebrow">{game.teams[0].name} vs {game.teams[1].name}</span>
          </div>
          <span className="gm-score-course">{course.name}</span>
        </div>
        <div className="gm-score-header-row2">
          <span className="gm-hole-number">Hole {hole.number}</span>
          <span className="gm-hole-meta">Par {hole.par} &middot; SI {hole.strokeIndex} &middot; {hole.distance} m</span>
        </div>
      </div>

      <MatchStateBlock scores={allHoleScores} teams={adjTeams} courseHoles={course.holes} currentHole={currentHole} />

      <div className="game-share-bar">
        <div className="game-share-code">
          Code: <strong>{gameCode}</strong>
        </div>
        <button className="game-share-btn" onClick={onShare}>
          <ShareIcon size={14} color="var(--green-dark)" />
          Share
        </button>
      </div>

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
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
            {holeResult && (
              <div style={{ padding: '4px 20px 0' }}>
                <SettledHoleBadge
                  result={holeResult.result}
                  winningTeamName={holeResult.result !== 'halved' ? adjTeams[parseInt(holeResult.result.replace('team', ''), 10)].name : null}
                  net0={getTeamBestNet(effectiveScores.team0, adjTeams[0].players, hole, minHandicap)}
                  net1={getTeamBestNet(effectiveScores.team1, adjTeams[1].players, hole, minHandicap)}
                />
              </div>
            )}

            {hole.isParThree && (
              <div style={{ padding: '0 20px' }}>
                <ClosestToPinSelector
                  teams={game.teams}
                  closestTeam={closestTeam}
                  onChange={handleClosestChange}
                />
              </div>
            )}

            {adjTeams.map((team, ti) => {
              const teamScores = effectiveScores[`team${ti}`] || {};
              const bestNet = getTeamBestNet(teamScores, team.players, hole, minHandicap);
              return (
                <div key={ti} className={`gm-team-block${ti === 1 ? ' alt' : ''}${holeResult && holeResult.result === `team${ti}` ? ' winner' : ''}`}>
                  <div className="gm-team-header">
                    <span className="gm-team-mark" style={{ background: ti === 0 ? '#00a651' : '#8fa197' }} />
                    <span className="gm-team-name">{team.name}</span>
                    <span className="gm-team-best">{bestNet !== Infinity ? `net ${bestNet}` : '—'}</span>
                  </div>
                  {team.players.map((player, pi) => (
                    <GmPlayerScoreRow
                      key={pi}
                      player={player}
                      hole={hole}
                      gross={teamScores[`player${pi}gross`] ?? null}
                      onChange={(val) => handleScoreChange(ti, pi, val)}
                      strokes={getMatchplayStrokes(player.handicap, minHandicap, hole.strokeIndex)}
                    />
                  ))}
                </div>
              );
            })}

            <div className="extra-points">
              <div className="extra-points-label">Extra Points</div>
              <div className="extra-points-teams">
                {game.teams.map((team, ti) => {
                  const pts = effectiveScores[`team${ti}`]?.extraPoints || 0;
                  return (
                    <div key={ti} className="extra-points-team">
                      <div className="extra-points-team-name">{team.name}</div>
                      <div className="extra-points-controls">
                        <button
                          className="score-btn minus"
                          onClick={() => handleExtraPointChange(ti, -1)}
                          disabled={pts === 0}
                          aria-label="Remove extra point"
                        >&minus;</button>
                        <div className="score-display">{pts}</div>
                        <button
                          className="score-btn plus"
                          onClick={() => handleExtraPointChange(ti, 1)}
                          aria-label="Add extra point"
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="gm-score-footer">
            <button className="gm-footer-back" onClick={goPrev} disabled={currentHole === 1 || saving}>
              Back
            </button>
            <button
              className="gm-footer-primary"
              onClick={currentHole >= 18 ? finishGame : goNext}
              disabled={saving}
            >
              {nextLabel}
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

  const watchUrl = `${window.location.origin}/game/${code}/watch`;
  const shareWatch = () => {
    if (navigator.share) {
      navigator.share({ title: `Join game ${code} — Live golf scores`, text: `Game code: ${code}`, url: watchUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(watchUrl);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      {game.status === 'lobby' && (
        <>
          <Header title="Game Lobby" showBack backTo="/" />
          <LobbyView game={game} gameCode={code} />
        </>
      )}

      {game.status === 'active' && course && (
        <HoleScoringView
          game={game}
          scores={scores}
          course={course}
          gameCode={code}
          onShare={shareWatch}
        />
      )}
    </div>
  );
}
