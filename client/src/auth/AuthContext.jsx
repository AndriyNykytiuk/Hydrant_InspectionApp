import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchMe, login as loginRequest } from '../api/auth.js';
import { getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((u) => !cancelled && setUser(u))
      .catch(() => setToken(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await loginRequest(email, password);
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const isGod = user?.role === 'god';
  const isViewer = user?.role === 'viewer';
  const canViewAll = isGod || isViewer;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isGod, isViewer, canViewAll }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
