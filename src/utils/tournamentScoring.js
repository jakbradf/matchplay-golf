import { getNetScore } from './scoring';

export const MIN_CONTRIBUTION_HOLES = 3;

// Modified Stableford points for a score relative to par.
// A literal ace (1 stroke, any hole) always scores 10, regardless of par.
export function getStablefordPoints(strokes, par, isAce = false) {
  if (isAce) return 10;
  const diff = strokes - par;
  if (diff <= -2) return 6; // eagle or better (albatross falls back to eagle tier)
  if (diff === -1) return 4; // birdie
  if (diff === 0) return 2; // par
  if (diff === 1) return 1; // bogey
  return 0; // double bogey or worse
}

// Gross points — no handicap applied.
export function getGrossPoints(gross, hole) {
  if (gross == null) return null;
  return getStablefordPoints(gross, hole.par, gross === 1);
}

// Net points — standard net Stableford: the player's own course handicap
// allocates strokes per hole (by stroke index), then the same points ladder
// applies to the net score. A literal ace is still gross===1, not net===1.
export function getNetPoints(gross, handicap, hole) {
  if (gross == null) return null;
  const net = getNetScore(gross, handicap, hole.strokeIndex);
  return getStablefordPoints(net, hole.par, gross === 1);
}

// Best-of-two-players points for a team on one hole ("fourball" — better ball).
// mode: 'gross' | 'net'. Returns { points, contributors: [playerIndex, ...] }.
// contributors lists every player whose score equalled the best (ties count for both).
export function getTeamHolePoints(teamScores, teamPlayers, hole, mode = 'gross') {
  if (!teamScores) return { points: null, contributors: [] };

  const values = teamPlayers.map((p, i) => {
    const gross = teamScores[`player${i}gross`];
    if (gross == null) return null;
    return mode === 'net' ? getNetPoints(gross, p.handicap, hole) : getGrossPoints(gross, hole);
  });

  const known = values.filter(v => v != null);
  if (known.length === 0) return { points: null, contributors: [] };

  const best = Math.max(...known);
  const contributors = values.reduce((acc, v, i) => (v === best ? [...acc, i] : acc), []);
  return { points: best, contributors };
}

// Sum a team's best-ball points across the round.
export function getTeamTotalPoints(allHoleScores, team, courseHoles, mode = 'gross') {
  let total = 0;
  let holesCounted = 0;
  courseHoles.forEach((hole) => {
    const teamScores = allHoleScores[String(hole.number)]?.[team.id];
    const { points } = getTeamHolePoints(teamScores, team.players, hole, mode);
    if (points != null) {
      total += points;
      holesCounted++;
    }
  });
  return { total, holesCounted };
}

// How many holes each team player's score counted as the team's best (per mode).
export function computeContributions(allHoleScores, team, courseHoles, mode = 'gross') {
  const counts = team.players.map(() => 0);
  courseHoles.forEach((hole) => {
    const teamScores = allHoleScores[String(hole.number)]?.[team.id];
    const { contributors } = getTeamHolePoints(teamScores, team.players, hole, mode);
    contributors.forEach((i) => counts[i]++);
  });
  return counts;
}

// Sum one player's own points across the round (not best-ball — every hole they played).
export function getPlayerTotalPoints(allHoleScores, team, playerIndex, courseHoles, mode = 'gross') {
  let total = 0;
  let holesPlayed = 0;
  const player = team.players[playerIndex];
  courseHoles.forEach((hole) => {
    const teamScores = allHoleScores[String(hole.number)]?.[team.id];
    const gross = teamScores?.[`player${playerIndex}gross`];
    if (gross == null) return;
    total += mode === 'net' ? getNetPoints(gross, player.handicap, hole) : getGrossPoints(gross, hole);
    holesPlayed++;
  });
  return { total, holesPlayed };
}

// Build all four leaderboards. `teams` must already have course-handicap-adjusted
// player.handicap values (see adjustTeamsForCourse in scoring.js) and each team a stable `id`.
export function buildLeaderboards(teams, allHoleScores, courseHoles) {
  const playerRows = [];
  teams.forEach((team) => {
    team.players.forEach((p, pi) => {
      const gross = getPlayerTotalPoints(allHoleScores, team, pi, courseHoles, 'gross');
      const net = getPlayerTotalPoints(allHoleScores, team, pi, courseHoles, 'net');
      playerRows.push({
        teamId: team.id,
        teamName: team.name,
        playerIndex: pi,
        name: p.name,
        photoURL: p.photoURL ?? null,
        handicap: p.handicap,
        grossPoints: gross.total,
        netPoints: net.total,
        holesPlayed: gross.holesPlayed,
      });
    });
  });

  const teamRows = teams.map((team) => {
    const gross = getTeamTotalPoints(allHoleScores, team, courseHoles, 'gross');
    const net = getTeamTotalPoints(allHoleScores, team, courseHoles, 'net');
    return {
      teamId: team.id,
      teamName: team.name,
      players: team.players,
      grossPoints: gross.total,
      netPoints: net.total,
      holesCounted: gross.holesCounted,
      grossContrib: computeContributions(allHoleScores, team, courseHoles, 'gross'),
      netContrib: computeContributions(allHoleScores, team, courseHoles, 'net'),
    };
  });

  return {
    playerGross: [...playerRows].sort((a, b) => b.grossPoints - a.grossPoints),
    playerNet: [...playerRows].sort((a, b) => b.netPoints - a.netPoints),
    teamGross: [...teamRows].sort((a, b) => b.grossPoints - a.grossPoints),
    teamNet: [...teamRows].sort((a, b) => b.netPoints - a.netPoints),
  };
}
