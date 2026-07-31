import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserGames } from '../firebase/gameService';
import Header from '../components/Header';
import { signInWithGoogle } from '../firebase/authService';
import { GoogleIcon } from '../components/GolfIcon';

function GameStatusBadge({ status }) {
  const map = { lobby: 'Lobby', active: 'Live', complete: 'Complete' };
  return <span className={`game-status-badge status-${status}`}>{map[status] ?? status}</span>;
}

export default function MyGames() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserGames(user.uid)
      .then(setGames)
      .finally(() => setLoading(false));
  }, [user]);

  function formatDate(ts) {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (authLoading) {
    return (
      <div className="app-container">
        <Header title="My Rounds" showBack backTo="/" />
        <div className="loading-screen"><div className="spinner" /><span>Loading…</span></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <Header title="My Rounds" showBack backTo="/" />
        <div className="page" style={{ textAlign: 'center', paddingTop: 48 }}>
          <p style={{ color: 'var(--grey-600)', marginBottom: 24 }}>
            Sign in with Google to see your round history.
          </p>
          <button className="btn btn-primary" onClick={signInWithGoogle}>
            <GoogleIcon size={18} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header title="My Rounds" showBack backTo="/" />
      <div className="page">
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><span>Loading rounds…</span></div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <p style={{ color: 'var(--grey-600)', marginBottom: 20 }}>No rounds yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/create')}>
              Start a Game
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {games.map(game => (
              <button
                key={game.code}
                className="my-game-card"
                onClick={() => navigate(
                  game.status === 'complete'
                    ? `/game/${game.code}/results`
                    : `/game/${game.code}`
                )}
              >
                <div className="my-game-top">
                  <span className="my-game-course">{game.course?.name}</span>
                  <GameStatusBadge status={game.status} />
                </div>
                <div className="my-game-teams">
                  {game.teams?.map(t => t.name).join(' vs ')}
                </div>
                <div className="my-game-meta">
                  <span className="my-game-code">#{game.code}</span>
                  <span className="my-game-date">{formatDate(game.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
