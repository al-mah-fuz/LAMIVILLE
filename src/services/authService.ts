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
      error: 'Supabase client is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
    };
  }

  try {
    // 1. Authenticate with Supabase Auth using signInWithPassword
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        return {
          user: null,
          session: null,
          error: 'Invalid admin email or password. If you haven\'t created an admin account yet, use the "Create Admin Account" option.',
        };
      }
      return { user: null, session: null, error: signInError.message };
    }

    if (!signInData.session) {
      return {
        user: null,
        session: null,
        error: 'Failed to establish Supabase session. Please log in again.',
      };
    }

    // 3. After login, explicitly verify the authenticated Supabase user with getUser()
    const { data: { user: verifiedUser }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !verifiedUser) {
      console.error('User verification failed after login:', getUserError);
      return {
        user: null,
        session: null,
        error: getUserError?.message || 'Authenticated user could not be verified by Supabase.',
      };
    }

    return {
      user: verifiedUser,
      session: signInData.session,
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

    // If session was returned immediately, verify the user
    if (data.session) {
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      return {
        user: verifiedUser || data.user,
        session: data.session,
        needsConfirmation: false,
        error: null,
      };
    }

    return {
      user: data.user,
      session: null,
      needsConfirmation: true,
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
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { user: null, session: null };
    }

    // Explicitly verify the authenticated Supabase user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('Stored session could not be verified with getUser():', userError?.message);
      return { user: null, session: null };
    }

    return {
      user,
      session: sessionData.session,
    };
  } catch (e) {
    console.error('Error checking active session:', e);
    return { user: null, session: null };
  }
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export function subscribeToAuth(callback: (user: User | null, session: Session | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  // 4. Subscribe to Supabase authentication changes
  const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        callback(user || null, session);
      } catch {
        callback(null, null);
      }
    } else {
      callback(null, null);
    }
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}
