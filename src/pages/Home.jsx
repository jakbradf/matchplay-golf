import { useNavigate } from 'react-router-dom';
import { GolfBallIcon, GolfFlagIcon } from '../components/GolfIcon';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ flex: 1 }} />

        <div style={{ textAlign: 'center', color: 'var(--grey-400)', fontSize: '0.75rem', paddingBottom: 16 }}>
          Strömstads Golfklubb
        </div>
      </div>
    </div>
  );
}
