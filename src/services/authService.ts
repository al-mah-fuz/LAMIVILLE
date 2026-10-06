import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export async function signInAdmin(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase client is not configured.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return {
          user: null,
          session: null,
          error: 'Invalid admin email or password. If you haven\'t created an admin account yet, use the "Create Admin Account" option.',
        };
      }
      return { user: null, session: null, error: error.message };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return { user: null, session: null, error: msg };
  }
}

export async function signUpAdmin(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
  needsConfirmation?: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase client is not configured.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    // Check if session was returned or email confirmation is required
    const needsConfirmation = !data.session;

    return {
      user: data.user,
      session: data.session,
      needsConfirmation,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sign up failed';
    return { user: null, session: null, error: msg };
  }
}

export async function signOutAdmin(): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sign out failed';
    return { error: msg };
  }
}

export async function getActiveSession(): Promise<{ user: User | null; session: Session | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { user: null, session: null };
  }

  try {
    const { data } = await supabase.auth.getSession();
    return {
      user: data.session?.user || null,
      session: data.session || null,
    };
  } catch (e) {
    console.error('Error checking active session:', e);
    return { user: null, session: null };
  }
}

export function subscribeToAuth(callback: (user: User | null, session: Session | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null, session);
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}
