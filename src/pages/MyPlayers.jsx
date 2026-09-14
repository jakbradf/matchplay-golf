import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadStoredPlayers, saveStoredPlayer, updateStoredPlayer, deleteStoredPlayer } from '../firebase/playerService';
import { compressImageFile } from '../utils/image';
import Header from '../components/Header';
import PlayerAvatar from '../components/PlayerAvatar';
import { signInWithGoogle } from '../firebase/authService';
import { GoogleIcon, CameraIcon } from '../components/GolfIcon';

function PhotoField({ name, photoURL, onChange }) {
  const fileInputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onChange(await compressImageFile(file));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
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
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
    </>
  );
}

function EditRow({ player, onSave, onCancel }) {
  const [name, setName] = useState(player.name);
  const [handicap, setHandicap] = useState(String(player.handicap ?? ''));
  const [photoURL, setPhotoURL] = useState(player.photoURL || null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), handicap, photoURL });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stored-player-row" style={{ alignItems: 'flex-start' }}>
      <PhotoField name={name} photoURL={photoURL} onChange={setPhotoURL} />
      <div className="picker-new-fields">
        <input
          className="form-input form-input-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          maxLength={30}
        />
        <input
          className="form-input form-input-sm"
          value={handicap}
          onChange={(e) => setHandicap(e.target.value.replace(',', '.'))}
          placeholder="HCP Index"
          type="text"
          inputMode="decimal"
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1, minHeight: 38, fontSize: '0.85rem' }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, minHeight: 38, fontSize: '0.85rem' }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPlayers() {
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [newName, setNewName] = useState('');
  const [newHandicap, setNewHandicap] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [adding, setAdding] = useState(false);

  const refresh = () => {
    if (!user) return;
    setLoading(true);
    loadStoredPlayers(user.uid).then(setPlayers).finally(() => setLoading(false));
  };

  useEffect(refresh, [user]);

  const addPlayer = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await saveStoredPlayer({ name: newName.trim(), handicap: newHandicap, photoURL: newPhoto }, user.uid);
      setNewName('');
      setNewHandicap('');
      setNewPhoto(null);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id, updates) => {
    await updateStoredPlayer(id, updates);
    setEditingId(null);
    refresh();
  };

  const removePlayer = async (id) => {
    await deleteStoredPlayer(id);
    refresh();
  };

  if (authLoading) {
    return (
      <div className="app-container">
        <Header title="My Players" showBack backTo="/" />
        <div className="loading-screen"><div className="spinner" /><span>Loading…</span></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <Header title="My Players" showBack backTo="/" />
        <div className="page" style={{ textAlign: 'center', paddingTop: 48 }}>
          <p style={{ color: 'var(--grey-600)', marginBottom: 24 }}>
            Sign in with Google to save players with a handicap and photo you can reuse across games.
          </p>
          <button className="btn btn-primary" onClick={signInWithGoogle}>
            <GoogleIcon size={18} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header title="My Players" showBack backTo="/" />
      <div className="page">
        <p className="section-title-sm">Add Player</p>
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <PhotoField name={newName} photoURL={newPhoto} onChange={setNewPhoto} />
          <div className="picker-new-fields">
            <input
              className="form-input form-input-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              maxLength={30}
            />
            <input
              className="form-input form-input-sm"
              value={newHandicap}
              onChange={(e) => setNewHandicap(e.target.value.replace(',', '.'))}
              placeholder="HCP Index"
              type="text"
              inputMode="decimal"
            />
            <button className="btn btn-primary btn-full" style={{ minHeight: 38, fontSize: '0.85rem' }} onClick={addPlayer} disabled={!newName.trim() || adding}>
              {adding ? 'Adding…' : 'Add Player'}
            </button>
          </div>
        </div>

        <p className="section-title-sm mt-16">Saved Players</p>
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><span>Loading players…</span></div>
        ) : players.length === 0 ? (
          <p style={{ color: 'var(--grey-500)', fontSize: '0.9rem' }}>No players saved yet.</p>
        ) : (
          players.map((p) => (
            editingId === p.id ? (
              <EditRow key={p.id} player={p} onSave={(updates) => saveEdit(p.id, updates)} onCancel={() => setEditingId(null)} />
            ) : (
              <div key={p.id} className="stored-player-row">
                <button className="picker-photo-btn" onClick={() => setEditingId(p.id)} aria-label={`Edit ${p.name}`}>
                  <PlayerAvatar name={p.name} photoURL={p.photoURL} size={44} />
                </button>
                <div className="stored-player-info" onClick={() => setEditingId(p.id)} style={{ cursor: 'pointer' }}>
                  <span className="stored-player-name">{p.name}</span>
                  <span className="stored-player-hcp">HCP {p.handicap}</span>
                </div>
                <button className="stored-player-delete" onClick={() => removePlayer(p.id)}>
                  Delete
                </button>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
