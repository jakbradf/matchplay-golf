import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { buildLeaderboards } from '../utils/tournamentScoring';
import { adjustTeamsForCourse } from '../utils/scoring';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../components/GolfIcon';

// Presentation mode for the banquet: step through the tournament standings
// thru the last four holes, one slide per hole, for each of the three award
// categories — ending with the actual winners revealed.
const BOARD_TABS = [
  { key: 'playerNet', label: 'Players' },
  { key: 'teamNet', label: 'Teams' },
  { key: 'playerGross', label: 'TIGER' },
];

function fmtPoints(v) {
  return Number.isInteger(v) ? v : v.toFixed(1);
}

function pointsFor(boardKey, row) {
  return boardKey === 'playerGross' ? row.grossPoints : row.netPoints;
}

function nameFor(boardKey, row) {
  return boardKey === 'teamNet' ? row.teamName : row.name;
}

function subFor(boardKey, row) {
  if (boardKey === 'teamNet') return row.players.map((p) => p.name).join(' & ');
  return row.teamName;
}

// What a player shot on one specific hole, for the "just revealed" drama.
function holeShotLabel(gross, par) {
  if (gross == null) return 'No card';
  if (gross === 1) return 'Hole in one!';
  const diff = gross - par;
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  return `+${diff}`;
}

function holeShotColor(gross, par) {
  if (gross == null) return 'rgba(255, 255, 255, 0.4)';
  const diff = gross - par;
  if (diff <= -1) return 'var(--gold)';
  if (diff === 0) return 'rgba(255, 255, 255, 0.85)';
  return '#ff9d8e';
}

function grossFor(scores, holeNumber, teamId, playerIndex) {
  return scores[String(holeNumber)]?.[teamId]?.[`player${playerIndex}gross`] ?? null;
}

export default function TournamentReveal() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { tournament, scores, course, loading, error } = useTournament(code);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeBoard, setActiveBoard] = useState('playerNet');

  const totalHoles = course?.holes?.length || 18;
  const slideThrus = [totalHoles - 3, totalHoles - 2, totalHoles - 1, totalHoles];
  const lastIndex = slideThrus.length - 1;

  const goNext = useCallback(() => setSlideIndex((i) => Math.min(i + 1, lastIndex)), [lastIndex]);
  const goPrev = useCallback(() => setSlideIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  if (loading) {
    return <div className="reveal-screen reveal-loading">Loading…</div>;
  }

  if (error || !tournament || !course) {
    return (
      <div className="reveal-screen reveal-loading">
        <p>Tournament not found.</p>
        <button className="btn btn-secondary mt-16" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const adjTeams = adjustTeamsForCourse(tournament.teams, course);
  const holesThru = course.holes.slice(0, slideThrus[slideIndex]);
  const boards = buildLeaderboards(adjTeams, scores, holesThru);
  const isFinal = slideIndex === lastIndex;
  const tab = BOARD_TABS.find((b) => b.key === activeBoard);
  const rows = (boards[activeBoard] || []).slice(0, 3);

  // Slide 0 is the known "thru 15" baseline everyone already saw live — from
  // slide 1 on, each slide reveals exactly one previously-hidden hole, so
  // show what actually happened on it rather than just the running total.
  const revealedHoleNum = slideIndex > 0 ? slideThrus[slideIndex] : null;
  const revealedHole = revealedHoleNum ? course.holes[revealedHoleNum - 1] : null;

  return (
    <div className={`reveal-screen${isFinal ? ' reveal-final' : ''}`}>
      <button className="reveal-close" onClick={() => navigate(`/tournament/${code}`)} aria-label="Close presentation">
        <CloseIcon size={20} color="rgba(255,255,255,0.7)" />
      </button>

      <div className="reveal-dots" aria-hidden="true">
        {slideThrus.map((n, i) => (
          <span key={n} className={`reveal-dot${i === slideIndex ? ' active' : ''}`} />
        ))}
      </div>

      <div className="reveal-body reveal-body-wide">
        <div className="reveal-kicker">{tournament.course.name}</div>
        <div className="reveal-thru">{isFinal ? `Final — Thru ${slideThrus[slideIndex]}` : `Thru ${slideThrus[slideIndex]}`}</div>
        {revealedHole && (
          <div className="reveal-hole-caption">Hole {revealedHoleNum} &middot; Par {revealedHole.par}</div>
        )}

        <div className="reveal-board-tabs">
          {BOARD_TABS.map((b) => (
            <button
              key={b.key}
              className={`reveal-board-tab${activeBoard === b.key ? ' active' : ''}`}
              onClick={() => setActiveBoard(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="reveal-rank-list">
          {rows.length === 0 && <p className="reveal-empty">No scores yet.</p>}
          {rows.map((row, i) => {
            const isTeamRow = activeBoard === 'teamNet';
            return (
              <div key={`${row.teamId}-${row.playerIndex ?? 'team'}`} className={`reveal-rank-row${i === 0 ? ' leader' : ''}`}>
                <span className="reveal-rank-num">{i + 1}</span>
                <div className="reveal-rank-info">
                  <span className="reveal-rank-name">{nameFor(activeBoard, row)}</span>
                  {!revealedHole && <span className="reveal-rank-sub">{subFor(activeBoard, row)}</span>}
                  {revealedHole && !isTeamRow && (() => {
                    const gross = grossFor(scores, revealedHoleNum, row.teamId, row.playerIndex);
                    return (
                      <span className="reveal-rank-shot" style={{ color: holeShotColor(gross, revealedHole.par) }}>
                        {holeShotLabel(gross, revealedHole.par)}{gross != null ? ` (${gross})` : ''}
                      </span>
                    );
                  })()}
                  {revealedHole && isTeamRow && (
                    <span className="reveal-rank-shot reveal-rank-shot-team">
                      {row.players.map((p, pi) => {
                        const gross = grossFor(scores, revealedHoleNum, row.teamId, pi);
                        return (
                          <span key={pi} style={{ color: holeShotColor(gross, revealedHole.par) }}>
                            {p.name.split(' ')[0]}: {holeShotLabel(gross, revealedHole.par)}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </div>
                <span className="reveal-rank-pts">{fmtPoints(pointsFor(activeBoard, row))}</span>
              </div>
            );
          })}
        </div>

        {isFinal && rows[0] && (
          <div className="reveal-winner-label">&#127942; {tab.label} winner</div>
        )}
      </div>

      <div className="reveal-nav">
        <button className="reveal-nav-btn" onClick={goPrev} disabled={slideIndex === 0} aria-label="Previous slide">
          <ChevronLeftIcon size={22} color={slideIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
        </button>
        <span className="reveal-nav-label">{slideIndex + 1} / {slideThrus.length}</span>
        <button className="reveal-nav-btn" onClick={goNext} disabled={isFinal} aria-label="Next slide">
          <ChevronRightIcon size={22} color={isFinal ? 'rgba(255,255,255,0.3)' : '#fff'} />
        </button>
      </div>
    </div>
  );
}
