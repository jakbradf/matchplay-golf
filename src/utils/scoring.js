// Calculate strokes a player receives on a hole
// For handicaps > 18: holes where SI <= (handicap - 18) get 2 strokes,
// holes where SI <= handicap get 1 stroke, rest get 0.
export function getStrokesOnHole(handicap, strokeIndex) {
  if (handicap <= 0) return 0;
  // Check 2-stroke holes first (only possible when handicap > 18)
  if (handicap > 18 && strokeIndex <= handicap - 18) return 2;
  if (strokeIndex <= handicap) return 1;
  return 0;
}

// Calculate net score
export function getNetScore(gross, handicap, strokeIndex) {
  return gross - getStrokesOnHole(handicap, strokeIndex);
}

// Get best net score from a team on a hole
export function getTeamBestNet(teamScores, teamPlayers, hole) {
  if (!teamScores || !teamPlayers) return Infinity;
  const nets = teamPlayers.map((player, i) => {
    const gross = teamScores[`player${i}gross`];
    if (gross === null || gross === undefined) return Infinity;
    return getNetScore(gross, player.handicap, hole.strokeIndex);
  });
  return Math.min(...nets);
}

// Determine hole result: returns { team0points, team1points, result }
// result: 'team0' | 'team1' | 'halved'
export function getHoleResult(holeScores, teams, hole) {
  if (!holeScores) return null;

  const net0 = getTeamBestNet(holeScores.team0, teams[0].players, hole);
  const net1 = getTeamBestNet(holeScores.team1, teams[1].players, hole);

  if (net0 === Infinity || net1 === Infinity) return null; // incomplete

  const closest0 = holeScores.team0?.closestToPin;
  const closest1 = holeScores.team1?.closestToPin;

  if (hole.isParThree && (closest0 || closest1)) {
    const strokeWinner = net0 < net1 ? 0 : net1 < net0 ? 1 : null;
    const closestWinner = closest0 ? 0 : 1;

    if (strokeWinner === closestWinner) {
      // Same team wins both: 2 points
      return {
        team0points: strokeWinner === 0 ? 2 : 0,
        team1points: strokeWinner === 1 ? 2 : 0,
        result: `team${strokeWinner}`,
      };
    } else if (strokeWinner === null) {
      // Tied scores, one team closest: 1 point for closest team
      return {
        team0points: closestWinner === 0 ? 1 : 0,
        team1points: closestWinner === 1 ? 1 : 0,
        result: `team${closestWinner}`,
      };
    } else {
      // Different teams: halved
      return { team0points: 0, team1points: 0, result: 'halved' };
    }
  }

  // Regular hole
  if (net0 < net1) return { team0points: 1, team1points: 0, result: 'team0' };
  if (net1 < net0) return { team0points: 0, team1points: 1, result: 'team1' };
  return { team0points: 0, team1points: 0, result: 'halved' };
}

// Get running match score (like "3 UP" or "ALL SQUARE")
export function getMatchStatus(cumulativeScores, teamNames) {
  const diff = cumulativeScores[0] - cumulativeScores[1];
  if (diff === 0) return 'ALL SQUARE';
  const leading = diff > 0 ? teamNames[0] : teamNames[1];
  return `${leading} ${Math.abs(diff)} UP`;
}

// Compute cumulative points for all completed holes
export function computeMatchScore(allHoleScores, teams, courseHoles) {
  let team0total = 0;
  let team1total = 0;

  courseHoles.forEach((hole) => {
    const holeScores = allHoleScores[String(hole.number)];
    const result = getHoleResult(holeScores, teams, hole);
    if (result) {
      team0total += result.team0points;
      team1total += result.team1points;
    }
  });

  return [team0total, team1total];
}

// Get detailed per-hole results for the scorecard
export function buildScorecardData(allHoleScores, teams, courseHoles) {
  return courseHoles.map((hole) => {
    const holeScores = allHoleScores[String(hole.number)];
    const result = getHoleResult(holeScores, teams, hole);

    const team0nets = teams[0].players.map((p, i) => {
      const gross = holeScores?.team0?.[`player${i}gross`];
      if (gross == null) return null;
      return getNetScore(gross, p.handicap, hole.strokeIndex);
    });

    const team1nets = teams[1].players.map((p, i) => {
      const gross = holeScores?.team1?.[`player${i}gross`];
      if (gross == null) return null;
      return getNetScore(gross, p.handicap, hole.strokeIndex);
    });

    return {
      hole,
      holeScores,
      result,
      team0nets,
      team1nets,
    };
  });
}
