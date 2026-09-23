import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GolfFlagIcon, HistoryIcon, TrophyIcon, UsersIcon } from '../components/GolfIcon';
import { GolfMatchLogo } from '../components/GolfMatchLogo';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { getUserGames } from '../firebase/gameService';
import { getUserTournaments } from '../firebase/tournamentService';

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
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);

  useEffect(() => {
    if (!user) { setRecentGames([]); return; }
    setGamesLoading(true);
    getUserGames(user.uid)
      .then(games => setRecentGames(games.slice(0, 5)))
      .finally(() => setGamesLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) { setRecentTournaments([]); return; }
    setTournamentsLoading(true);
    getUserTournaments(user.uid)
      .then(tournaments => setRecentTournaments(tournaments.slice(0, 5)))
      .finally(() => setTournamentsLoading(false));
  }, [user]);

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* User menu — top right */}
        <div className="home-user-row">
          {!authLoading && <UserMenu />}
        </div>

        <div className="home-hero">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GolfMatchLogo markSize={64} wordSize={30} gap={16} />
          </div>
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

        <div className="home-actions" style={{ marginTop: 8 }}>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate('/create-tournament')}
          >
            <TrophyIcon size={18} color="var(--green-dark)" />
            Host Tournament
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate('/join-tournament')}
          >
            Join Tournament
          </button>
        </div>

        <div className="home-actions" style={{ marginTop: 8 }}>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate('/my-players')}
          >
            <UsersIcon size={18} color="var(--green-dark)" />
            My Players
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

        {/* Recent tournaments for logged-in users */}
        {user && (
          <div className="home-recent">
            <div className="home-recent-header">
              <h3>Recent Tournaments</h3>
              <button className="home-recent-all" onClick={() => navigate('/my-tournaments')}>
                <TrophyIcon size={14} color="var(--green-dark)" />
                All tournaments
              </button>
            </div>

            {tournamentsLoading && (
              <p style={{ color: 'var(--grey-500)', fontSize: '0.875rem' }}>Loading…</p>
            )}

            {!tournamentsLoading && recentTournaments.length === 0 && (
              <p style={{ color: 'var(--grey-500)', fontSize: '0.875rem' }}>
                No tournaments yet. Host your first one!
              </p>
            )}

            {recentTournaments.map(t => (
              <button
                key={t.code}
                className="recent-game-card"
                onClick={() => navigate(`/tournament/${t.code}`)}
              >
                <div className="recent-game-course">{t.course?.name}</div>
                <div className="recent-game-meta">
                  <GameStatusBadge status={t.status} />
                  <span className="recent-game-teams">
                    {t.teams?.map(team => team.name).join(' vs ')}
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
