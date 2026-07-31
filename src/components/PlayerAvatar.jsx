const PALETTE = ['#1a5c38', '#2d7a50', '#0e4a8c', '#7a3a00', '#5c1a6b', '#8c2a2a'];

function colorForName(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PlayerAvatar({ name, photoURL, size = 32 }) {
  const fontSize = Math.round(size * 0.4);

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name ?? ''}
        referrerPolicy="no-referrer"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1.5px solid rgba(0,0,0,0.08)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colorForName(name),
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {initials(name)}
    </div>
  );
}
