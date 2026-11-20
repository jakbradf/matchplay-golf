import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Stepper from '../components/Stepper';
import { ALL_COURSES } from '../data/courses';
import { loadPublicCourses } from '../firebase/courseService';
import { createGame } from '../firebase/gameService';
import { getCourseHandicap } from '../utils/scoring';
import { DEFAULT_SKIN_VALUE, DEFAULT_SKIN_CURRENCY, SKIN_CURRENCIES, GAME_TYPES, formatMoney, skinsTeamLabel } from '../utils/skins';
import { ShareIcon, CloseIcon, SearchIcon, PlusIcon, CameraIcon } from '../components/GolfIcon';
import { useAuth } from '../contexts/AuthContext';
import PlayerAvatar from '../components/PlayerAvatar';
import StoredPlayerPicker from '../components/StoredPlayerPicker';

// ========== STEP 1: Game Type ==========
const GAME_TYPE_OPTIONS = [
  {
    type: GAME_TYPES.MATCHPLAY,
    name: 'Matchplay',
    desc: '2 teams, 4-ball better ball with handicap. Optional skins side game.',
    stats: ['2 teams', '1–2 players each'],
  },
  {
    type: GAME_TYPES.SKINS,
    name: 'Skins',
    desc: 'Lowest net wins the hole and the pot. Tied holes carry over. Best net counts for teams of two.',
    stats: ['2–4 teams', '1–2 players each'],
  },
];

