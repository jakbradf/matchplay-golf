// GOLF MATCH mark: two settled-hole bars rising into a flagstick + pennant.
// Same shape that carries match state on the scoring screen (the hole strip),
// compressed into a signature. Exact geometry from the master brand SVGs
// (100-unit design grid) — ground is white by default (the "mark-green" variant:
// ink bars, green pin); pass primary/secondary to reproduce the other variants
// (white-on-green, mint-on-dark, one-colour ink).
export function GolfMatchMark({ size = 28, primary = '#00a651', secondary = '#0e1a13' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="23.55 28 49.655 52"
      preserveAspectRatio="xMidYMid meet"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect x="23.55" y="54" width="9.5" height="26" rx="3.1666666666666665" fill={secondary} />
      <rect x="38.55" y="42.44444444444444" width="9.5" height="37.55555555555556" rx="3.1666666666666665" fill={secondary} />
      <rect x="53.55" y="28" width="5.9" height="52" rx="2.95" fill={primary} />
      <path d="M56.205 28 L73.205 33.94 L56.205 39.88 Z" fill={primary} />
    </svg>
  );
}

// "GOLF" / "MATCH" stacked wordmark. Green drops to the deeper shade below 24px for contrast.
export function GolfMatchWordmark({ size = 30, ink = '#0e1a13', green = '#00a651', greenDeep = '#00803f' }) {
  const accent = size >= 24 ? green : greenDeep;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.06em' }}>
      <span style={{ font: `600 ${size}px/0.98 'Inter', sans-serif`, letterSpacing: '0.02em', color: ink }}>GOLF</span>
      <span style={{ font: `600 ${size}px/0.98 'Inter', sans-serif`, letterSpacing: '0.02em', color: accent }}>MATCH</span>
    </div>
  );
}

// Mark + wordmark side by side (the "primary lockup").
export function GolfMatchLogo({ markSize = 64, wordSize = 30, gap = 16, ...markProps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <GolfMatchMark size={markSize} {...markProps} />
      <GolfMatchWordmark size={wordSize} />
    </div>
  );
}
