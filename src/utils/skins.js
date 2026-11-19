import { getStrokesOnHole } from './scoring';

export const DEFAULT_SKIN_VALUE = 10;
export const DEFAULT_SKIN_CURRENCY = 'kr';

// Every player in the game as an individual, with a pointer back to their team slot.
export function getSkinsPlayers(teams) {
  return teams.flatMap((team, ti) =>
    team.players.map((p, pi) => ({ ...p, ti, pi, teamName: team.name }))
  );
}

// Net score for one player on one hole, strokes given off the lowest handicap in the game.
function playerNet(holeScores, player, hole, minHandicap) {
  const gross = holeScores?.[`team${player.ti}`]?.[`player${player.pi}gross`];
  if (gross == null) return null;
  return gross - getStrokesOnHole(Math.max(0, player.handicap - minHandicap), hole.strokeIndex);
}

/*
 * Skins: every player puts one skin (`value`) into the pot on every hole.
 * Lowest net score on the hole takes the pot. A tie for lowest carries the pot
 * to the next hole.
 *
 * "Worth" is what the winner gains from the others:
 *   skins on the hole × (players − 1) × value
 * e.g. 4 players at 10 kr: 30 kr on a fresh hole, 60 kr after one carry.
 *
 * Holes are resolved in order. If a hole is missing a score, every hole after it
 * stays 'pending' because its carry-in isn't known yet.
 *
 * teams must already be course-adjusted (adjustTeamsForCourse).
 */
export function computeSkins(allHoleScores, teams, courseHoles, value = DEFAULT_SKIN_VALUE) {
  const players = getSkinsPlayers(teams);
  const n = players.length;
  const minHandicap = Math.min(...players.map((p) => p.handicap));
  const perSkinGain = value * Math.max(0, n - 1);

  const totals = players.map((p) => ({ player: p, skins: 0, holesWon: 0, net: 0 }));
  const holes = [];
  let carry = 0;
  let blocked = false;

  courseHoles.forEach((hole) => {
    const skinsOnHole = carry + 1;
    const base = {
      hole,
      skinsOnHole,
      carriedIn: carry,
      worth: skinsOnHole * perSkinGain,
    };

    if (blocked) {
      holes.push({ ...base, status: 'pending', nets: null, winner: null });
      return;
    }

    const holeScores = allHoleScores[String(hole.number)];
    const nets = players.map((p) => playerNet(holeScores, p, hole, minHandicap));

    if (nets.some((x) => x == null)) {
      blocked = true;
      holes.push({ ...base, status: 'incomplete', nets, winner: null });
      return;
    }

    const best = Math.min(...nets);
    const leaders = nets.reduce((acc, x, i) => (x === best ? [...acc, i] : acc), []);

    if (leaders.length > 1) {
      carry = skinsOnHole;
      holes.push({ ...base, status: 'carry', nets, winner: null, tiedPlayers: leaders.map((i) => players[i]) });
      return;
    }

    const w = leaders[0];
    totals.forEach((t, i) => {
      if (i === w) {
        t.skins += skinsOnHole;
        t.holesWon += 1;
        t.net += skinsOnHole * perSkinGain;
      } else {
        t.net -= skinsOnHole * value;
      }
    });
    carry = 0;
    holes.push({ ...base, status: 'won', nets, winner: players[w], winnerIdx: w });
  });

  const lastResolved = [...holes].reverse().find((h) => h.status === 'won' || h.status === 'carry');
  // Pot still riding after the last scored hole (e.g. 18 halved, or carry into hidden holes)
  const openCarry = lastResolved?.status === 'carry' ? lastResolved.skinsOnHole : 0;

  return {
    players,
    holes,
    totals,
    openCarry,
    openCarryWorth: openCarry * perSkinGain,
    complete: holes.length > 0 && holes.every((h) => h.status === 'won' || h.status === 'carry'),
  };
}

// Preset currencies offered when setting up skins. Anything else is custom text.
export const SKIN_CURRENCIES = [
  { code: 'kr', label: 'kr' },
  { code: '€', label: 'Euro (€)' },
  { code: '$', label: 'Dollar ($)' },
];

// Symbols written in front of the amount (€10, $10); everything else goes after (10 kr).
const PREFIX_SYMBOLS = ['€', '$', '£'];

export function formatMoney(amount, currency = DEFAULT_SKIN_CURRENCY) {
  const rounded = Math.round(amount * 100) / 100;
  const num = rounded.toLocaleString('nb-NO');
  const cur = (currency || '').trim();
  if (!cur) return num;
  return PREFIX_SYMBOLS.includes(cur) ? `${cur}${num}` : `${num} ${cur}`;
}

export function formatSignedMoney(amount, currency = DEFAULT_SKIN_CURRENCY) {
  if (amount === 0) return formatMoney(0, currency);
  return `${amount > 0 ? '+' : '−'}${formatMoney(Math.abs(amount), currency)}`;
}
