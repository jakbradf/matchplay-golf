import { useState } from 'react';
import { adjustTeamsForCourse } from '../utils/scoring';
import { getPlayerStats, getPlayerHoleGrid } from '../utils/individualStats';

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

export default function Scorecard({ scores, teams, course, onEndGame }) {
  const [tab, setTab] = useState('gross');
  const [openKey, setOpenKey] = useState(null);

  const adjTeams = adjustTeamsForCourse(teams, course);
  const rows = getPlayerStats(scores, adjTeams, course.holes, tab === 'net' ? 'net' : 'gross');

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
      <div className="gm-lb-tabs" style={{ marginTop: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`gm-lb-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--grey-600)', margin: '10px 0 0' }}>
        Fourball &middot; better ball &middot; {modeLabel} &middot; thru {maxThru}
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
                  <span className={`gm-lb-team-tag ${r.teamLabel.toLowerCase()}`}>{r.teamLabel}</span>
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

      {onEndGame && (
        <div style={{ marginTop: 16 }}>
          <button className="gm-lb-end-btn" onClick={onEndGame}>End game</button>
        </div>
      )}
    </div>
  );
}
