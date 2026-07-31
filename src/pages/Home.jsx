import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GolfBallIcon, GolfFlagIcon, HistoryIcon } from '../components/GolfIcon';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { getUserGames } from '../firebase/gameService';

function GameStatusBadge({ status }) {
  const map = { lobby: 'Lobby', active: 'Live', complete: 'Complete' };
  return (
    <span className={`game-status-badge status-${status}`}>
      {map[status] ?? status}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [recentGames, setRecentGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  useEffect(() => {
    if (!user) { setRecentGames([]); return; }
    setGamesLoading(true);
    getUserGames(user.uid)
      .then(games => setRecentGames(games.slice(0, 5)))
      .finally(() => setGamesLoading(false));
  }, [user]);

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* User menu — top right */}
        <div className="home-user-row">
          {!authLoading && <UserMenu />}
        </div>

        <div className="home-hero">
          <div className="home-logo">
            <GolfBallIcon size={48} color="white" />
          </div>
          <h1 className="home-title">Matchplay Golf</h1>
          <p className="home-subtitle">4-ball better ball · Handicap adjusted · Real-time scoring</p>
        </div>

        <div className="home-actions">
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/create')}
            style={{ minHeight: 60, fontSize: '1.125rem' }}
          >
            <GolfFlagIcon size={20} color="white" />
            New Game
          </button>

          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate('/join')}
            style={{ minHeight: 60, fontSize: '1.125rem' }}
          >
            Join Game
          </button>
        </div>

        {/* Recent rounds for logged-in users */}
        {user && (
          <div className="home-recent">
            <div className="home-recent-header">
              <h3>Recent Rounds</h3>
              <button className="home-recent-all" onClick={() => navigate('/my-games')}>
                <HistoryIcon size={14} color="var(--green-dark)" />
                All rounds
              </button>
            </div>

            {gamesLoading && (
              <p style={{ color: 'var(--grey-500)', fontSize: '0.875rem' }}>Loading…</p>
            )}

            {!gamesLoading && recentGames.length === 0 && (
              <p style={{ color: 'var(--grey-500)', fontSize: '0.875rem' }}>
                No rounds yet. Create your first game!
              </p>
            )}

            {recentGames.map(game => (
              <button
                key={game.code}
                className="recent-game-card"
                onClick={() => navigate(
                  game.status === 'complete'
                    ? `/game/${game.code}/results`
                    : `/game/${game.code}`
                )}
              >
                <div className="recent-game-course">{game.course?.name}</div>
                <div className="recent-game-meta">
                  <GameStatusBadge status={game.status} />
                  <span className="recent-game-teams">
                    {game.teams?.map(t => t.name).join(' vs ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />
      </div>
    </div>
  );
}
