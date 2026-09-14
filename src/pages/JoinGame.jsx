import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import PlayerClaimList from '../components/PlayerClaimList';
import { getGame } from '../firebase/gameService';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../firebase/authService';
import { GoogleIcon } from '../components/GolfIcon';

export default function JoinGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestMode, setGuestMode] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // user cancelled
    } finally {
      setSigningIn(false);
    }
  };

  const handleLookup = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getGame(trimmed);
      if (!data) {
        setError('Game not found. Check the code and try again.');
        setGame(null);
      } else if (data.status === 'complete') {
        navigate(`/game/${trimmed}/results`);
      } else {
        setGame(data);
        setError('');
      }
    } catch (err) {
      setError('Failed to look up game. Check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    navigate(`/game/${code.trim().toUpperCase()}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !game) handleLookup();
  };

  return (
    <div className="app-container">
      <Header title="Join Game" showBack backTo="/" />

      <div className="page">
        <div className="card">
          <div className="form-group">
            <label className="form-label">Enter Game Code</label>
            <input
              className={`form-input code-input${error ? ' error' : ''}`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setGame(null);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
          </div>

          {!game && (
            <button
              className="btn btn-primary btn-full"
              onClick={handleLookup}
              disabled={loading || code.length < 6}
            >
              {loading ? 'Looking up...' : 'Find Game'}
            </button>
          )}
        </div>

        {game && (
          <>
            <div className="card mt-12">
              <p className="section-title-sm">Game Found</p>
              <div className="confirm-row">
                <span className="confirm-label">Course</span>
                <span className="confirm-value">{game.course.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Status</span>
                <span className="confirm-value" style={{ textTransform: 'capitalize' }}>
                  {game.status}
                </span>
              </div>
            </div>

            {!authLoading && !user && !guestMode && (
              <div className="card mt-12" style={{ textAlign: 'center' }}>
                <p className="section-title-sm">Who's Joining?</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--grey-600)', marginBottom: 16 }}>
                  Sign in to claim your player and keep your profile and photo across games, or continue as a guest.
                </p>
                <button className="btn btn-primary btn-full" onClick={handleSignIn} disabled={signingIn}>
                  <GoogleIcon size={18} />
                  {signingIn ? 'Signing in…' : 'Sign in with Google'}
                </button>
                <button
                  className="btn btn-secondary btn-full mt-8"
                  onClick={() => setGuestMode(true)}
                >
                  Continue as Guest
                </button>
              </div>
            )}

            {(user || guestMode) && (
              user ? (
                <PlayerClaimList game={game} gameCode={code.trim().toUpperCase()} />
              ) : (
                game.teams.map((team, ti) => (
                  <div className="card mt-8" key={ti}>
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
                ))
              )
            )}

            {(user || guestMode) && (
              <div style={{ marginTop: 24 }}>
                <button
                  className="btn btn-primary btn-full"
                  style={{ minHeight: 60, fontSize: '1.1rem' }}
                  onClick={handleJoin}
                >
                  Enter Game
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
