import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Stepper from '../components/Stepper';
import { ALL_COURSES } from '../data/courses';
import { loadPublicCourses } from '../firebase/courseService';
import { createTournament } from '../firebase/tournamentService';
import { getCourseHandicap } from '../utils/scoring';
import { MIN_CONTRIBUTION_HOLES } from '../utils/tournamentScoring';
import { ShareIcon, CloseIcon, SearchIcon, PlusIcon } from '../components/GolfIcon';
import { useAuth } from '../contexts/AuthContext';

// ========== STEP 1: Course Selection ==========
function StepCourse({ selected, onSelect, onNext }) {
  const [search, setSearch] = useState('');
  const [customCourses, setCustomCourses] = useState([]);

  useEffect(() => {
    loadPublicCourses().then(setCustomCourses);
  }, []);

  const allCourses = [...ALL_COURSES, ...customCourses];
  const filtered = search.trim()
    ? allCourses.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase())
      )
    : allCourses;

  return (
    <>
      <div className="page" style={{ paddingBottom: 0 }}>
        <p className="section-title-sm">Select Course</p>

        <div className="course-search-wrap">
          <SearchIcon size={16} color="var(--grey-500)" />
          <input
            className="course-search-input"
            placeholder="Search courses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="course-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              <CloseIcon size={14} color="var(--grey-500)" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <p style={{ color: 'var(--grey-500)', fontSize: '0.9rem', padding: '8px 0' }}>
              No courses found. Try a different search.
            </p>
          )}
          {filtered.map((course) => (
            <button
              key={course.id}
              className={`course-card${selected?.id === course.id ? ' selected' : ''}`}
              onClick={() => onSelect(course)}
            >
              <div className="course-card-name">
                {course.name}
                {course.isCustom && <span className="course-custom-badge">Custom</span>}
              </div>
              <div className="course-card-location">{course.location}</div>
              <div className="course-card-stats">
                <span className="course-stat">Par <span>{course.par}</span></span>
                <span className="course-stat"><span>{course.holes.length}</span> holes</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="sticky-action-bar">
        <button className="btn btn-primary btn-full" onClick={onNext} disabled={!selected}>
          Continue
        </button>
      </div>
    </>
  );
}

// ========== STEP 2: Teams ==========
function makePlayer() {
  return { name: '', handicap: '' };
}

function makeTeam(num) {
  return { name: `Team ${num}`, players: [makePlayer(), makePlayer()] };
}

function StepTeams({ teams, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const updateTeamName = (ti, val) => {
    onChange(teams.map((t, i) => (i === ti ? { ...t, name: val } : t)));
  };

  const updatePlayer = (ti, pi, field, val) => {
    onChange(teams.map((t, i) => {
      if (i !== ti) return t;
      return { ...t, players: t.players.map((p, j) => (j === pi ? { ...p, [field]: val } : p)) };
    }));
  };

  const addTeam = () => onChange([...teams, makeTeam(teams.length + 1)]);
  const removeTeam = (ti) => onChange(teams.filter((_, i) => i !== ti));

  const validate = () => {
    const errs = {};
    if (teams.length < 1) errs.general = 'Add at least one team';
    teams.forEach((team, ti) => {
      if (!team.name.trim()) errs[`team${ti}name`] = 'Required';
      team.players.forEach((p, pi) => {
        if (!p.name.trim()) errs[`t${ti}p${pi}name`] = 'Required';
        const hcp = parseFloat(p.handicap);
        if (isNaN(hcp) || hcp < 0 || hcp > 54) errs[`t${ti}p${pi}hcp`] = '0–54';
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="page">
      <p className="section-title-sm">Fourball Teams</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginTop: -8, marginBottom: 16 }}>
        Each team is two players. Best score per hole counts for the team — each
        player must contribute on at least {MIN_CONTRIBUTION_HOLES} holes.
      </p>

      {errors.general && <p className="form-error mb-12">{errors.general}</p>}

      <div className="team-setup">
        {teams.map((team, ti) => (
          <div key={ti} className="team-block">
            <div className="team-block-header">
              <span className="team-block-title">Team {ti + 1}</span>
              {teams.length > 1 && (
                <button className="remove-player-btn" onClick={() => removeTeam(ti)} aria-label="Remove team">
                  <CloseIcon size={18} color="currentColor" />
                </button>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Team Name</label>
              <input
                className={`form-input form-input-sm${errors[`team${ti}name`] ? ' error' : ''}`}
                value={team.name}
                onChange={(e) => updateTeamName(ti, e.target.value)}
                placeholder={`Team ${ti + 1}`}
                maxLength={30}
              />
              {errors[`team${ti}name`] && <p className="form-error">{errors[`team${ti}name`]}</p>}
            </div>

            {team.players.map((player, pi) => (
              <div key={pi} className="player-row">
                <div className="player-row-inner">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Player {pi + 1} Name</label>
                    <input
                      className={`form-input form-input-sm${errors[`t${ti}p${pi}name`] ? ' error' : ''}`}
                      value={player.name}
                      onChange={(e) => updatePlayer(ti, pi, 'name', e.target.value)}
                      placeholder="Name"
                      maxLength={30}
                    />
                    {errors[`t${ti}p${pi}name`] && <p className="form-error">{errors[`t${ti}p${pi}name`]}</p>}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">HCP Index</label>
                    <input
                      className={`form-input form-input-sm${errors[`t${ti}p${pi}hcp`] ? ' error' : ''}`}
                      value={player.handicap}
                      onChange={(e) => updatePlayer(ti, pi, 'handicap', e.target.value)}
                      placeholder="0.0"
                      type="number"
                      min="0"
                      max="54"
                      step="0.1"
                      inputMode="decimal"
                    />
                    {errors[`t${ti}p${pi}hcp`] && <p className="form-error">{errors[`t${ti}p${pi}hcp`]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="add-course-link" onClick={addTeam} style={{ marginTop: 4, marginBottom: 8 }}>
        <PlusIcon size={16} color="var(--green-dark)" />
        Add another team
      </button>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack}>Back</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>Continue</button>
      </div>
    </div>
  );
}

// ========== STEP 3: Confirm ==========
function StepConfirm({ course, teams, onConfirm, onBack, loading }) {
  return (
    <div className="page">
      <div className="card">
        <p className="section-title-sm">Course</p>
        <div className="confirm-row">
          <span className="confirm-label">Course</span>
          <span className="confirm-value">{course.name}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">Par</span>
          <span className="confirm-value">{course.par}</span>
        </div>
      </div>

      {teams.map((team, ti) => (
        <div className="card" key={ti}>
          <p className="section-title-sm">{team.name}</p>
          {team.players.map((p, pi) => (
            <div className="confirm-row" key={pi}>
              <span className="confirm-label">{p.name}</span>
              <span className="confirm-value">
                Index {p.handicap} → Course HCP {getCourseHandicap(parseFloat(p.handicap), course.slopeRating, course.courseRating, course.par)}
              </span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack} disabled={loading}>Back</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={onConfirm} disabled={loading}>
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
      </div>
    </div>
  );
}

// ========== STEP 4: Share ==========
function StepShare({ tournamentCode, onStart }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/tournament/${tournamentCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join the tournament', text: `Tournament code: ${tournamentCode}`, url: shareUrl });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="page">
      <div className="game-code-display">
        <div className="game-code-label">Tournament Code</div>
        <div className="game-code-value">{tournamentCode}</div>
        <div className="game-code-hint">Share this code with all players</div>
      </div>

      <div className="card">
        <p className="section-title-sm">Share Link</p>
        <div className="share-link">
          <span className="share-link-text">{shareUrl}</span>
          <button className="share-link-copy" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={share}>
          <ShareIcon size={16} color="var(--green-dark)" />
          Share
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-primary btn-full"
          style={{ minHeight: 60, fontSize: '1.1rem' }}
          onClick={() => onStart(tournamentCode)}
        >
          Go to Tournament
        </button>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function CreateTournament() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState(null);
  const [teams, setTeams] = useState([makeTeam(1), makeTeam(2)]);
  const [tournamentCode, setTournamentCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalizedTeams = teams.map((team, ti) => ({
        id: `team-${ti}-${Math.random().toString(36).slice(2, 8)}`,
        name: team.name.trim(),
        players: team.players.map((p) => ({
          name: p.name.trim(),
          handicap: parseFloat(p.handicap),
        })),
      }));
      const { code } = await createTournament({
        course,
        teams: normalizedTeams,
        userId: user?.uid ?? null,
      });
      setTournamentCode(code);
      setStep(4);
    } catch (err) {
      setError('Failed to create tournament. Check your Firebase config.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header title="New Tournament" showBack backTo="/" />
      <Stepper currentStep={step} />

      {error && (
        <div style={{
          background: 'var(--red-light)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          margin: '0 16px',
          color: 'var(--red)',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <StepCourse selected={course} onSelect={setCourse} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepTeams teams={teams} onChange={setTeams} onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepConfirm course={course} teams={teams} onConfirm={handleConfirm} onBack={() => setStep(2)} loading={loading} />
      )}
      {step === 4 && (
        <StepShare tournamentCode={tournamentCode} onStart={(code) => navigate(`/tournament/${code}`)} />
      )}
    </div>
  );
}
