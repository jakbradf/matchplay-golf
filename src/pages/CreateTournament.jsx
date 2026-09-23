import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Stepper from '../components/Stepper';
import { ALL_COURSES } from '../data/courses';
import { loadPublicCourses } from '../firebase/courseService';
import { createTournament } from '../firebase/tournamentService';
import { getCourseHandicap } from '../utils/scoring';
import { ShareIcon, CloseIcon, SearchIcon, PlusIcon, CameraIcon } from '../components/GolfIcon';
import { useAuth } from '../contexts/AuthContext';
import PlayerAvatar from '../components/PlayerAvatar';
import StoredPlayerPicker from '../components/StoredPlayerPicker';

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
const MIN_TEAM_PLAYERS = 2;
const MAX_TEAM_PLAYERS = 4;

function makePlayer() {
  return { name: '', handicap: '', photoURL: null };
}

function makeTeam(num) {
  return { name: `Team ${num}`, players: [makePlayer(), makePlayer()] };
}

function StepTeams({ teams, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const [pickerFor, setPickerFor] = useState(null); // { ti, pi } | null

  const updateTeamName = (ti, val) => {
    onChange(teams.map((t, i) => (i === ti ? { ...t, name: val } : t)));
  };

  const updatePlayer = (ti, pi, field, val) => {
    onChange(teams.map((t, i) => {
      if (i !== ti) return t;
      return { ...t, players: t.players.map((p, j) => (j === pi ? { ...p, [field]: val } : p)) };
    }));
  };

  const applyPickedPlayer = (ti, pi, picked) => {
    onChange(teams.map((t, i) => {
      if (i !== ti) return t;
      return { ...t, players: t.players.map((p, j) => (j === pi ? { ...p, ...picked } : p)) };
    }));
  };

  const addPlayer = (ti) => {
    onChange(teams.map((t, i) => {
      if (i !== ti || t.players.length >= MAX_TEAM_PLAYERS) return t;
      return { ...t, players: [...t.players, makePlayer()] };
    }));
  };

  const removePlayer = (ti, pi) => {
    onChange(teams.map((t, i) => {
      if (i !== ti || t.players.length <= MIN_TEAM_PLAYERS) return t;
      return { ...t, players: t.players.filter((_, j) => j !== pi) };
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
      <p className="section-title-sm">Teams</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginTop: -8, marginBottom: 16 }}>
        2–4 players per team. A team's score is every player's own points added
        together and divided by the number of players, so teams of different
        sizes are scored fairly against each other.
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
                <button
                  type="button"
                  className="player-row-photo-btn"
                  onClick={() => setPickerFor({ ti, pi })}
                  aria-label={player.photoURL ? `Change photo for ${player.name || 'player'}` : `Add photo for ${player.name || 'player'}`}
                >
                  {player.photoURL
                    ? <PlayerAvatar name={player.name} photoURL={player.photoURL} size={40} />
                    : <div className="picker-photo-placeholder"><CameraIcon size={16} color="var(--grey-500)" /></div>}
                </button>
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
                      onChange={(e) => updatePlayer(ti, pi, 'handicap', e.target.value.replace(',', '.'))}
                      placeholder="0.0"
                      type="text"
                      inputMode="decimal"
                    />
                    {errors[`t${ti}p${pi}hcp`] && <p className="form-error">{errors[`t${ti}p${pi}hcp`]}</p>}
                  </div>
                </div>
                {team.players.length > MIN_TEAM_PLAYERS && (
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

            {team.players.length < MAX_TEAM_PLAYERS && (
              <button
                className="add-player-btn"
                onClick={() => addPlayer(ti)}
                style={{ marginTop: 4 }}
              >
                + Add player
              </button>
            )}
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

      {pickerFor && (
        <StoredPlayerPicker
          currentName={teams[pickerFor.ti].players[pickerFor.pi].name}
          currentHandicap={teams[pickerFor.ti].players[pickerFor.pi].handicap}
          onSelect={(picked) => applyPickedPlayer(pickerFor.ti, pickerFor.pi, picked)}
          onClose={() => setPickerFor(null)}
        />
      )}
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
function TeamShareRow({ tournamentCode, team }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/tournament/${tournamentCode}/team/${team.id}/${team.editToken}`;

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
        await navigator.share({ title: `${team.name} — scoring link`, text: `Enter ${team.name}'s scores here`, url: shareUrl });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="card mt-8">
      <p className="section-title-sm">{team.name}</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginBottom: 8 }}>
        {team.players.map(p => p.name).join(' & ')} — this link only lets them score for {team.name}.
      </p>
      <div className="share-link">
        <span className="share-link-text">{shareUrl}</span>
        <button className="share-link-copy" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={share}>
        <ShareIcon size={16} color="var(--green-dark)" />
        Send to {team.name}
      </button>
    </div>
  );
}

function StepShare({ tournamentCode, teams, endPin, onStart }) {
  const [copied, setCopied] = useState(false);
  const organizerUrl = `${window.location.origin}/tournament/${tournamentCode}`;

  const copyOrganizerLink = async () => {
    try {
      await navigator.clipboard.writeText(organizerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="page">
      <div className="game-code-display">
        <div className="game-code-label">Tournament Code</div>
        <div className="game-code-value">{tournamentCode}</div>
        <div className="game-code-hint">Your organizer link — full access to every team</div>
      </div>

      <div className="card">
        <p className="section-title-sm">Organizer Link</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginBottom: 8 }}>
          Keep this for yourself — it can score for any team, start the round, and finish it.
        </p>
        <div className="share-link">
          <span className="share-link-text">{organizerUrl}</span>
          <button className="share-link-copy" onClick={copyOrganizerLink}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>

      {endPin && (
        <div className="card mt-12" style={{ textAlign: 'center' }}>
          <p className="section-title-sm">Finish PIN</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginBottom: 8 }}>
            You'll need this to end the tournament — it protects against finishing by mistake.
            Write it down; it won't be shown again.
          </p>
          <div className="game-code-value" style={{ fontSize: '2rem' }}>{endPin}</div>
        </div>
      )}

      <p className="section-title-sm" style={{ marginTop: 20 }}>Send Each Team Their Own Link</p>
      {teams.map((team) => (
        <TeamShareRow key={team.id} tournamentCode={tournamentCode} team={team} />
      ))}

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
  const [createdTeams, setCreatedTeams] = useState([]);
  const [tournamentCode, setTournamentCode] = useState(null);
  const [endPin, setEndPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalizedTeams = teams.map((team, ti) => ({
        id: `team-${ti}-${Math.random().toString(36).slice(2, 8)}`,
        editToken: Math.random().toString(36).slice(2, 10),
        name: team.name.trim(),
        players: team.players.map((p) => ({
          name: p.name.trim(),
          handicap: parseFloat(p.handicap),
          ...(p.photoURL ? { photoURL: p.photoURL } : {}),
        })),
      }));
      const { code, endPin: pin } = await createTournament({
        course,
        teams: normalizedTeams,
        userId: user?.uid ?? null,
      });
      setCreatedTeams(normalizedTeams);
      setTournamentCode(code);
      setEndPin(pin);
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
        <StepShare tournamentCode={tournamentCode} teams={createdTeams} endPin={endPin} onStart={(code) => navigate(`/tournament/${code}`)} />
      )}
    </div>
  );
}
