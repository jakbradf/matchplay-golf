import { useState } from 'react';
import Leaderboard from './Leaderboard';
import ScorecardGrid from './ScorecardGrid';

const VIEWS = [
  { key: 'standings', label: 'Standings' },
  { key: 'grid', label: 'Grid' },
];

export default function Scorecard({ scores, teams, course, onEndGame }) {
  const [view, setView] = useState('standings');

  return (
    <div>
      <div className="gm-lb-tabs" style={{ marginTop: 0 }}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={`gm-lb-tab${view === v.key ? ' active' : ''}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'standings'
        ? <Leaderboard scores={scores} teams={teams} course={course} onEndGame={onEndGame} />
        : <ScorecardGrid scores={scores} teams={teams} course={course} />}
    </div>
  );
}
