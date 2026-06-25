import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getProfile } from './api';
import type { Profile } from './types';

type SignUpParams = { email: string; password: string; displayName: string; username: string };

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await getProfile(userId));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadProfile(s?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id);
  }, [loadProfile, session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async ({ email, password, displayName, username }: SignUpParams) => {
      const handle = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (handle.length < 3) {
        throw new Error('Username must be at least 3 characters (letters, numbers, underscores).');
      }
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;

      // If email confirmation is enabled there is no session yet — guide the user.
      if (!data.session) {
        throw new Error(
          'Account created — check your email to confirm, then sign in. ' +
            '(Tip: disable email confirmation in Supabase Auth settings for instant demo access.)',
        );
      }

      const { error: pErr } = await supabase.from('profiles').insert({
        id: data.session.user.id,
        username: handle,
        display_name: displayName.trim() || handle,
      });
      if (pErr) {
        if (pErr.code === '23505') throw new Error('That username is already taken — try another.');
        throw pErr;
      }
      await loadProfile(data.session.user.id);
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        refreshProfile,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
