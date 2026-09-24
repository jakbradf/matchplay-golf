import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateGame } from '../firebase/gameService';
import PlayerAvatar from './PlayerAvatar';

// Lets a signed-in user link their account to a player slot in a game
// (or release one they previously claimed). Used in both the game lobby
// and the join flow, so it works whether the game is still in the lobby
// or already active.
export default function PlayerClaimList({ game, gameCode, showHint = true, showInviteLinks = false, invitedTeamIndex = null }) {
  const { user } = useAuth();
  const [claimingKey, setClaimingKey] = useState(null);

  const myClaimedKey = (() => {
    for (let t = 0; t < game.teams.length; t++) {
      for (let p = 0; p < game.teams[t].players.length; p++) {
        if (game.teams[t].players[p].uid === user?.uid) return `t${t}p${p}`;
      }
    }
    return null;
  })();

  const claimPlayer = async (teamIdx, playerIdx) => {
    if (!user) return;
    const key = `t${teamIdx}p${playerIdx}`;
    setClaimingKey(key);
    try {
      await updateGame(gameCode, {
        teams: game.teams.map((team, t) => ({
          ...team,
          players: team.players.map((player, p) => {
            if (t === teamIdx && p === playerIdx) {
              return {
                ...player,
                uid: user.uid,
                name: user.displayName || player.name,
                photoURL: user.photoURL || null,
              };
            }
            if (player.uid === user.uid) {
              const { uid: _uid, ...rest } = player;
              return rest;
            }
            return player;
          }),
        })),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setClaimingKey(null);
    }
  };

  const unclaimPlayer = async (teamIdx, playerIdx) => {
    const key = `t${teamIdx}p${playerIdx}`;
    setClaimingKey(key);
    try {
      await updateGame(gameCode, {
        teams: game.teams.map((team, t) => ({
          ...team,
          players: team.players.map((player, p) => {
            if (t === teamIdx && p === playerIdx) {
              const { uid: _uid, ...rest } = player;
              return rest;
            }
            return player;
          }),
        })),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setClaimingKey(null);
    }
  };

  return (
    <>
      {showHint && user && (
        <p className="lobby-claim-hint">
          Tap <strong>Claim</strong> next to your name to link your profile.
        </p>
      )}

      {game.teams.map((team, ti) => {
        const inviteUrl = `${window.location.origin}/join?code=${gameCode}&team=${ti}`;
        return (
          <div className={`card mt-8${ti === invitedTeamIndex ? ' invited-team-card' : ''}`} key={ti}>
            <p className="section-title-sm">
              {team.name}
              {ti === invitedTeamIndex && <span className="invited-badge">You&rsquo;re invited</span>}
            </p>
            <ul className="players-list">
              {team.players.map((p, pi) => {
                const key = `t${ti}p${pi}`;
                const isMine = p.uid === user?.uid;
                const busy = claimingKey === key;
                return (
                  <li key={pi} className="player-item player-item-lobby">
                    <PlayerAvatar name={p.name} photoURL={p.photoURL} size={36} />
                    <div className="player-item-info">
                      <span>{p.name}{isMine && <span className="player-claimed-you">You</span>}</span>
                      <span className="player-hcp">HCP {p.handicap}</span>
                    </div>
                    {user && !p.uid && !myClaimedKey && (
                      <button
                        className="player-claim-btn"
                        onClick={() => claimPlayer(ti, pi)}
                        disabled={busy}
                      >
                        {busy ? '…' : 'Claim'}
                      </button>
                    )}
                    {isMine && (
                      <button
                        className="player-unclaim-btn"
                        onClick={() => unclaimPlayer(ti, pi)}
                        disabled={busy}
                      >
                        {busy ? '…' : 'Unclaim'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {showInviteLinks && (
              <div className="mt-8">
                <p style={{ fontSize: '0.75rem', color: 'var(--grey-600)', marginBottom: 4 }}>
                  Invite link for {team.name}
                </p>
                <div className="share-link">
                  <span className="share-link-text">{inviteUrl}</span>
                  <button
                    className="share-link-copy"
                    onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
