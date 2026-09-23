import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserTournaments } from '../firebase/tournamentService';
import Header from '../components/Header';
import { signInWithGoogle } from '../firebase/authService';
import { GoogleIcon } from '../components/GolfIcon';

function TournamentStatusBadge({ status }) {
  const map = { lobby: 'Lobby', active: 'Live', complete: 'Complete' };
  return <span className={`game-status-badge status-${status}`}>{map[status] ?? status}</span>;
}

export default function MyTournaments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserTournaments(user.uid)
      .then(setTournaments)
      .finally(() => setLoading(false));
  }, [user]);

  function formatDate(ts) {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (authLoading) {
    return (
      <div className="app-container">
        <Header title="My Tournaments" showBack backTo="/" />
        <div className="loading-screen"><div className="spinner" /><span>Loading…</span></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <Header title="My Tournaments" showBack backTo="/" />
        <div className="page" style={{ textAlign: 'center', paddingTop: 48 }}>
          <p style={{ color: 'var(--grey-600)', marginBottom: 24 }}>
            Sign in with Google to see your tournament history.
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
      <Header title="My Tournaments" showBack backTo="/" />
      <div className="page">
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><span>Loading tournaments…</span></div>
        ) : tournaments.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <p style={{ color: 'var(--grey-600)', marginBottom: 20 }}>No tournaments yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-tournament')}>
              Host a Tournament
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tournaments.map(t => (
              <button
                key={t.code}
                className="my-game-card"
                onClick={() => navigate(`/tournament/${t.code}`)}
              >
                <div className="my-game-top">
                  <span className="my-game-course">{t.course?.name}</span>
                  <TournamentStatusBadge status={t.status} />
                </div>
                <div className="my-game-teams">
                  {t.teams?.map(team => team.name).join(' vs ')}
                </div>
                <div className="my-game-meta">
                  <span className="my-game-code">#{t.code}</span>
                  <span className="my-game-date">{formatDate(t.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
