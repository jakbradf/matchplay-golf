import { getStrokesOnHole } from './scoring';

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

// Net points — the gross-score tier (bogey/par/birdie/eagle) plus a flat bonus of
// one point per handicap stroke received on the hole. Strokes add points on top of
// whatever tier the gross score already earned; they never promote a score into a
// higher tier (a net birdie still needs an actual gross birdie), and since gross
// points never go below 0, strokes can only add — never subtract. A literal ace
// stays a fixed 10 regardless of handicap.
export function getNetPoints(gross, handicap, hole) {
  if (gross == null) return null;
  if (gross === 1) return 10;
  const grossPoints = getStablefordPoints(gross, hole.par, false);
  const strokesReceived = getStrokesOnHole(handicap, hole.strokeIndex);
  return grossPoints + strokesReceived;
}

// Team score is every player's own points added together and divided by the
// number of players on the team — so a 3-player team is directly comparable
// to a 2-player team instead of getting a best-ball advantage from the extra player.
export function getTeamTotalPoints(allHoleScores, team, courseHoles, mode = 'gross') {
  let sum = 0;
  let maxHolesPlayed = 0;
  team.players.forEach((_, pi) => {
    const { total, holesPlayed } = getPlayerTotalPoints(allHoleScores, team, pi, courseHoles, mode);
    sum += total;
    maxHolesPlayed = Math.max(maxHolesPlayed, holesPlayed);
  });
  const playerCount = team.players.length || 1;
  return { total: sum / playerCount, holesCounted: maxHolesPlayed };
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

// Grid data for one player's expanded scorecard: two 9-hole halves, each with
// hole-number / par / gross score (coloured by to-par) / gross points / net points rows.
export function getTournamentPlayerHoleGrid(allHoleScores, team, playerIndex, courseHoles) {
  const player = team.players[playerIndex];

  const cellForHole = (hole) => {
    const teamScores = allHoleScores[String(hole.number)]?.[team.id];
    const gross = teamScores?.[`player${playerIndex}gross`];
    if (gross == null) return { gross: null, grossPts: null, netPts: null, diff: null };
    return {
      gross,
      grossPts: getGrossPoints(gross, hole),
      netPts: getNetPoints(gross, player.handicap, hole),
      diff: gross - hole.par,
    };
  };

  const half = (holes) => ({
    holeNumbers: holes.map((h) => h.number),
    pars: holes.map((h) => h.par),
    cells: holes.map(cellForHole),
    totalPar: holes.reduce((s, h) => s + h.par, 0),
    totalGross: holes.reduce((s, h) => {
      const c = cellForHole(h);
      return c.gross != null ? s + c.gross : s;
    }, 0),
    totalGrossPts: holes.reduce((s, h) => {
      const c = cellForHole(h);
      return c.grossPts != null ? s + c.grossPts : s;
    }, 0),
    totalNetPts: holes.reduce((s, h) => {
      const c = cellForHole(h);
      return c.netPts != null ? s + c.netPts : s;
    }, 0),
    anyScored: holes.some((h) => cellForHole(h).gross != null),
  });

  return {
    out: half(courseHoles.slice(0, 9)),
    in: half(courseHoles.slice(9, 18)),
  };
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
    };
  });

  return {
    playerGross: [...playerRows].sort((a, b) => b.grossPoints - a.grossPoints),
    playerNet: [...playerRows].sort((a, b) => b.netPoints - a.netPoints),
    teamGross: [...teamRows].sort((a, b) => b.grossPoints - a.grossPoints),
    teamNet: [...teamRows].sort((a, b) => b.netPoints - a.netPoints),
  };
}
