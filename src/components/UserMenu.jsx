import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, signOut } from '../firebase/authService';
import { GoogleIcon, UserIcon, HistoryIcon } from './GolfIcon';

export default function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // user cancelled
    } finally {
      setSigningIn(false);
    }
  }

  if (!user) {
    return (
      <button
        className="user-menu-signin"
        onClick={handleSignIn}
        disabled={signingIn}
      >
        <GoogleIcon size={16} />
        {signingIn ? 'Signing in…' : 'Sign in'}
      </button>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-avatar-btn" onClick={() => setOpen(o => !o)} aria-label="Account menu">
        {user.photoURL
          ? <img src={user.photoURL} alt={user.displayName ?? ''} className="user-avatar-img" referrerPolicy="no-referrer" />
          : <div className="user-avatar-placeholder"><UserIcon size={18} color="white" /></div>
        }
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-name">{user.displayName ?? user.email}</div>
          <button
            className="user-dropdown-item"
            onClick={() => { navigate('/my-games'); setOpen(false); }}
          >
            <HistoryIcon size={16} color="var(--green-dark)" />
            My Rounds
          </button>
          <button
            className="user-dropdown-item user-dropdown-signout"
            onClick={() => { signOut(); setOpen(false); }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
