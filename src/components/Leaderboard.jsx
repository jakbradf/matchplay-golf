import { useState } from 'react';
import { adjustTeamsForCourse } from '../utils/scoring';
import { getPlayerStats, getPlayerHoleGrid } from '../utils/individualStats';
import { formatMoney, formatSignedMoney, settleUp } from '../utils/skins';

const TABS = [
  { key: 'gross', label: 'Gross' },
  { key: 'net', label: 'Net' },
  { key: 'match', label: 'Match' },
];

function fmtToPar(d) {
  if (d === 0) return 'E';
  return d > 0 ? `+${d}` : String(d);
}

function fmtUp(u) {
  if (u === 0) return 'AS';
  return `${Math.abs(u)} ${u > 0 ? 'up' : 'dn'}`;
}

function scoreCellStyle(diff) {
  if (diff == null) return { background: 'transparent', color: '#b9c6bd' };
  if (diff < 0) return { background: '#0a8f4d', color: '#ffffff' };
  if (diff === 1) return { background: '#10429b', color: '#ffffff' };
  if (diff > 1) return { background: '#c8332c', color: '#ffffff' };
  return { background: 'transparent', color: '#0e1a13' };
}

function HalfGrid({ half, label }) {
  return (
    <div className="gm-lb-half">
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">{label}</div>
        {half.holeNumbers.map((n) => <div key={n} className="gm-lb-grid-num">{n}</div>)}
        <div className="gm-lb-grid-total strong">Tot</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">par</div>
        {half.pars.map((p, i) => <div key={i} className="gm-lb-grid-num">{p}</div>)}
        <div className="gm-lb-grid-total">{half.totalPar}</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">score</div>
        {half.cells.map((c, i) => (
          <div key={i} className={`gm-lb-cell${c.gross == null ? ' empty' : ''}`} style={scoreCellStyle(c.diff)}>
            {c.gross ?? ''}
          </div>
        ))}
        <div className="gm-lb-grid-total strong">{half.anyScored ? half.totalGross : ''}</div>
      </div>
      <div className="gm-lb-grid-row">
        <div className="gm-lb-grid-label">net</div>
        {half.cells.map((c, i) => <div key={i} className="gm-lb-grid-num">{c.net ?? ''}</div>)}
        <div className="gm-lb-grid-total">{half.anyScored ? half.totalNet : ''}</div>
      </div>
    </div>
  );
}

