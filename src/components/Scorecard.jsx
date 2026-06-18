import { buildScorecardData, computeMatchScore, getMatchplayStrokes } from '../utils/scoring';

function ResultCell({ result, teamIndex }) {
  if (!result) return <td className="result-halved">-</td>;
  if (result.result === 'halved') return <td className="result-halved">H</td>;
  if (result.result === `team${teamIndex}`) {
    return <td className={`result-win${teamIndex}`}>W</td>;
  }
  return <td className={`result-win${1 - teamIndex}`}>L</td>;
}

function GrossCell({ gross, hasMatchplayStroke }) {
  if (gross == null) return <td>—</td>;
  return (
    <td>
      {hasMatchplayStroke
        ? <span className="gross-matchplay-circle">{gross}</span>
        : gross}
    </td>
  );
}

export default function Scorecard({ scores, teams, course }) {
  const data = buildScorecardData(scores, teams, course.holes);
  const [t0total, t1total] = computeMatchScore(scores, teams, course.holes);

  const allPlayers = [...teams[0].players, ...teams[1].players];
  const minHandicap = Math.min(...allPlayers.map(p => p.handicap));

  const front = data.filter(d => d.hole.number <= 9);
  const back = data.filter(d => d.hole.number >= 10);

  const initials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase();

  const renderHalfTable = (rows, label) => {
    const team0pts = rows.reduce((s, d) => s + (d.result?.team0points || 0), 0);
    const team1pts = rows.reduce((s, d) => s + (d.result?.team1points || 0), 0);
    const team0extra = rows.reduce((s, d) => s + (d.holeScores?.team0?.extraPoints || 0), 0);
    const team1extra = rows.reduce((s, d) => s + (d.holeScores?.team1?.extraPoints || 0), 0);

    const team0GrossTotals = teams[0].players.map((_, i) => {
      const scored = rows.filter(({ holeScores }) => holeScores?.team0?.[`player${i}gross`] != null);
      if (!scored.length) return null;
      return scored.reduce((sum, { holeScores }) => sum + holeScores.team0[`player${i}gross`], 0);
    });
    const team1GrossTotals = teams[1].players.map((_, i) => {
      const scored = rows.filter(({ holeScores }) => holeScores?.team1?.[`player${i}gross`] != null);
      if (!scored.length) return null;
      return scored.reduce((sum, { holeScores }) => sum + holeScores.team1[`player${i}gross`], 0);
    });

    return (
      <div className="scorecard-wrapper">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th className="col-fixed">H</th>
              <th className="col-fixed">Par</th>
              <th className="col-fixed">SI</th>
              {teams[0].players.map((p, i) => (
                <th key={i} className="col-player" title={`${p.name} — HCP ${p.handicap}`}>
                  {initials(p.name)}
                </th>
              ))}
              <th className="col-fixed">Net</th>
              <th className="col-fixed">Res</th>
              {teams[1].players.map((p, i) => (
                <th key={i} className="col-player" title={`${p.name} — HCP ${p.handicap}`}>
                  {initials(p.name)}
                </th>
              ))}
              <th className="col-fixed">Net</th>
              <th className="col-fixed">Res</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={3 + teams[0].players.length + teams[1].players.length + 4}
                className="scorecard-section-header"
              >
                {label} — {teams[0].name} vs {teams[1].name}
              </td>
            </tr>
            {rows.map(({ hole, holeScores, result, team0nets, team1nets }) => (
              <tr key={hole.number}>
                <td className="col-hole">{hole.number}</td>
                <td>{hole.par}</td>
                <td className="col-si">{hole.strokeIndex}</td>
                {teams[0].players.map((p, i) => (
                  <GrossCell
                    key={i}
                    gross={holeScores?.team0?.[`player${i}gross`] ?? null}
                    hasMatchplayStroke={getMatchplayStrokes(p.handicap, minHandicap, hole.strokeIndex) > 0}
                  />
                ))}
                <td className="col-net">
                  {team0nets.some(n => n !== null) ? Math.min(...team0nets.filter(n => n !== null)) : '—'}
                </td>
                <ResultCell result={result} teamIndex={0} />
                {teams[1].players.map((p, i) => (
                  <GrossCell
                    key={i}
                    gross={holeScores?.team1?.[`player${i}gross`] ?? null}
                    hasMatchplayStroke={getMatchplayStrokes(p.handicap, minHandicap, hole.strokeIndex) > 0}
                  />
                ))}
                <td className="col-net">
                  {team1nets.some(n => n !== null) ? Math.min(...team1nets.filter(n => n !== null)) : '—'}
                </td>
                <ResultCell result={result} teamIndex={1} />
              </tr>
            ))}
            <tr className="scorecard-totals">
              <td colSpan={3}>Total</td>
              {team0GrossTotals.map((total, i) => (
                <td key={i}>{total ?? '—'}</td>
              ))}
              <td />
              <td style={{ color: 'var(--green-dark)' }}>
                {team0pts}pts{team0extra > 0 ? ` +${team0extra}⭐` : ''}
              </td>
              {team1GrossTotals.map((total, i) => (
                <td key={i}>{total ?? '—'}</td>
              ))}
              <td />
              <td style={{ color: 'var(--green-dark)' }}>
                {team1pts}pts{team1extra > 0 ? ` +${team1extra}⭐` : ''}
              </td>
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
        ○ = matchplay stroke vs best player · W=Win, L=Loss, H=Halved
      </div>
    </div>
  );
}
