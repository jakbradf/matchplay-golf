import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadStoredPlayers, saveStoredPlayer } from '../firebase/playerService';
import { compressImageFile } from '../utils/image';
import PlayerAvatar from './PlayerAvatar';
import { CloseIcon, CameraIcon, SearchIcon } from './GolfIcon';

// A modal for filling one player slot in team setup: pick from the signed-in
// user's saved roster, or enter a new player (optionally with a photo) and
// save it to the roster for next time.
export default function StoredPlayerPicker({ currentName, currentHandicap, onSelect, onClose }) {
  const { user } = useAuth();
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [name, setName] = useState(currentName || '');
  const [handicap, setHandicap] = useState(currentHandicap || '');
  const [photoURL, setPhotoURL] = useState(null);
  const [saveToRoster, setSaveToRoster] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setLoadError('');
    loadStoredPlayers(user.uid)
      .then(setRoster)
      .catch((err) => {
        console.error(err);
        setLoadError('Could not load your saved players.');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = search.trim()
    ? roster.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : roster;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoURL(await compressImageFile(file));
    } catch (err) {
      console.error(err);
    }
  };

  const selectStored = (player) => {
    onSelect({ name: player.name, handicap: player.handicap, photoURL: player.photoURL || null });
    onClose();
  };

  const useNewPlayer = async () => {
    if (!name.trim()) return;
    const player = { name: name.trim(), handicap, photoURL };
    // Always apply the player to the game/tournament first — a roster-save
    // failure (e.g. a Firestore permissions issue) should never block that.
    onSelect(player);

    if (!saveToRoster || !user) {
      onClose();
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await saveStoredPlayer(player, user.uid);
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError(`Player was used, but saving to My Players failed: ${err?.message || 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <span>Choose Player</span>
          <button className="picker-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} color="var(--grey-600)" />
          </button>
        </div>

        {user && roster.length > 0 && (
          <div className="picker-search">
            <SearchIcon size={15} color="var(--grey-500)" />
            <input
              placeholder="Search saved players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {!user && (
          <p className="picker-empty">Sign in to save and reuse players across games.</p>
        )}

        {user && loading && <p className="picker-empty">Loading…</p>}

        {user && loadError && <p className="form-error">{loadError}</p>}

        {user && !loading && !loadError && (
          <div className="picker-list">
            {filtered.map((p) => (
              <button key={p.id} className="picker-row" onClick={() => selectStored(p)}>
                <PlayerAvatar name={p.name} photoURL={p.photoURL} size={36} />
                <div className="picker-row-info">
                  <span className="picker-row-name">{p.name}</span>
                  <span className="picker-row-hcp">HCP {p.handicap}</span>
                </div>
              </button>
            ))}
            {roster.length === 0 && <p className="picker-empty">No saved players yet.</p>}
          </div>
        )}

        <div className="picker-divider">or add new</div>

        <div className="picker-new-form">
          <button
            type="button"
            className="picker-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add photo"
          >
            {photoURL
              ? <PlayerAvatar name={name} photoURL={photoURL} size={56} />
              : <div className="picker-photo-placeholder"><CameraIcon size={20} color="var(--grey-500)" /></div>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />

          <div className="picker-new-fields">
            <input
              className="form-input form-input-sm"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
            <input
              className="form-input form-input-sm"
              placeholder="HCP Index"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value.replace(',', '.'))}
              type="text"
              inputMode="decimal"
            />
          </div>
        </div>

        {user && (
          <label className="picker-checkbox-row">
            <input
              type="checkbox"
              checked={saveToRoster}
              onChange={(e) => setSaveToRoster(e.target.checked)}
            />
            Save to My Players
          </label>
        )}

        {saveError && <p className="form-error">{saveError}</p>}

        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 12 }}
          disabled={!name.trim() || saving}
          onClick={useNewPlayer}
        >
          {saving ? 'Saving…' : saveError ? 'Retry Save' : 'Use This Player'}
        </button>
      </div>
    </div>
  );
}