function MoneyTable({ skins }) {
  const { result, currency } = skins;
  const ranked = [...result.totals].sort((a, b) => b.net - a.net);
  const payments = settleUp(result.totals);
  const played = result.holes.filter((h) => h.status === 'won' || h.status === 'carry').length;

  return (
    <>
      <p style={{ fontSize: '0.78rem', color: 'var(--grey-600)', margin: '10px 0 0' }}>
        Skins &middot; money &middot; thru {played}
      </p>
      <div className="gm-lb-colheader">
        <span style={{ width: 16 }}>#</span>
        <span style={{ flex: 1 }}>{result.units.some((u) => u.sub) ? 'Team' : 'Player'}</span>
        <span style={{ width: 40, textAlign: 'right' }}>Skins</span>
        <span style={{ width: 76, textAlign: 'right' }}>Money</span>
      </div>
      {ranked.map((t) => {
        const rank = ranked.findIndex((x) => x.net === t.net) + 1;
        return (
          <div key={t.unit.key} className="gm-lb-row">
            <div className="gm-lb-row-main" style={{ cursor: 'default' }}>
              <span className="gm-lb-rank">{rank}</span>
              <div className="gm-lb-name-col">
                <div className="gm-lb-name-row"><span className="gm-lb-name">{t.unit.name}</span></div>
                <div className="gm-lb-meta">
                  {t.unit.sub ? `${t.unit.sub} · ` : ''}
                  {t.holesWon ? `${t.holesWon} hole${t.holesWon > 1 ? 's' : ''} won` : 'no holes won'}
                </div>
              </div>
              <span className="gm-lb-gross" style={{ width: 40 }}>{t.skins}</span>
              <span className={`skins-money${t.net > 0 ? ' up' : t.net < 0 ? ' down' : ''}`}>
                {formatSignedMoney(t.net, currency)}
              </span>
            </div>
          </div>
        );
      })}

      {result.openCarry > 0 && (
        <p className="skins-carry-note" style={{ margin: '10px 20px 0' }}>
          {formatMoney(result.openCarryWorth, currency)} still riding, not included above
        </p>
      )}

      <div className="skins-settle">
        <p className="section-title-sm" style={{ marginBottom: 6 }}>
          {result.complete ? 'Settle up' : 'Settle up so far'}
        </p>
        {payments.length === 0 ? (
          <p className="skins-settle-none">Nobody owes anything yet</p>
        ) : (
          payments.map((pm, i) => (
            <div key={i} className="skins-settle-row">
              <span><strong>{pm.from.name}</strong> pays <strong>{pm.to.name}</strong></span>
              <span className="skins-settle-amt">{formatMoney(pm.amount, currency)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function Leaderboard({ scores, teams, course, onEndGame, variant = 'matchplay', skins = null }) {
  const isSkins = variant === 'skins';
  const baseTabs = isSkins ? TABS.filter((t) => t.key !== 'match') : TABS;
  const tabs = !skins ? baseTabs
    : isSkins ? [{ key: 'money', label: 'Money' }, ...baseTabs]
    : [...baseTabs, { key: 'money', label: 'Skins' }];
  const [tab, setTab] = useState(isSkins && skins ? 'money' : 'gross');
  const [openKey, setOpenKey] = useState(null);

  const adjTeams = adjustTeamsForCourse(teams, course);
  const rows = getPlayerStats(scores, adjTeams, course.holes, tab === 'net' ? 'net' : 'gross', !isSkins);

  const sorted = [...rows].sort((a, b) => {
    if (tab === 'match') return b.up - a.up || a.toPar - b.toPar;
    return a.toPar - b.toPar || (tab === 'net' ? a.net - b.net : a.gross - b.gross);
  });

  const maxThru = Math.max(0, ...rows.map((r) => r.thru));
  const colA = tab === 'match' ? 'Pair' : (tab === 'net' ? 'Net' : 'Gross');
  const colB = tab === 'match' ? 'Holes' : 'To par';
  const modeLabel = tab === 'match' ? 'match play' : tab === 'net' ? 'net' : 'gross';

  return (
    <div>
      <div className="gm-lb-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`gm-lb-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'money' && skins ? <MoneyTable skins={skins} /> : <>
      <p style={{ fontSize: '0.78rem', color: 'var(--grey-600)', margin: '10px 0 0' }}>
        {isSkins ? 'Skins' : <>Fourball &middot; better ball</>} &middot; {modeLabel} &middot; thru {maxThru}
      </p>

      <div className="gm-lb-colheader">
        <span style={{ width: 16 }}>#</span>
        <span style={{ flex: 1 }}>Player</span>
        <span style={{ width: 42, textAlign: 'right' }}>{colA}</span>
        <span style={{ width: 46, textAlign: 'right' }}>{colB}</span>
        <span style={{ width: 34, textAlign: 'right' }}>Thru</span>
      </div>

      {sorted.map((r, i) => {
        const key = `${r.teamIndex}-${r.playerIndex}`;
        const open = openKey === key;
        const grid = open ? getPlayerHoleGrid(scores, adjTeams, r.teamIndex, r.player, r.playerIndex, course.holes) : null;
        const toParColor = tab === 'match'
          ? (r.up > 0 ? '#0a8f4d' : r.up === 0 ? '#0e1a13' : '#c8332c')
          : (r.toPar < 0 ? '#00803f' : r.toPar === 0 ? '#0e1a13' : '#5b6b62');

        return (
          <div key={key} className={`gm-lb-row${open ? ' open' : ''}`}>
            <div className="gm-lb-row-main" onClick={() => setOpenKey(open ? null : key)}>
              <span className="gm-lb-rank">{i + 1}</span>
              <div className="gm-lb-name-col">
                <div className="gm-lb-name-row">
                  <span className="gm-lb-name">{r.player.name}</span>
                  {!(isSkins && teams[r.teamIndex].players.length === 1) && (
                    <span className={`gm-lb-team-tag ${r.teamLabel.toLowerCase()}`}>{r.teamLabel}</span>
                  )}
                </div>
                <div className="gm-lb-meta">hcp {r.player.handicap} net {r.net}</div>
              </div>
              <span className="gm-lb-gross">{tab === 'match' ? r.teamLabel : (tab === 'net' ? r.net : r.gross)}</span>
              <span className="gm-lb-topar" style={{ color: toParColor }}>
                {tab === 'match' ? fmtUp(r.up) : fmtToPar(r.toPar)}
              </span>
              <span className="gm-lb-thru">{r.thru}</span>
            </div>

            {open && grid && (
              <div className="gm-lb-card">
                <HalfGrid half={grid.out} label="Out" />
                <HalfGrid half={grid.in} label="In" />
                <div className="gm-lb-foot">
                  <span className="gm-lb-foot-line">Par {r.par} &middot; gross {r.gross} &middot; net {r.net} &middot; position {i + 1}</span>
                  <span className="gm-lb-foot-hint">tap to close</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
      </>}

      {onEndGame && (
        <div style={{ marginTop: 16 }}>
          <button className="gm-lb-end-btn" onClick={onEndGame}>End game</button>
        </div>
      )}
    </div>
  );
}
