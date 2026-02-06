import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const SupabaseAuthContext = createContext(undefined);
const STORAGE_KEY = 'recomputeit_auth';
const API_KEY_STORAGE = 'recomputeit_api_key';

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
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
        const savedKey = localStorage.getItem(API_KEY_STORAGE) || '';
        setApiKey(savedKey);
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
      return { error: { message: "Användarnamn och nyckel krävs." } };
    }

    const newSession = {
      user: {
        id: `local-${Date.now()}`,
        email,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    localStorage.setItem(API_KEY_STORAGE, password);
    setApiKey(password);
    handleSession(newSession);
    return { error: null };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signInWithEmail,
    signOut,
    apiKey,
  }), [user, session, loading, signInWithEmail, signOut, apiKey]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
