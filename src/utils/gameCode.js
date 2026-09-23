export function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// A 4-digit PIN required to end a tournament — guards against an accidental tap.
// Fixed to '1337' for now instead of randomizing per tournament.
export function generatePin() {
  return '1337';
}
