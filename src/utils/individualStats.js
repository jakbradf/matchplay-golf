import { getStrokesOnHole, getHoleResultsSeries } from './scoring';

// Each player's own net score for one hole (full course handicap, not matchplay-relative).
export function getIndividualNet(gross, handicap, strokeIndex) {
  if (gross == null) return null;
  return gross - getStrokesOnHole(handicap, strokeIndex);
}

// Per-player standings row: gross/net totals, to-par, holes played, and the running
// team match differential (their team's "n up"/"n down" as of the last played hole).
export function getPlayerStats(allHoleScores, teams, courseHoles, mode = 'gross') {
  const results = getHoleResultsSeries(allHoleScores, teams, courseHoles);
  const rows = [];

  teams.forEach((team, teamIndex) => {
    team.players.forEach((player, playerIndex) => {
      let gross = 0, net = 0, par = 0, thru = 0, up = 0;
      courseHoles.forEach((hole, hi) => {
        const holeScores = allHoleScores[String(hole.number)]?.[`team${teamIndex}`];
        const g = holeScores?.[`player${playerIndex}gross`];
        if (g != null) {
          gross += g;
          net += getIndividualNet(g, player.handicap, hole.strokeIndex);
          par += hole.par;
          thru++;
        }
        const r = results[hi];
        if (r != null) up += teamIndex === 0 ? r : -r;
      });
      const total = mode === 'net' ? net : gross;
      rows.push({
        player,
        teamIndex,
        playerIndex,
        teamLabel: teamIndex === 0 ? 'A' : 'B',
        gross,
        net,
        par,
        thru,
        toPar: thru > 0 ? total - par : 0,
        up,
      });
    });
  });

  return rows;
}

// Grid data for one player's expanded scorecard: two 9-hole halves, each with
// hole-number / par / score (coloured by gross-to-par) / net rows.
export function getPlayerHoleGrid(allHoleScores, teams, teamIndex, player, playerIndex, courseHoles) {
  const cellForHole = (hole) => {
    const holeScores = allHoleScores[String(hole.number)]?.[`team${teamIndex}`];
    const gross = holeScores?.[`player${playerIndex}gross`];
    if (gross == null) return { gross: null, net: null, diff: null };
    return {
      gross,
      net: getIndividualNet(gross, player.handicap, hole.strokeIndex),
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
    totalNet: holes.reduce((s, h) => {
      const c = cellForHole(h);
      return c.net != null ? s + c.net : s;
    }, 0),
    anyScored: holes.some((h) => cellForHole(h).gross != null),
  });

  return {
    out: half(courseHoles.slice(0, 9)),
    in: half(courseHoles.slice(9, 18)),
  };
}
