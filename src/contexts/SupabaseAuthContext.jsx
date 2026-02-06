import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const SupabaseAuthContext = createContext(undefined);
const STORAGE_KEY = 'recomputeit_auth';

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async (options = { showToast: true }) => {
    localStorage.removeItem(STORAGE_KEY);
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

    const newSession = {
      user: {
        id: `local-${Date.now()}`,
        email,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    handleSession(newSession);
    return { error: null };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signInWithEmail,
    signOut,
  }), [user, session, loading, signInWithEmail, signOut]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
