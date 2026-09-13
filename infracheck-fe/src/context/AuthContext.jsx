import { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getAuthUser } from '../api/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAuthUser();
      setUser(data.user || data.data || data);
    } catch (err) {
      console.error('Failed to fetch authenticated user profile:', err);
      localStorage.removeItem('admin_token');
      setToken(null);
      setUser(null);
      setError(err?.response?.data?.message || 'Sesi telah berakhir.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginApi(credentials);
      const authToken = response.token || response.access_token || response.data?.token;
      const userData = response.user || response.data?.user || null;

      if (authToken) {
        localStorage.setItem('admin_token', authToken);
        setToken(authToken);
      }

      if (userData) {
        setUser(userData);
      } else {
        await fetchProfile();
      }

      return response;
    } catch (err) {
      const message = err?.response?.data?.message || 'Login gagal. Periksa kembali email dan password.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      localStorage.removeItem('admin_token');
      setToken(null);
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isLoading,
    error,
    login,
    logout,
    refreshUser: fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
