import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { getTournament } from '../firebase/tournamentService';

export default function JoinTournament() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getTournament(trimmed);
      if (!data) {
        setError('Tournament not found. Check the code and try again.');
        setTournament(null);
      } else {
        setTournament(data);
      }
    } catch (err) {
      setError('Failed to look up tournament. Check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => navigate(`/tournament/${code.trim().toUpperCase()}`);
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !tournament) handleLookup(); };

  return (
    <div className="app-container">
      <Header title="Join Tournament" showBack backTo="/" />

      <div className="page">
        <div className="card">
          <div className="form-group">
            <label className="form-label">Enter Tournament Code</label>
            <input
              className={`form-input code-input${error ? ' error' : ''}`}
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 6)); setTournament(null); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
          </div>

          {!tournament && (
            <button className="btn btn-primary btn-full" onClick={handleLookup} disabled={loading || code.length < 6}>
              {loading ? 'Looking up...' : 'Find Tournament'}
            </button>
          )}
        </div>

        {tournament && (
          <>
            <div className="card mt-12">
              <p className="section-title-sm">Tournament Found</p>
              <div className="confirm-row">
                <span className="confirm-label">Course</span>
                <span className="confirm-value">{tournament.course.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Teams</span>
                <span className="confirm-value">{tournament.teams.length}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Status</span>
                <span className="confirm-value" style={{ textTransform: 'capitalize' }}>{tournament.status}</span>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                className="btn btn-primary btn-full"
                style={{ minHeight: 60, fontSize: '1.1rem' }}
                onClick={handleJoin}
              >
                Enter Tournament
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
