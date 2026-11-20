import { getStrokesOnHole } from './scoring';

export const DEFAULT_SKIN_VALUE = 10;
export const DEFAULT_SKIN_CURRENCY = 'kr';

export const GAME_TYPES = {
  MATCHPLAY: 'matchplay',
  SKINS: 'skins',
};

export function getGameType(game) {
  return game?.gameType === GAME_TYPES.SKINS ? GAME_TYPES.SKINS : GAME_TYPES.MATCHPLAY;
}

// Skins settings for a game: a skins game always has them, a matchplay game only if the side game is on.
export function getSkinsSettings(game) {
  if (!game) return null;
  if (getGameType(game) === GAME_TYPES.SKINS) {
    return {
      value: game.skins?.value ?? DEFAULT_SKIN_VALUE,
      currency: game.skins?.currency ?? DEFAULT_SKIN_CURRENCY,
    };
  }
  return game.skins?.enabled ? { value: game.skins.value, currency: game.skins.currency } : null;
}

/*
 * A skins "unit" is whoever competes for the pot: one player (side game in matchplay)
 * or one team (skins game, best net in the team counts).
 * Each unit: { key, name, sub, members: [{ ti, pi, handicap, name }] }
 */
export function skinsUnitsFromPlayers(teams) {
  return teams.flatMap((team, ti) =>
    team.players.map((p, pi) => ({
      key: `p${ti}-${pi}`,
      name: p.name,
      sub: null,
      members: [{ ti, pi, handicap: p.handicap, name: p.name }],
    }))
  );
}

export function skinsUnitsFromTeams(teams) {
  return teams.map((team, ti) => {
    const solo = team.players.length === 1;
    return {
      key: `t${ti}`,
      name: solo ? team.players[0].name : team.name,
      sub: solo ? null : team.players.map((p) => p.name).join(' & '),
      members: team.players.map((p, pi) => ({ ti, pi, handicap: p.handicap, name: p.name })),
    };
  });
}

// Units for a game, depending on its type.
export function getSkinsUnits(game, adjTeams) {
  return getGameType(game) === GAME_TYPES.SKINS
    ? skinsUnitsFromTeams(adjTeams)
    : skinsUnitsFromPlayers(adjTeams);
}

// Display name for a team in a skins game (solo teams show the player's name).
export function skinsTeamLabel(team) {
  return team.players.length === 1 ? team.players[0].name : team.name;
}

/*
 * Every unit puts one skin (`value`) into the pot on every hole.
 * Lowest net score on the hole takes the pot. A tie for lowest carries the pot
 * to the next hole. For a team, its best net counts (needs every member's score).
 *
 * "Worth" is what the winner gains from the others:
 *   skins on the hole × (units − 1) × value
 * e.g. 4 units at 10 kr: 30 kr on a fresh hole, 60 kr after one carry.
 *
 * Holes are resolved in order. If a hole is missing a score, every hole after it
 * stays 'pending' because its carry-in isn't known yet.
 *
 * Strokes are given off the lowest handicap among all players.
 * Handicaps must already be course-adjusted (adjustTeamsForCourse).
 */
export function computeSkins(allHoleScores, units, courseHoles, value = DEFAULT_SKIN_VALUE) {
  const n = units.length;
  const allMembers = units.flatMap((u) => u.members);
  const minHandicap = Math.min(...allMembers.map((m) => m.handicap));
  const perSkinGain = value * Math.max(0, n - 1);

  const memberNet = (holeScores, m, hole) => {
    const gross = holeScores?.[`team${m.ti}`]?.[`player${m.pi}gross`];
    if (gross == null) return null;
    return gross - getStrokesOnHole(Math.max(0, m.handicap - minHandicap), hole.strokeIndex);
  };

  const unitNet = (holeScores, u, hole) => {
    const nets = u.members.map((m) => memberNet(holeScores, m, hole));
    if (nets.some((x) => x == null)) return null;
    return Math.min(...nets);
  };

  const totals = units.map((u) => ({ unit: u, skins: 0, holesWon: 0, net: 0 }));
  const holes = [];
  let carry = 0;
  let blocked = false;

  courseHoles.forEach((hole) => {
    const skinsOnHole = carry + 1;
    const base = { hole, skinsOnHole, carriedIn: carry, worth: skinsOnHole * perSkinGain };

    if (blocked) {
      holes.push({ ...base, status: 'pending', nets: null, winner: null });
      return;
    }

    const holeScores = allHoleScores[String(hole.number)];
    const nets = units.map((u) => unitNet(holeScores, u, hole));

    if (nets.some((x) => x == null)) {
      blocked = true;
      holes.push({ ...base, status: 'incomplete', nets, winner: null });
      return;
    }

    const best = Math.min(...nets);
    const leaders = nets.reduce((acc, x, i) => (x === best ? [...acc, i] : acc), []);

    if (leaders.length > 1) {
      carry = skinsOnHole;
      holes.push({ ...base, status: 'carry', nets, best, winner: null, tied: leaders.map((i) => units[i]) });
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
    holes.push({ ...base, status: 'won', nets, best, winner: units[w], winnerIdx: w });
  });

  const lastResolved = [...holes].reverse().find((h) => h.status === 'won' || h.status === 'carry');
  // Pot still riding after the last scored hole (e.g. 18 halved, or carry into hidden holes)
  const openCarry = lastResolved?.status === 'carry' ? lastResolved.skinsOnHole : 0;

  return {
    units,
    holes,
    totals,
    openCarry,
    openCarryWorth: openCarry * perSkinGain,
    minHandicap,
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

/*
 * Who pays whom, with as few payments as possible: repeatedly match the
 * biggest loser with the biggest winner. totals = computeSkins().totals.
 */
export function settleUp(totals) {
  const cents = (x) => Math.round(x * 100);
  const debtors = totals.filter((t) => t.net < 0).map((t) => ({ unit: t.unit, left: -cents(t.net) }));
  const creditors = totals.filter((t) => t.net > 0).map((t) => ({ unit: t.unit, left: cents(t.net) }));
  const payments = [];

  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.left - a.left);
    creditors.sort((a, b) => b.left - a.left);
    const d = debtors[0];
    const c = creditors[0];
    const amt = Math.min(d.left, c.left);
    payments.push({ from: d.unit, to: c.unit, amount: amt / 100 });
    d.left -= amt;
    c.left -= amt;
    if (d.left === 0) debtors.shift();
    if (c.left === 0) creditors.shift();
  }
  return payments;
}
