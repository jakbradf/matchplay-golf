import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    return onAuthChange((u) => setUser(u ?? null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
