// GOLF MATCH mark: two settled-hole bars rising into a flagstick + pennant.
// Same shape that carries match state on the scoring screen (the hole strip),
// compressed into a signature. Geometry is proportional to `size` (S).
export function GolfMatchMark({ size = 28, primary = '#00a651', secondary = '#0e1a13', ground, radius = 0 }) {
  const S = size;
  const gap = 0.055 * S;
  const barW = 0.095 * S;
  const stickW = 0.059 * S;
  return (
    <div
      style={{
        width: S,
        height: S,
        borderRadius: radius,
        background: ground ?? 'transparent',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap,
        padding: `0 ${0.17 * S + gap}px ${0.2 * S}px ${gap}px`,
        flexShrink: 0,
      }}
    >
      <div style={{ width: barW, height: (0.52 * S * 9) / 18, borderRadius: barW / 3, background: secondary }} />
      <div style={{ width: barW, height: (0.52 * S * 13) / 18, borderRadius: barW / 3, background: secondary }} />
      <div style={{ position: 'relative', width: stickW, height: 0.52 * S, borderRadius: stickW / 2, background: primary }}>
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            width: 0.17 * S,
            height: 0.13 * S,
            background: primary,
            clipPath: 'polygon(0 0, 100% 46%, 0 92%)',
          }}
        />
      </div>
    </div>
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
