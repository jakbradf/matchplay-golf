import { buildScorecardData, computeMatchScore } from '../utils/scoring';

function ResultCell({ result, teamIndex }) {
  if (!result) return <td className="result-halved">-</td>;
  if (result.result === 'halved') return <td className="result-halved">H</td>;
  if (result.result === `team${teamIndex}`) {
    return <td className={`result-win${teamIndex}`}>W</td>;
  }
  return <td className={`result-win${1 - teamIndex}`}>L</td>;
}

export default function Scorecard({ scores, teams, course }) {
  const data = buildScorecardData(scores, teams, course.holes);
  const [t0total, t1total] = computeMatchScore(scores, teams, course.holes);

  // Split into front/back nine
  const front = data.filter(d => d.hole.number <= 9);
  const back = data.filter(d => d.hole.number >= 10);

  const renderHalfTable = (rows, label) => {
    const team0pts = rows.reduce((s, d) => s + (d.result?.team0points || 0), 0);
    const team1pts = rows.reduce((s, d) => s + (d.result?.team1points || 0), 0);

    return (
      <div className="scorecard-wrapper" style={{ marginBottom: 12 }}>
        <table className="scorecard-table">
          <thead>
            <tr>
              <th>Hole</th>
              <th>Par</th>
              <th>SI</th>
              {teams[0].players.map((p, i) => (
                <th key={i} title={`HCP: ${p.handicap}`}>
                  {p.name.split(' ')[0]}
                </th>
              ))}
              <th>Net</th>
              <th>Res</th>
              {teams[1].players.map((p, i) => (
                <th key={i} title={`HCP: ${p.handicap}`}>
                  {p.name.split(' ')[0]}
                </th>
              ))}
              <th>Net</th>
              <th>Res</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3 + teams[0].players.length + teams[1].players.length + 4}
                style={{ background: 'var(--grey-100)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--grey-600)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label} — {teams[0].name} vs {teams[1].name}
              </td>
            </tr>
            {rows.map(({ hole, holeScores, result, team0nets, team1nets }) => (
              <tr key={hole.number}>
                <td className="col-hole">{hole.number}</td>
                <td>{hole.par}</td>
                <td style={{ color: 'var(--grey-500)' }}>{hole.strokeIndex}</td>
                {teams[0].players.map((p, i) => (
                  <td key={i}>{holeScores?.team0?.[`player${i}gross`] ?? '—'}</td>
                ))}
                <td style={{ fontWeight: 600 }}>
                  {team0nets.some(n => n !== null) ? Math.min(...team0nets.filter(n => n !== null)) : '—'}
                </td>
                <ResultCell result={result} teamIndex={0} />
                {teams[1].players.map((p, i) => (
                  <td key={i}>{holeScores?.team1?.[`player${i}gross`] ?? '—'}</td>
                ))}
                <td style={{ fontWeight: 600 }}>
                  {team1nets.some(n => n !== null) ? Math.min(...team1nets.filter(n => n !== null)) : '—'}
                </td>
                <ResultCell result={result} teamIndex={1} />
              </tr>
            ))}
            <tr className="scorecard-totals">
              <td colSpan={3}>Total</td>
              {teams[0].players.map((_, i) => <td key={i} />)}
              <td />
              <td style={{ color: 'var(--green-dark)' }}>{team0pts}pts</td>
              {teams[1].players.map((_, i) => <td key={i} />)}
              <td />
              <td style={{ color: 'var(--green-dark)' }}>{team1pts}pts</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {renderHalfTable(front, 'Front 9')}
      {renderHalfTable(back, 'Back 9')}

      {/* Overall summary */}
      <div className="match-summary">
        <div className="summary-team">
          <div className="summary-team-name">{teams[0].name}</div>
          <div className="summary-points">{t0total}</div>
        </div>
        <div className="summary-vs">PTS</div>
        <div className="summary-team">
          <div className="summary-team-name">{teams[1].name}</div>
          <div className="summary-points">{t1total}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)', textAlign: 'center', marginTop: 8 }}>
        HCP shown as column header tooltip · W=Win, L=Loss, H=Halved
      </div>
    </div>
  );
}
