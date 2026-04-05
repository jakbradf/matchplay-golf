import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Stepper from '../components/Stepper';
import { ALL_COURSES } from '../data/courses';
import { createGame } from '../firebase/gameService';
import { ShareIcon, CloseIcon } from '../components/GolfIcon';

// ========== STEP 1: Course Selection ==========
function StepCourse({ selected, onSelect, onNext }) {
  return (
    <div className="page">
      <p className="section-title-sm">Select Course</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ALL_COURSES.map((course) => (
          <button
            key={course.id}
            className={`course-card${selected?.id === course.id ? ' selected' : ''}`}
            onClick={() => onSelect(course)}
          >
            <div className="course-card-name">{course.name}</div>
            <div className="course-card-location">{course.location}</div>
            <div className="course-card-stats">
              <span className="course-stat">Par <span>{course.par}</span></span>
              <span className="course-stat"><span>{course.holes.length}</span> holes</span>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          className="btn btn-primary btn-full"
          onClick={onNext}
          disabled={!selected}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ========== STEP 2: Team Setup ==========
function makePlayer() {
  return { name: '', handicap: '' };
}

function makeTeam(num) {
  return { name: `Team ${num}`, players: [makePlayer()] };
}

function StepTeams({ teams, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const updateTeamName = (ti, val) => {
    const updated = teams.map((t, i) => (i === ti ? { ...t, name: val } : t));
    onChange(updated);
  };

  const updatePlayer = (ti, pi, field, val) => {
    const updated = teams.map((t, i) => {
      if (i !== ti) return t;
      const players = t.players.map((p, j) =>
        j === pi ? { ...p, [field]: val } : p
      );
      return { ...t, players };
    });
    onChange(updated);
  };

  const addPlayer = (ti) => {
    const updated = teams.map((t, i) => {
      if (i !== ti || t.players.length >= 2) return t;
      return { ...t, players: [...t.players, makePlayer()] };
    });
    onChange(updated);
  };

  const removePlayer = (ti, pi) => {
    const updated = teams.map((t, i) => {
      if (i !== ti) return t;
      return { ...t, players: t.players.filter((_, j) => j !== pi) };
    });
    onChange(updated);
  };

  const validate = () => {
    const errs = {};
    teams.forEach((team, ti) => {
      if (!team.name.trim()) errs[`team${ti}name`] = 'Required';
      team.players.forEach((p, pi) => {
        if (!p.name.trim()) errs[`t${ti}p${pi}name`] = 'Required';
        const hcp = parseInt(p.handicap, 10);
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
      <div className="team-setup">
        {teams.map((team, ti) => (
          <div key={ti} className="team-block">
            <div className="team-block-header">
              <span className="team-block-title">Team {ti + 1}</span>
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
              {errors[`team${ti}name`] && (
                <p className="form-error">{errors[`team${ti}name`]}</p>
              )}
            </div>

            {team.players.map((player, pi) => (
              <div key={pi} className="player-row">
                <div className="player-row-inner">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Player {pi + 1} Name
                    </label>
                    <input
                      className={`form-input form-input-sm${errors[`t${ti}p${pi}name`] ? ' error' : ''}`}
                      value={player.name}
                      onChange={(e) => updatePlayer(ti, pi, 'name', e.target.value)}
                      placeholder="Name"
                      maxLength={30}
                    />
                    {errors[`t${ti}p${pi}name`] && (
                      <p className="form-error">{errors[`t${ti}p${pi}name`]}</p>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">HCP</label>
                    <input
                      className={`form-input form-input-sm${errors[`t${ti}p${pi}hcp`] ? ' error' : ''}`}
                      value={player.handicap}
                      onChange={(e) => updatePlayer(ti, pi, 'handicap', e.target.value)}
                      placeholder="0"
                      type="number"
                      min="0"
                      max="54"
                      inputMode="numeric"
                    />
                    {errors[`t${ti}p${pi}hcp`] && (
                      <p className="form-error">{errors[`t${ti}p${pi}hcp`]}</p>
                    )}
                  </div>
                </div>
                {team.players.length > 1 && (
                  <button
                    className="remove-player-btn"
                    onClick={() => removePlayer(ti, pi)}
                    aria-label="Remove player"
                  >
                    <CloseIcon size={18} color="currentColor" />
                  </button>
                )}
              </div>
            ))}

            {team.players.length < 2 && (
              <button
                className="add-player-btn"
                onClick={() => addPlayer(ti)}
                style={{ marginTop: 4 }}
              >
                + Add second player
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>
          Continue
        </button>
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
          <span className="confirm-label">Location</span>
          <span className="confirm-value">{course.location}</span>
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
              <span className="confirm-value">HCP {p.handicap}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack} disabled={loading}>
          Back
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>
      </div>
    </div>
  );
}

// ========== STEP 4: Share ==========
function StepShare({ gameCode, onStart }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/join?code=${gameCode}`;

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
        await navigator.share({
          title: 'Join my golf matchplay game',
          text: `Game code: ${gameCode}`,
          url: shareUrl,
        });
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
        <div className="game-code-label">Game Code</div>
        <div className="game-code-value">{gameCode}</div>
        <div className="game-code-hint">Share this code with other players</div>
      </div>

      <div className="card">
        <p className="section-title-sm">Share Link</p>
        <div className="share-link">
          <span className="share-link-text">{shareUrl}</span>
          <button className="share-link-copy" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          className="btn btn-secondary btn-full"
          style={{ marginTop: 12 }}
          onClick={share}
        >
          <ShareIcon size={16} color="var(--green-dark)" />
          Share
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-primary btn-full"
          style={{ minHeight: 60, fontSize: '1.1rem' }}
          onClick={() => onStart(gameCode)}
        >
          Go to Game Lobby
        </button>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function CreateGame() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState(null);
  const [teams, setTeams] = useState([makeTeam(1), makeTeam(2)]);
  const [gameCode, setGameCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Normalize handicaps to integers
      const normalizedTeams = teams.map((team) => ({
        ...team,
        name: team.name.trim(),
        players: team.players.map((p) => ({
          name: p.name.trim(),
          handicap: parseInt(p.handicap, 10),
        })),
      }));
      const { code } = await createGame({ course, teams: normalizedTeams });
      setGameCode(code);
      setStep(4);
    } catch (err) {
      setError('Failed to create game. Check your Firebase config.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header title="New Game" showBack backTo="/" />
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
        <StepCourse
          selected={course}
          onSelect={setCourse}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepTeams
          teams={teams}
          onChange={setTeams}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepConfirm
          course={course}
          teams={teams}
          onConfirm={handleConfirm}
          onBack={() => setStep(2)}
          loading={loading}
        />
      )}
      {step === 4 && (
        <StepShare
          gameCode={gameCode}
          onStart={(code) => navigate(`/game/${code}`)}
        />
      )}
    </div>
  );
}
