import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import Header from '../components/Header';
import PlayerAvatar from '../components/PlayerAvatar';
import { updateTournament, saveTournamentHoleScores } from '../firebase/tournamentService';
import { adjustTeamsForCourse, getStrokesOnHole } from '../utils/scoring';
import {
  getGrossPoints,
  getNetPoints,
  getTeamHolePoints,
  buildLeaderboards,
  MIN_CONTRIBUTION_HOLES,
} from '../utils/tournamentScoring';
import { ChevronLeftIcon, ChevronRightIcon, ShareIcon, TrophyIcon } from '../components/GolfIcon';

// ===== LOBBY =====
function LobbyView({ tournament, code }) {
  const [starting, setStarting] = useState(false);

  const startTournament = async () => {
    setStarting(true);
    try {
      await updateTournament(code, { status: 'active', currentHole: 1 });
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  const shareUrl = `${window.location.origin}/tournament/${code}`;

  return (
    <div className="page">
      <div className="game-code-display">
        <div className="game-code-label">Tournament Code</div>
        <div className="game-code-value">{code}</div>
        <div className="game-code-hint">{tournament.course.name}</div>
      </div>

      {tournament.teams.map((team) => (
        <div className="card mt-8" key={team.id}>
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
          onClick={startTournament}
          disabled={starting}
        >
          {starting ? 'Starting...' : 'Start Tournament'}
        </button>
      </div>

      <div className="card mt-12" style={{ textAlign: 'center' }}>
        <p className="section-title-sm">Share</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--grey-600)', marginBottom: 8 }}>
          Anyone with this link can enter scores for any team:
        </p>
        <div className="share-link">
          <span className="share-link-text">{shareUrl}</span>
          <button className="share-link-copy" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== SCORE INPUT ROW =====
function TournamentScoreInput({ player, hole, gross, onChange }) {
  const strokes = getStrokesOnHole(player.handicap, hole.strokeIndex);
  const grossPts = getGrossPoints(gross, hole);
  const netPts = getNetPoints(gross, player.handicap, hole);

  const decrement = () => {
    if (gross == null) onChange(hole.par + 2);
    else if (gross > 1) onChange(gross - 1);
  };
  const increment = () => {
    if (gross == null) onChange(hole.par);
    else onChange(gross + 1);
  };

  return (
    <div className="player-score-row">
      <div className="player-score-info" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <PlayerAvatar name={player.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="player-score-name">{player.name}</div>
          {strokes > 0 && (
            <div className="stroke-indicators-row">
              <div className="stroke-dots" title={`+${strokes} stroke${strokes > 1 ? 's' : ''} (Course HCP ${player.handicap})`}>
                {Array.from({ length: strokes }).map((_, i) => (
                  <div key={i} className="stroke-dot" />
                ))}
              </div>
            </div>
          )}
          {gross != null && (
            <div className="score-net-badge">
              Gross {grossPts}pt{grossPts !== 1 ? 's' : ''} · Net {netPts}pt{netPts !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="score-controls">
        <button className="score-btn minus" onClick={decrement} aria-label="Decrease score">−</button>
        <div className={`score-display${gross == null ? ' empty' : ''}`}>{gross != null ? gross : '—'}</div>
        <button className="score-btn plus" onClick={increment} aria-label="Increase score">+</button>
      </div>
    </div>
  );
}

// ===== HOLE SCORING =====
function HoleScoringView({ tournament, scores, course, code, onShare, onViewLeaderboard }) {
  const adjTeams = adjustTeamsForCourse(tournament.teams, course);
  const [selectedTeamId, setSelectedTeamId] = useState(adjTeams[0]?.id);
  const [currentHole, setCurrentHole] = useState(tournament.currentHole || 1);
  const [localScores, setLocalScores] = useState({});
  const [saving, setSaving] = useState(false);

  const hole = course.holes[currentHole - 1];
  const team = adjTeams.find(t => t.id === selectedTeamId) ?? adjTeams[0];
  const savedHoleScores = scores[String(currentHole)]?.[team.id] || {};
  const effectiveScores = { ...savedHoleScores, ...localScores };

  const handleScoreChange = useCallback((playerIdx, gross) => {
    setLocalScores(prev => ({ ...prev, [`player${playerIdx}gross`]: gross }));
  }, []);

  const saveCurrentHole = async () => {
    if (Object.keys(localScores).length === 0) return;
    setSaving(true);
    try {
      await saveTournamentHoleScores(code, currentHole, team.id, { ...savedHoleScores, ...localScores });
      setLocalScores({});
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const selectTeam = async (teamId) => {
    await saveCurrentHole();
    setSelectedTeamId(teamId);
  };

  const goToHole = async (holeNum) => {
    await saveCurrentHole();
    setCurrentHole(holeNum);
    await updateTournament(code, { currentHole: holeNum });
  };

  const goNext = () => { if (currentHole < 18) goToHole(currentHole + 1); };
  const goPrev = () => { if (currentHole > 1) goToHole(currentHole - 1); };

  const finishTournament = async () => {
    await saveCurrentHole();
    await updateTournament(code, { status: 'complete' });
  };

  // Completed holes for this team (both players have a gross entry)
  const completedHoles = course.holes.filter((h) => {
    const hs = scores[String(h.number)]?.[team.id];
    return hs && hs.player0gross != null && hs.player1gross != null;
  });

  const grossResult = getTeamHolePoints(effectiveScores, team.players, hole, 'gross');
  const netResult = getTeamHolePoints(effectiveScores, team.players, hole, 'net');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="game-share-bar">
        <div className="game-share-code">Code: <strong>{code}</strong></div>
        <button className="game-share-btn" onClick={onShare}>
          <ShareIcon size={14} color="var(--green-dark)" />
          Share
        </button>
      </div>

      <div className="tabs" style={{ margin: 0, padding: '0 16px' }}>
        <button className="tab-btn active">Score Entry</button>
        <button className="tab-btn" onClick={onViewLeaderboard}>Leaderboard</button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Team selector */}
        <div className="team-chip-row">
          {adjTeams.map((t) => (
            <button
              key={t.id}
              className={`team-chip${t.id === team.id ? ' active' : ''}`}
              onClick={() => t.id !== team.id && selectTeam(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>

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
        <div className="team-scoring-section">
          <div className="team-scoring-header">
            <span className="team-scoring-name">{team.name}</span>
            {(grossResult.points != null || netResult.points != null) && (
              <span className="team-best-net">
                {grossResult.points != null ? `Gross ${grossResult.points}pt` : ''}
                {netResult.points != null ? ` · Net ${netResult.points}pt` : ''}
              </span>
            )}
          </div>
          {team.players.map((player, pi) => (
            <TournamentScoreInput
              key={pi}
              player={player}
              hole={hole}
              gross={effectiveScores[`player${pi}gross`] ?? null}
              onChange={(val) => handleScoreChange(pi, val)}
            />
          ))}
        </div>

        <button className="btn btn-primary btn-full" onClick={saveCurrentHole} disabled={saving} style={{ marginBottom: 8 }}>
          {saving ? 'Saving...' : 'Save Scores'}
        </button>

        {currentHole === 18 && (
          <button className="btn btn-secondary btn-full" onClick={finishTournament} disabled={saving}>
            Finish Tournament
          </button>
        )}
      </div>

      <div className="hole-nav">
        <button className="btn btn-secondary btn-sm" onClick={goPrev} disabled={currentHole === 1} style={{ minWidth: 100 }}>
          <ChevronLeftIcon size={16} />
          Prev
        </button>
        <span style={{ fontSize: '0.875rem', color: 'var(--grey-600)', fontWeight: 600 }}>{currentHole} / 18</span>
        <button className="btn btn-primary btn-sm" onClick={currentHole === 18 ? finishTournament : goNext} style={{ minWidth: 100 }}>
          {currentHole === 18 ? 'Finish' : 'Next'}
          {currentHole !== 18 && <ChevronRightIcon size={16} />}
        </button>
      </div>
    </div>
  );
}

// ===== LEADERBOARD =====
const BOARD_TABS = [
  { key: 'playerGross', label: 'Player', sub: 'Gross' },
  { key: 'playerNet', label: 'Player', sub: '+ HCP' },
  { key: 'teamGross', label: 'Team', sub: 'Gross' },
  { key: 'teamNet', label: 'Team', sub: '+ HCP' },
];

function ContribRow({ team, contrib }) {
  return (
    <div className="contrib-player-row" style={{ padding: '2px 0' }}>
      {team.players.map((p, pi) => {
        const count = contrib[pi];
        const ok = count >= MIN_CONTRIBUTION_HOLES;
        return (
          <span
            key={pi}
            style={{
              fontSize: '0.7rem',
              marginRight: 10,
              color: ok ? 'var(--green-dark)' : 'var(--red)',
              fontWeight: 600,
            }}
          >
            {p.name}: {count}h{!ok ? ` (need ${MIN_CONTRIBUTION_HOLES})` : ''}
          </span>
        );
      })}
    </div>
  );
}

function LeaderboardView({ tournament, scores, course, onBackToScoring, showBackToScoring }) {
  const [activeBoard, setActiveBoard] = useState('playerGross');
  const adjTeams = adjustTeamsForCourse(tournament.teams, course);
  const boards = buildLeaderboards(adjTeams, scores, course.holes);
  const isTeamBoard = activeBoard.startsWith('team');
  const rows = boards[activeBoard];

  return (
    <div style={{ padding: '0 16px 24px', flex: 1, overflowY: 'auto' }}>
      <div className="tabs" style={{ margin: '12px 0 0' }}>
        {BOARD_TABS.map((b) => (
          <button
            key={b.key}
            className={`tab-btn${activeBoard === b.key ? ' active' : ''}`}
            onClick={() => setActiveBoard(b.key)}
            style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, padding: '8px 4px' }}
          >
            <span>{b.label}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{b.sub}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {rows.length === 0 && (
          <p style={{ color: 'var(--grey-500)', fontSize: '0.875rem', textAlign: 'center', padding: 24 }}>
            No teams yet.
          </p>
        )}

        {!isTeamBoard && rows.map((row, i) => (
          <div key={`${row.teamId}-${row.playerIndex}`} className="card mt-8" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--grey-500)', width: 24 }}>{i + 1}</div>
            <PlayerAvatar name={row.name} photoURL={row.photoURL} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{row.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}>{row.teamName} · HCP {row.handicap}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green-dark)' }}>
              {activeBoard === 'playerNet' ? row.netPoints : row.grossPoints}
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--grey-500)' }}> pts</span>
            </div>
          </div>
        ))}

        {isTeamBoard && rows.map((row, i) => (
          <div key={row.teamId} className="card mt-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--grey-500)', width: 24 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{row.teamName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}>
                  {row.players.map(p => p.name).join(' & ')} · {row.holesCounted}/18 holes
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green-dark)' }}>
                {activeBoard === 'teamNet' ? row.netPoints : row.grossPoints}
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--grey-500)' }}> pts</span>
              </div>
            </div>
            <ContribRow team={row} contrib={activeBoard === 'teamNet' ? row.netContrib : row.grossContrib} />
          </div>
        ))}
      </div>

      {showBackToScoring && (
        <button className="btn btn-secondary btn-full mt-16" onClick={onBackToScoring}>
          Back to Score Entry
        </button>
      )}
    </div>
  );
}

// ===== FINAL RESULTS BANNER =====
function ResultsBanner({ tournament, scores, course }) {
  const adjTeams = adjustTeamsForCourse(tournament.teams, course);
  const boards = buildLeaderboards(adjTeams, scores, course.holes);

  const winners = [
    { label: 'Best Player (Gross)', row: boards.playerGross[0], points: boards.playerGross[0]?.grossPoints },
    { label: 'Best Player (+ HCP)', row: boards.playerNet[0], points: boards.playerNet[0]?.netPoints },
    { label: 'Best Team (Gross)', row: boards.teamGross[0], points: boards.teamGross[0]?.grossPoints, isTeam: true },
    { label: 'Best Team (+ HCP)', row: boards.teamNet[0], points: boards.teamNet[0]?.netPoints, isTeam: true },
  ];

  return (
    <div className="page">
      <div className="results-banner">
        <div className="results-trophy"><TrophyIcon size={56} color="rgba(255,255,255,0.9)" /></div>
        <div className="results-winner">Tournament Complete</div>
        <div className="results-subtitle">{tournament.course.name}</div>
      </div>

      {winners.map((w) => w.row && (
        <div className="card mt-8" key={w.label}>
          <p className="section-title-sm">{w.label}</p>
          <div className="confirm-row">
            <span className="confirm-value" style={{ fontWeight: 700 }}>
              {w.isTeam ? w.row.teamName : w.row.name}
            </span>
            <span className="confirm-value" style={{ color: 'var(--green-dark)', fontWeight: 700 }}>
              {w.points} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN TOURNAMENT VIEW =====
export default function TournamentView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { tournament, scores, course, loading, error } = useTournament(code);
  const [activeTab, setActiveTab] = useState('score');

  if (loading) {
    return (
      <div className="app-container">
        <Header title="Loading..." showBack backTo="/" />
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading tournament...</span>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="app-container">
        <Header title="Error" showBack backTo="/" />
        <div className="error-screen">
          <h2>Tournament Not Found</h2>
          <p>{error || 'This tournament does not exist or has been deleted.'}</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const title = tournament.status === 'lobby'
    ? 'Tournament Lobby'
    : tournament.status === 'complete'
      ? 'Final Results'
      : course
        ? `Hole ${tournament.currentHole} — ${course.name.split(' ')[0]}`
        : 'Scoring';

  const watchUrl = `${window.location.origin}/tournament/${code}`;
  const shareTournament = () => {
    if (navigator.share) {
      navigator.share({ title: `Tournament ${code}`, text: `Tournament code: ${code}`, url: watchUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(watchUrl);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header title={title} showBack backTo="/" />

      {tournament.status === 'lobby' && <LobbyView tournament={tournament} code={code} />}

      {tournament.status === 'active' && course && activeTab === 'score' && (
        <HoleScoringView
          tournament={tournament}
          scores={scores}
          course={course}
          code={code}
          onShare={shareTournament}
          onViewLeaderboard={() => setActiveTab('leaderboard')}
        />
      )}

      {tournament.status === 'active' && course && activeTab === 'leaderboard' && (
        <>
          <div className="game-share-bar">
            <div className="game-share-code">Code: <strong>{code}</strong></div>
          </div>
          <LeaderboardView
            tournament={tournament}
            scores={scores}
            course={course}
            showBackToScoring
            onBackToScoring={() => setActiveTab('score')}
          />
        </>
      )}

      {tournament.status === 'complete' && course && (
        <>
          <ResultsBanner tournament={tournament} scores={scores} course={course} />
          <LeaderboardView tournament={tournament} scores={scores} course={course} showBackToScoring={false} />
        </>
      )}
    </div>
  );
}
