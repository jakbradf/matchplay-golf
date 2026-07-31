import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { saveCustomCourse } from '../firebase/courseService';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_HOLES = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: 4,
  strokeIndex: i + 1,
  distance: 300,
}));

function validateSI(holes) {
  const sis = holes.map(h => h.strokeIndex);
  const unique = new Set(sis);
  if (unique.size !== 18) return 'Each stroke index must be unique (1–18)';
  if ([...unique].some(si => si < 1 || si > 18)) return 'Stroke index must be between 1 and 18';
  return null;
}

// ========== STEP 1: Course Info ==========
function StepInfo({ info, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!info.name.trim()) errs.name = 'Required';
    if (!info.location.trim()) errs.location = 'Required';
    const cr = parseFloat(info.courseRating);
    if (isNaN(cr) || cr < 50 || cr > 90) errs.courseRating = '50–90';
    const sl = parseInt(info.slopeRating, 10);
    if (isNaN(sl) || sl < 55 || sl > 155) errs.slopeRating = '55–155';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const field = (key, label, type = 'text', extra = {}) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className={`form-input${errors[key] ? ' error' : ''}`}
        type={type}
        value={info[key]}
        onChange={e => onChange({ ...info, [key]: e.target.value })}
        {...extra}
      />
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="page">
      <p className="section-title-sm">Course Details</p>
      {field('name', 'Course Name', 'text', { placeholder: 'e.g. Bogstad Golf', maxLength: 60 })}
      {field('location', 'Location', 'text', { placeholder: 'e.g. Oslo, Norway', maxLength: 60 })}
      {field('courseRating', 'Course Rating (CR)', 'number', { placeholder: '72.0', step: '0.1', inputMode: 'decimal' })}
      {field('slopeRating', 'Slope Rating', 'number', { placeholder: '125', step: '1', inputMode: 'numeric' })}
      <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginTop: -8, marginBottom: 16 }}>
        CR and Slope can be found on the club's scorecard or website.
      </p>
      <button className="btn btn-primary btn-full" onClick={() => { if (validate()) onNext(); }}>
        Continue to Holes
      </button>
    </div>
  );
}

// ========== STEP 2: Hole Data ==========
function StepHoles({ holes, onChange, onNext, onBack }) {
  const [error, setError] = useState(null);

  function updateHole(i, field, val) {
    const updated = holes.map((h, idx) =>
      idx === i ? { ...h, [field]: field === 'distance' ? val : parseInt(val, 10) || h[field] } : h
    );
    onChange(updated);
  }

  function handleNext() {
    const err = validateSI(holes);
    if (err) { setError(err); return; }
    setError(null);
    onNext();
  }

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <p className="section-title-sm">Hole Data</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginBottom: 12 }}>
        Par, stroke index (SI 1–18 each unique), and distance in metres.
      </p>

      {error && (
        <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="course-holes-table-wrap">
        <table className="course-holes-table">
          <thead>
            <tr>
              <th>Hole</th>
              <th>Par</th>
              <th>SI</th>
              <th>Dist (m)</th>
            </tr>
          </thead>
          <tbody>
            {holes.map((h, i) => (
              <tr key={h.number}>
                <td className="hole-num-cell">{h.number}</td>
                <td>
                  <select
                    className="hole-select"
                    value={h.par}
                    onChange={e => updateHole(i, 'par', e.target.value)}
                  >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </td>
                <td>
                  <input
                    className="hole-input"
                    type="number"
                    min={1}
                    max={18}
                    value={h.strokeIndex}
                    onChange={e => updateHole(i, 'strokeIndex', e.target.value)}
                    inputMode="numeric"
                  />
                </td>
                <td>
                  <input
                    className="hole-input"
                    type="number"
                    min={50}
                    max={700}
                    value={h.distance}
                    onChange={e => updateHole(i, 'distance', e.target.value)}
                    inputMode="numeric"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky-action-bar">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack}>Back</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleNext}>Review</button>
        </div>
      </div>
    </div>
  );
}

// ========== STEP 3: Confirm & Save ==========
function StepConfirm({ info, holes, onSave, onBack, saving }) {
  const par = holes.reduce((s, h) => s + h.par, 0);

  return (
    <div className="page">
      <div className="card">
        <p className="section-title-sm">Summary</p>
        <div className="confirm-row"><span className="confirm-label">Course</span><span className="confirm-value">{info.name}</span></div>
        <div className="confirm-row"><span className="confirm-label">Location</span><span className="confirm-value">{info.location}</span></div>
        <div className="confirm-row"><span className="confirm-label">Par</span><span className="confirm-value">{par}</span></div>
        <div className="confirm-row"><span className="confirm-label">CR / Slope</span><span className="confirm-value">{info.courseRating} / {info.slopeRating}</span></div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <p className="section-title-sm">Holes</p>
        <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--grey-200)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--grey-600)', fontWeight: 600 }}>H</th>
              <th style={{ color: 'var(--grey-600)', fontWeight: 600 }}>Par</th>
              <th style={{ color: 'var(--grey-600)', fontWeight: 600 }}>SI</th>
              <th style={{ textAlign: 'right', color: 'var(--grey-600)', fontWeight: 600 }}>Dist</th>
            </tr>
          </thead>
          <tbody>
            {holes.map(h => (
              <tr key={h.number} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                <td style={{ padding: '3px 0', fontWeight: 600 }}>{h.number}</td>
                <td style={{ textAlign: 'center' }}>{h.par}</td>
                <td style={{ textAlign: 'center' }}>{h.strokeIndex}</td>
                <td style={{ textAlign: 'right' }}>{h.distance}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--grey-500)', marginTop: 12 }}>
        This course will be available to all players in the app.
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onBack} disabled={saving}>Back</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Course'}
        </button>
      </div>
    </div>
  );
}

// ========== MAIN ==========
export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState({ name: '', location: '', courseRating: '', slopeRating: '' });
  const [holes, setHoles] = useState(DEFAULT_HOLES.map(h => ({ ...h })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const courseData = {
        name: info.name.trim(),
        location: info.location.trim(),
        courseRating: parseFloat(info.courseRating),
        slopeRating: parseInt(info.slopeRating, 10),
        holes: holes.map(h => ({
          ...h,
          isParThree: h.par === 3,
        })),
      };
      await saveCustomCourse(courseData, user?.uid ?? null);
      navigate('/create', { state: { courseSaved: true } });
    } catch (e) {
      console.error(e);
      setError('Failed to save course. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="app-container">
      <Header title="Add Course" showBack backTo="/create" />

      {error && (
        <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 16px', margin: '8px 16px', color: 'var(--red)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {step === 1 && <StepInfo info={info} onChange={setInfo} onNext={() => setStep(2)} />}
      {step === 2 && <StepHoles holes={holes} onChange={setHoles} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepConfirm info={info} holes={holes} onSave={handleSave} onBack={() => setStep(2)} saving={saving} />}
    </div>
  );
}
