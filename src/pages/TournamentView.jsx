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
  buildLeaderboards,
  getTournamentPlayerHoleGrid,
} from '../utils/tournamentScoring';
import { ChevronLeftIcon, ChevronRightIcon, ShareIcon, TrophyIcon, CloseIcon } from '../components/GolfIcon';

// ===== FINISH PIN CONFIRMATION =====
function FinishPinModal({ correctPin, onConfirm, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const submit = async () => {
    if (pin !== correctPin) {
      setError('Incorrect PIN');
      return;
    }
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <span>Finish Tournament</span>
          <button className="picker-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} color="var(--grey-600)" />
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--grey-600)', marginBottom: 16 }}>
          This ends the tournament for everyone. Enter the finish PIN to confirm.
        </p>
        <input
          className={`form-input${error ? ' error' : ''}`}
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="PIN"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' }}
        />
        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}
        <button
          className="btn btn-primary btn-full mt-12"
          onClick={submit}
          disabled={pin.length !== 4 || confirming}
        >
          {confirming ? 'Finishing…' : 'Finish Tournament'}
        </button>
      </div>
    </div>
  );
}

// ===== LOBBY =====
function LobbyView({ tournament, code, isOrganizer }) {
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

      {isOrganizer ? (
        <>
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
            <p className="section-title-sm">Organizer Link</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--grey-600)', marginBottom: 8 }}>
              This link can score for any team. Send each team their own link instead
              (from the tournament creation screen) so they can only edit their own score.
            </p>
            <div className="share-link">
              <span className="share-link-text">{shareUrl}</span>
              <button className="share-link-copy" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                Copy
              </button>
            </div>
          </div>

          {tournament.endPin && (
            <div className="card mt-12" style={{ textAlign: 'center' }}>
              <p className="section-title-sm">Finish PIN</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--grey-600)', marginBottom: 8 }}>
                You'll need this to end the tournament later.
              </p>
              <div className="game-code-value" style={{ fontSize: '1.75rem' }}>{tournament.endPin}</div>
            </div>
          )}
        </>
      ) : (
        <div className="card mt-12" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--grey-600)' }}>
            Waiting for the organizer to start the tournament…
          </p>
        </div>
      )}
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
        <PlayerAvatar name={player.name} photoURL={player.photoURL} size={36} />
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
function HoleScoringView({ tournament, scores, course, code, lockedTeamId, isOrganizer }) {
  const adjTeams = adjustTeamsForCourse(tournament.teams, course);
  const [selectedTeamId, setSelectedTeamId] = useState(lockedTeamId ?? adjTeams[0]?.id);
  const [currentHole, setCurrentHole] = useState(tournament.currentHole || 1);
  const [localScores, setLocalScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

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

  const requestFinish = () => {
    if (tournament.endPin) setShowFinishModal(true);
    else finishTournament();
  };

  // Completed holes for this team (every player has a gross entry)
  const completedHoles = course.holes.filter((h) => {
    const hs = scores[String(h.number)]?.[team.id];
    return hs && team.players.every((_, pi) => hs[`player${pi}gross`] != null);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: '16px 16px 0' }}>
        {/* Team selector — hidden when this link is locked to one team */}
        {!lockedTeamId && (
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
        )}

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

        {currentHole === 18 && isOrganizer && (
          <button className="btn btn-secondary btn-full" onClick={requestFinish} disabled={saving}>
            Finish Tournament
          </button>
        )}
        {currentHole === 18 && !isOrganizer && (
          <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', textAlign: 'center' }}>
            Ask the organizer to finish the tournament once every team is done.
          </p>
        )}
      </div>

      <div className="hole-nav">
        <button className="btn btn-secondary btn-sm" onClick={goPrev} disabled={currentHole === 1} style={{ minWidth: 100 }}>
          <ChevronLeftIcon size={16} />
          Prev
        </button>
        <span style={{ fontSize: '0.875rem', color: 'var(--grey-600)', fontWeight: 600 }}>{currentHole} / 18</span>
        {currentHole === 18 ? (
          <button className="btn btn-primary btn-sm" onClick={requestFinish} disabled={saving || !isOrganizer} style={{ minWidth: 100 }}>
            Finish
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={goNext} style={{ minWidth: 100 }}>
            Next
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>

      {showFinishModal && (
        <FinishPinModal
          correctPin={tournament.endPin}
          onConfirm={async () => { await finishTournament(); setShowFinishModal(false); }}
          onClose={() => setShowFinishModal(false)}
        />
      )}
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

function scoreCellStyle(diff) {
  if (diff == null) return { background: 'transparent', color: '#b9c6bd' };
  if (diff < 0) return { background: '#0a8f4d', color: '#ffffff' };
  if (diff === 1) return { background: '#10429b', color: '#ffffff' };
  if (diff > 1) return { background: '#c8332c', color: '#ffffff' };
  return { background: 'transparent', color: '#0e1a13' };
}

function TournamentHalfGrid({ half, label }) {
  return (
    <div className="gm-lb-half">
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">{label}</div>
        {half.holeNumbers.map((n) => <div key={n} className="gm-lb-grid-num">{n}</div>)}
        <div className="gm-lb-grid-total strong">Tot</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">par</div>
        {half.pars.map((p, i) => <div key={i} className="gm-lb-grid-num">{p}</div>)}
        <div className="gm-lb-grid-total">{half.totalPar}</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">score</div>
        {half.cells.map((c, i) => (
          <div key={i} className={`gm-lb-cell${c.gross == null ? ' empty' : ''}`} style={scoreCellStyle(c.diff)}>
            {c.gross ?? ''}
          </div>
        ))}
        <div className="gm-lb-grid-total strong">{half.anyScored ? half.totalGross : ''}</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">gross pt</div>
        {half.cells.map((c, i) => <div key={i} className="gm-lb-grid-num">{c.grossPts ?? ''}</div>)}
        <div className="gm-lb-grid-total">{half.anyScored ? half.totalGrossPts : ''}</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">net pt</div>
        {half.cells.map((c, i) => <div key={i} className="gm-lb-grid-num">{c.netPts ?? ''}</div>)}
        <div className="gm-lb-grid-total">{half.anyScored ? half.totalNetPts : ''}</div>
      </div>
    </div>
  );
}

function PlayerScorecard({ scores, team, playerIndex, courseHoles }) {
  const grid = getTournamentPlayerHoleGrid(scores, team, playerIndex, courseHoles);
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--grey-200)' }}>
      <TournamentHalfGrid half={grid.out} label="Out" />
      <TournamentHalfGrid half={grid.in} label="In" />
    </div>
  );
}

// Team points are an average across players and can come out fractional.
function fmtPoints(v) {
  return Number.isInteger(v) ? v : v.toFixed(1);
}

// Non-organizer viewers only see standings through this hole, so the final
// score stays a surprise until the organizer reveals it after the event.
const LEADERBOARD_HOLE_CAP = 15;

function LeaderboardView({ tournament, scores, course, onBackToScoring, showBackToScoring, isOrganizer }) {
  const [activeBoard, setActiveBoard] = useState('playerGross');
  const [openKey, setOpenKey] = useState(null);
  const visibleHoles = isOrganizer ? course.holes : course.holes.slice(0, LEADERBOARD_HOLE_CAP);
  const adjTeams = adjustTeamsForCourse(tournament.teams, course);
  const boards = buildLeaderboards(adjTeams, scores, visibleHoles);
  const isTeamBoard = activeBoard.startsWith('team');
  const rows = boards[activeBoard];

  return (
    <div style={{ padding: '0 16px 24px', flex: 1, overflowY: 'auto' }}>
      {!isOrganizer && (
        <p style={{ fontSize: '0.78rem', color: 'var(--grey-500)', textAlign: 'center', margin: '12px 0 0' }}>
          Standings shown through hole {LEADERBOARD_HOLE_CAP} — the final holes are revealed after the event.
        </p>
      )}

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

        {!isTeamBoard && rows.map((row, i) => {
          const key = `${row.teamId}-${row.playerIndex}`;
          const open = openKey === key;
          const team = adjTeams.find((t) => t.id === row.teamId);
          return (
            <div key={key} className="card mt-8">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => setOpenKey(open ? null : key)}
              >
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--grey-500)', width: 24 }}>{i + 1}</div>
                <PlayerAvatar name={row.name} photoURL={row.photoURL} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{row.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}>
                    {row.teamName} · HCP {row.handicap} · thru {row.holesPlayed}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green-dark)' }}>
                  {activeBoard === 'playerNet' ? row.netPoints : row.grossPoints}
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--grey-500)' }}> pts</span>
                </div>
                <span style={{ display: 'flex', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none' }}>
                  <ChevronRightIcon size={16} color="var(--grey-400)" />
                </span>
              </div>

              {open && team && (
                <PlayerScorecard scores={scores} team={team} playerIndex={row.playerIndex} courseHoles={visibleHoles} />
              )}
            </div>
          );
        })}

        {isTeamBoard && rows.map((row, i) => (
          <div key={row.teamId} className="card mt-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--grey-500)', width: 24 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{row.teamName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}>
                  {row.players.map(p => p.name).join(' & ')} · {row.holesCounted}/{visibleHoles.length} holes
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green-dark)' }}>
                {fmtPoints(activeBoard === 'teamNet' ? row.netPoints : row.grossPoints)}
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--grey-500)' }}> avg pts</span>
              </div>
            </div>
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
              {fmtPoints(w.points)}{w.isTeam ? ' avg' : ''} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN TOURNAMENT VIEW =====
export default function TournamentView() {
  const { code, teamId, token } = useParams();
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

  // A URL with /team/:teamId/:token locks scoring to that one team.
  // Anything else (the plain /tournament/:code link) is the organizer view.
  const isOrganizer = !teamId;
  const lockedTeam = teamId ? tournament.teams.find(t => t.id === teamId) : null;

  if (teamId && (!lockedTeam || lockedTeam.editToken !== token)) {
    return (
      <div className="app-container">
        <Header title="Invalid Link" showBack backTo="/" />
        <div className="error-screen">
          <h2>Invalid Team Link</h2>
          <p>This scoring link doesn't match a team in this tournament. Ask the organizer to resend it.</p>
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

  const shareUrl = isOrganizer
    ? `${window.location.origin}/tournament/${code}`
    : `${window.location.origin}/tournament/${code}/team/${lockedTeam.id}/${lockedTeam.editToken}`;
  const shareTournament = () => {
    const shareText = isOrganizer ? `Tournament code: ${code}` : `${lockedTeam.name}'s scoring link`;
    if (navigator.share) {
      navigator.share({ title: `Tournament ${code}`, text: shareText, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareUrl);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header title={title} showBack backTo="/" />

      {tournament.status === 'lobby' && <LobbyView tournament={tournament} code={code} isOrganizer={isOrganizer} />}

      {tournament.status === 'active' && course && (
        <>
          <div className="game-share-bar">
            <div className="game-share-code">Code: <strong>{code}</strong></div>
            <button className="game-share-btn" onClick={shareTournament}>
              <ShareIcon size={14} color="var(--green-dark)" />
              Share
            </button>
          </div>

          <div className="tabs" style={{ margin: 0, padding: '0 16px' }}>
            <button
              className={`tab-btn${activeTab === 'score' ? ' active' : ''}`}
              onClick={() => setActiveTab('score')}
            >
              Score Entry
            </button>
            <button
              className={`tab-btn${activeTab === 'leaderboard' ? ' active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Leaderboard
            </button>
          </div>

          {activeTab === 'score' && (
            <HoleScoringView
              tournament={tournament}
              scores={scores}
              course={course}
              code={code}
              lockedTeamId={lockedTeam?.id ?? null}
              isOrganizer={isOrganizer}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              tournament={tournament}
              scores={scores}
              course={course}
              showBackToScoring={false}
              isOrganizer={isOrganizer}
            />
          )}
        </>
      )}

      {tournament.status === 'complete' && course && (
        <>
          <ResultsBanner tournament={tournament} scores={scores} course={course} />
          <LeaderboardView tournament={tournament} scores={scores} course={course} showBackToScoring={false} isOrganizer={true} />
        </>
      )}
    </div>
  );
}
