import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const SupabaseAuthContext = createContext(undefined);
const STORAGE_KEY = 'recomputeit_auth';
const TOKEN_STORAGE = 'recomputeit_token';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE);
    setToken('');
    setSession(null);
    setUser(null);

    return { error: null };
  }, []);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        handleSession(saved);
        const savedToken = localStorage.getItem(TOKEN_STORAGE) || '';
        setToken(savedToken);
      } catch (e) {
        console.error("Error reading local session:", e);
        handleSession(null);
      }
    } else {
      handleSession(null);
    }
    return () => {};
  }, [handleSession, signOut]);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!email || !password) {
      return { error: { message: "E-post och lösenord krävs." } };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { error: { message: "Felaktiga uppgifter." } };
      }

      const data = await response.json();
      const newSession = { user: data.user };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      localStorage.setItem(TOKEN_STORAGE, data.token);
      setToken(data.token);
      handleSession(newSession);
      return { error: null };
    } catch (error) {
      return { error: { message: "Kunde inte logga in." } };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signInWithEmail,
    signOut,
    token,
    role: user?.role || 'base',
  }), [user, session, loading, signInWithEmail, signOut, token]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
