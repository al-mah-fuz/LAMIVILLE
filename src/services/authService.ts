import { User, Session } from '@supabase/supabase-js';
import { supabase, formatSupabaseError } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Ensures a valid Supabase session exists throughout the application.
 * Only returns "Session expired. Please log in again." if there is genuinely no session.
 * For all other errors, returns the real Supabase error.
 */
export async function ensureAuthenticatedSession(): Promise<{
  session: Session | null;
  user: User | null;
  error: string | null;
}> {
  try {
    // 1. Call getSession() to inspect persistent browser session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { session: null, user: null, error: formatSupabaseError(sessionError) };
    }

    let session = sessionData?.session;

    if (!session) {
      // Attempt refresh if refresh token exists in Supabase
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        return {
          session: null,
          user: null,
          error: 'Session expired. Please log in again.',
        };
      }
      session = refreshData.session;
    }

    // Retrieve user object
    let user = session.user;
    if (!user) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        return { session: null, user: null, error: formatSupabaseError(userError) };
      }
      user = userData?.user || null;
    }

    if (!user) {
      return { session: null, user: null, error: 'Session expired. Please log in again.' };
    }

    return { session, user, error: null };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    return {
      session: null,
      user: null,
      error: formatted,
    };
  }
}

/**
 * 1 & 3: Sign in with Supabase Auth using signInWithPassword()
 * and retrieve/confirm the session and user.
 */
export async function signInAdmin(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
}> {
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        return {
          user: null,
          session: null,
          error: 'Invalid admin email or password. Please verify your credentials.',
        };
      }
      return { user: null, session: null, error: formatSupabaseError(signInError) };
    }

    if (!signInData.session) {
      return {
        user: null,
        session: null,
        error: 'Failed to establish Supabase session. Please try logging in again.',
      };
    }

    // 3. After login, confirm and retrieve session and user from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { user: null, session: null, error: formatSupabaseError(sessionError) };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      return { user: null, session: null, error: formatSupabaseError(userError) };
    }

    const activeSession = session || signInData.session;
    const activeUser = user || signInData.user || activeSession.user;

    return {
      user: activeUser,
      session: activeSession,
      error: null,
    };
  } catch (err: unknown) {
    const formatted = formatSupabaseError(err);
    return { user: null, session: null, error: formatted };
  }
}

export async function signUpAdmin(email: string, password: string): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
  needsConfirmation?: boolean;
}> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

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

/**
 * 5. On startup / page refresh, restore the existing Supabase session
 */
export async function getActiveSession(): Promise<{ user: User | null; session: Session | null }> {
  const { user, session } = await ensureAuthenticatedSession();
  return { user, session };
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const { user } = await ensureAuthenticatedSession();
  return user;
}

/**
 * 4. Subscribe to Supabase authentication changes using onAuthStateChange()
 * Keeps the application's authenticated-user state synchronized with the real Supabase session.
 */
export function subscribeToAuth(
  callback: (user: User | null, session: Session | null, event: string) => void
): () => void {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback(session.user, session, event);
    } else {
      callback(null, null, event);
    }
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}
