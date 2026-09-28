import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on initial load
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('ai_study_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setProfile(res.data.profile);
        setSettings(res.data.settings);
      } catch (err) {
        console.error('Failed to load authenticated user session:', err);
        localStorage.removeItem('ai_study_token');
        localStorage.removeItem('ai_study_user');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData, onboardingCompleted } = res.data;

    localStorage.setItem('ai_study_token', token);
    localStorage.setItem('ai_study_user', JSON.stringify(userData));

    setUser(userData);
    // Refresh full profile & settings
    await refreshUserData();
    return { user: userData, onboardingCompleted };
  };

  const register = async (fullName, email, password, confirmPassword) => {
    const res = await api.post('/auth/register', {
      fullName,
      email,
      password,
      confirmPassword
    });
    const { token, user: userData } = res.data;

    localStorage.setItem('ai_study_token', token);
    localStorage.setItem('ai_study_user', JSON.stringify(userData));

    setUser(userData);
    await refreshUserData();
    return { user: userData, onboardingCompleted: false };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('ai_study_token');
      localStorage.removeItem('ai_study_user');
      setUser(null);
      setProfile(null);
      setSettings(null);
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile);
      setSettings(res.data.settings);
      return res.data;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        settings,
        loading,
        isAuthenticated: Boolean(user),
        onboardingCompleted: Boolean(settings?.onboarding_completed),
        login,
        register,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
