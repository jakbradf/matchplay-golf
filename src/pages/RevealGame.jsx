import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { computeMatchScore, getMatchStatus, adjustTeamsForCourse } from '../utils/scoring';
import { TrophyIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../components/GolfIcon';

// Presentation mode for the banquet: step through the standings thru the
// last four holes, one per slide, ending with the actual winner revealed.
export default function RevealGame() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { game, scores, course, loading, error } = useGame(code);
  const [slideIndex, setSlideIndex] = useState(0);

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

  if (error || !game || !course) {
    return (
      <div className="reveal-screen reveal-loading">
        <p>Game not found.</p>
        <button className="btn btn-secondary mt-16" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const adjTeams = adjustTeamsForCourse(game.teams, course);
  const holesThru = course.holes.slice(0, slideThrus[slideIndex]);
  const [t0, t1] = computeMatchScore(scores, adjTeams, holesThru);
  const status = getMatchStatus([t0, t1], [game.teams[0].name, game.teams[1].name]);
  const isAllSquare = status === 'ALL SQUARE';
  const winnerIdx = t0 > t1 ? 0 : t1 > t0 ? 1 : null;
  const isFinal = slideIndex === lastIndex;

  return (
    <div className={`reveal-screen${isFinal ? ' reveal-final' : ''}`}>
      <button className="reveal-close" onClick={() => navigate(`/game/${code}/results`)} aria-label="Close presentation">
        <CloseIcon size={20} color="rgba(255,255,255,0.7)" />
      </button>

      <div className="reveal-dots" aria-hidden="true">
        {slideThrus.map((n, i) => (
          <span key={n} className={`reveal-dot${i === slideIndex ? ' active' : ''}`} />
        ))}
      </div>

      <div className="reveal-body">
        <div className="reveal-kicker">{game.course.name}</div>

        {!isFinal && (
          <>
            <div className="reveal-thru">Thru {slideThrus[slideIndex]}</div>
            <div className="reveal-teams">
              <div className={`reveal-team${winnerIdx === 0 ? ' leading' : ''}`}>
                <div className="reveal-team-name">{game.teams[0].name}</div>
                <div className="reveal-team-pts">{t0}</div>
              </div>
              <div className="reveal-vs">PTS</div>
              <div className={`reveal-team${winnerIdx === 1 ? ' leading' : ''}`}>
                <div className="reveal-team-name">{game.teams[1].name}</div>
                <div className="reveal-team-pts">{t1}</div>
              </div>
            </div>
            <div className="reveal-status">{status}</div>
          </>
        )}

        {isFinal && (
          <>
            <div className="reveal-thru">Final &mdash; Thru {slideThrus[slideIndex]}</div>
            <TrophyIcon size={72} color="var(--gold)" />
            {isAllSquare ? (
              <>
                <div className="reveal-winner-name">It&rsquo;s a tie!</div>
                <div className="reveal-status">All Square</div>
              </>
            ) : (
              <>
                <div className="reveal-winner-label">Winner</div>
                <div className="reveal-winner-name">{game.teams[winnerIdx].name}</div>
                <div className="reveal-status">{status}</div>
              </>
            )}
            <div className="reveal-final-pts">
              <span>{t0} pts</span>
              <span className="reveal-vs">&mdash;</span>
              <span>{t1} pts</span>
            </div>
          </>
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