function StepGameType({ gameType, onSelect, onNext }) {
  return (
    <>
      <div className="page" style={{ paddingBottom: 0 }}>
        <p className="section-title-sm">Game Type</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GAME_TYPE_OPTIONS.map((o) => (
            <button
              key={o.type}
              className={`course-card${gameType === o.type ? ' selected' : ''}`}
              onClick={() => onSelect(o.type)}
            >
              <div className="course-card-name">{o.name}</div>
              <div className="course-card-location">{o.desc}</div>
              <div className="course-card-stats">
                {o.stats.map((st) => <span key={st} className="course-stat"><span>{st}</span></span>)}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="sticky-action-bar">
        <button className="btn btn-primary btn-full" onClick={onNext} disabled={!gameType}>
          Continue
        </button>
      </div>
    </>
  );
}

// ========== STEP 2: Course Selection ==========
function StepCourse({ selected, selectedTee, onSelect, onSelectTee, onNext, onBack, onCreateCourse }) {
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
              No courses found. Try a different search or add a custom course.
            </p>
          )}
          {filtered.map((course) => (
            <button
              key={course.id}
              className={`course-card${selected?.id === course.id ? ' selected' : ''}`}
              onClick={() => { onSelect(course); onSelectTee(null); }}
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

        {selected?.tees && (
          <div style={{ marginTop: 16 }}>
            <p className="section-title-sm">Select Tees</p>
            <div className="tee-selector">
              {selected.tees.map((tee) => (
                <button
                  key={tee.name}
                  className={`tee-btn${selectedTee?.name === tee.name ? ' active' : ''}`}
                  onClick={() => onSelectTee(tee)}
                >
                  <span className="tee-btn-name">{tee.name}</span>
                  <span className="tee-btn-stats">CR {tee.courseRating} · S {tee.slopeRating}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="add-course-link"
          onClick={onCreateCourse}
          style={{ marginTop: 16, marginBottom: 8 }}
        >
          <PlusIcon size={16} color="var(--green-dark)" />
          Add a custom course
        </button>
      </div>

      <div className="sticky-action-bar">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack}>
            Back
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={onNext}
            disabled={!selected || (selected.tees && !selectedTee)}
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}

// ========== STEP 3: Team Setup ==========
function makePlayer() {
  return { name: '', handicap: '', photoURL: null };
}

function makeTeam(num) {
  return { name: `Team ${num}`, players: [makePlayer()] };
}

function StepTeams({ teams, gameType, onChange, onNext, onBack }) {
  const maxTeams = gameType === GAME_TYPES.SKINS ? 4 : 2;
  const [errors, setErrors] = useState({});
  const [pickerFor, setPickerFor] = useState(null); // { ti, pi } | null

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

  const applyPickedPlayer = (ti, pi, picked) => {
    const updated = teams.map((t, i) => {
      if (i !== ti) return t;
      const players = t.players.map((p, j) => (j === pi ? { ...p, ...picked } : p));
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

  const addTeam = () => {
    if (teams.length >= maxTeams) return;
    onChange([...teams, makeTeam(teams.length + 1)]);
  };

  const removeTeam = (ti) => {
    if (teams.length <= 2) return;
    onChange(teams.filter((_, i) => i !== ti));
    setErrors({});
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
      <div className="team-setup">
        {teams.map((team, ti) => (
          <div key={ti} className="team-block">
            <div className="team-block-header">
              <span className="team-block-title">Team {ti + 1}</span>
              {teams.length > 2 && (
                <button
                  type="button"
                  className="remove-team-btn"
                  onClick={() => removeTeam(ti)}
                  aria-label={`Remove team ${ti + 1}`}
                >
                  Remove team
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
              {errors[`team${ti}name`] && (
                <p className="form-error">{errors[`team${ti}name`]}</p>
              )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Player {pi + 1} Name
                      </label>
                      <button
                        type="button"
                        className="pick-player-btn"
                        onClick={() => setPickerFor({ ti, pi })}
                      >
                        Pick Player
                      </button>
                    </div>
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
                    <label className="form-label">HCP Index</label>
                    <input
                      className={`form-input form-input-sm${errors[`t${ti}p${pi}hcp`] ? ' error' : ''}`}
                      value={player.handicap}
                      onChange={(e) => updatePlayer(ti, pi, 'handicap', e.target.value.replace(',', '.'))}
                      placeholder="0.0"
                      type="text"
                      inputMode="decimal"
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

      {teams.length < maxTeams && (
        <button className="add-course-link" onClick={addTeam} style={{ marginTop: 16 }}>
          <PlusIcon size={16} color="var(--green-dark)" />
          Add team ({teams.length}/{maxTeams})
        </button>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>
          Continue
        </button>
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

// ========== STEP 4: Confirm ==========
function SkinsSetup({ skins, onChange, unitCount, alwaysOn = false }) {
  const value = parseFloat(skins.value);
  const valid = !isNaN(value) && value > 0;
  const freshHole = valid ? value * Math.max(0, unitCount - 1) : null;
  const enabled = alwaysOn || skins.enabled;
  const isCustom = skins.customCurrency;

  return (
    <div className="card">
      {alwaysOn ? (
        <div>
          <p className="section-title-sm" style={{ marginBottom: 0 }}>Stakes</p>
          <p className="skins-setup-hint">Each team puts in one skin per hole. Lowest net takes the pot, tied holes carry over.</p>
        </div>
      ) : (
        <label className="skins-setup-toggle">
          <div>
            <p className="section-title-sm" style={{ marginBottom: 0 }}>Skins side game</p>
            <p className="skins-setup-hint">Every player for himself on net score. Tied holes carry over.</p>
          </div>
          <input
            type="checkbox"
            checked={skins.enabled}
            onChange={(e) => onChange({ ...skins, enabled: e.target.checked })}
          />
        </label>
      )}
      {enabled && (
        <>
          <div className="skins-setup-value">
            <span className="confirm-label">Value per skin</span>
            <input
              className={`form-input form-input-sm${valid ? '' : ' error'}`}
              value={skins.value}
              onChange={(e) => onChange({ ...skins, value: e.target.value.replace(',', '.') })}
              inputMode="decimal"
              type="text"
            />
          </div>
          <div className="skins-currency">
            <span className="confirm-label">Currency</span>
            <div className="tee-selector skins-currency-options">
              {SKIN_CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`tee-btn${!isCustom && skins.currency === c.code ? ' active' : ''}`}
                  onClick={() => onChange({ ...skins, currency: c.code, customCurrency: false })}
                >
                  <span className="tee-btn-name">{c.label}</span>
                </button>
              ))}
              <button
                type="button"
                className={`tee-btn${isCustom ? ' active' : ''}`}
                onClick={() => onChange({ ...skins, currency: '', customCurrency: true })}
              >
                <span className="tee-btn-name">Custom</span>
              </button>
            </div>
            {isCustom && (
              <input
                className={`form-input form-input-sm${skins.currency.trim() ? '' : ' error'}`}
                value={skins.currency}
                onChange={(e) => onChange({ ...skins, currency: e.target.value })}
                placeholder="e.g. SEK, £, beers"
                maxLength={12}
                autoFocus
              />
            )}
          </div>
          {valid && unitCount > 1 && (
            <p className="skins-setup-hint">
              With {unitCount} {alwaysOn ? 'teams' : 'players'} a hole is worth {formatMoney(freshHole, skins.currency)} to the winner,
              {' '}{formatMoney(freshHole * 2, skins.currency)} after one carry.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function StepConfirm({ course, selectedTee, teams, gameType, skins, onSkinsChange, onConfirm, onBack, loading }) {
  const isSkinsGame = gameType === GAME_TYPES.SKINS;
  const playerCount = teams.reduce((n, t) => n + t.players.length, 0);
  const skinsOn = isSkinsGame || skins.enabled;
  const skinsInvalid = skinsOn && (!(parseFloat(skins.value) > 0) || !skins.currency.trim());
  return (
    <div className="page">
      <div className="card">
        <p className="section-title-sm">Course</p>
        <div className="confirm-row">
          <span className="confirm-label">Game</span>
          <span className="confirm-value">{isSkinsGame ? `Skins · ${teams.length} teams` : 'Matchplay'}</span>
        </div>
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
        {selectedTee && (
          <div className="confirm-row">
            <span className="confirm-label">Tees</span>
            <span className="confirm-value">{selectedTee.name} (CR {selectedTee.courseRating} / Slope {selectedTee.slopeRating})</span>
          </div>
        )}
      </div>

      {teams.map((team, ti) => (
        <div className="card" key={ti}>
          <p className="section-title-sm">{isSkinsGame ? skinsTeamLabel(team) : team.name}</p>
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

      <SkinsSetup
        skins={skins}
        onChange={onSkinsChange}
        unitCount={isSkinsGame ? teams.length : playerCount}
        alwaysOn={isSkinsGame}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack} disabled={loading}>
          Back
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={onConfirm}
          disabled={loading || skinsInvalid}
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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [gameType, setGameType] = useState(null);
  const [course, setCourse] = useState(null);
  const [selectedTee, setSelectedTee] = useState(null);

  // Pre-fill the first player slot with the logged-in user's Google profile
  const initialTeams = () => {
    const t1 = makeTeam(1);
    if (user) {
      t1.players[0] = {
        name: user.displayName ?? '',
        handicap: '',
        photoURL: user.photoURL ?? null,
      };
    }
    return [t1, makeTeam(2)];
  };

  const [teams, setTeams] = useState(initialTeams);
  const [skins, setSkins] = useState({ enabled: false, value: String(DEFAULT_SKIN_VALUE), currency: DEFAULT_SKIN_CURRENCY, customCurrency: false });
  const [gameCode, setGameCode] = useState(null);

  const selectGameType = (type) => {
    setGameType(type);
    // Matchplay is always exactly two teams
    if (type === GAME_TYPES.MATCHPLAY && teams.length > 2) setTeams(teams.slice(0, 2));
  };
  const isSkinsGame = gameType === GAME_TYPES.SKINS;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const effectiveCourse = course && selectedTee
    ? {
        ...course,
        courseRating: selectedTee.courseRating,
        slopeRating: selectedTee.slopeRating,
        par: selectedTee.par,
        holes: course.holes.map((h, i) => ({ ...h, distance: selectedTee.distances[i] })),
      }
    : course;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalizedTeams = teams.map((team) => ({
        ...team,
        name: team.name.trim(),
        players: team.players.map((p) => ({
          name: p.name.trim(),
          handicap: parseFloat(p.handicap),
          ...(p.photoURL ? { photoURL: p.photoURL } : {}),
        })),
      }));
      const { code } = await createGame({
        course: effectiveCourse,
        teams: normalizedTeams,
        userId: user?.uid ?? null,
        gameType: gameType || GAME_TYPES.MATCHPLAY,
        skins: (isSkinsGame || skins.enabled)
          ? { enabled: true, value: parseFloat(skins.value), currency: skins.currency.trim() }
          : null,
      });
      setGameCode(code);
      setStep(5);
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
      <Stepper currentStep={step} steps={['Type', 'Course', 'Teams', 'Confirm', 'Share']} />

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
        <StepGameType gameType={gameType} onSelect={selectGameType} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepCourse
          selected={course}
          selectedTee={selectedTee}
          onSelect={setCourse}
          onSelectTee={setSelectedTee}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          onCreateCourse={() => navigate('/create-course')}
        />
      )}
      {step === 3 && (
        <StepTeams
          teams={teams}
          gameType={gameType}
          onChange={setTeams}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepConfirm
          course={effectiveCourse}
          selectedTee={selectedTee}
          teams={teams}
          gameType={gameType}
          skins={skins}
          onSkinsChange={setSkins}
          onConfirm={handleConfirm}
          onBack={() => setStep(3)}
          loading={loading}
        />
      )}
      {step === 5 && (
        <StepShare
          gameCode={gameCode}
          onStart={(code) => navigate(`/game/${code}`)}
        />
      )}
    </div>
  );
}
