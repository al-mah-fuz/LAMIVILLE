import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Ensures a valid Supabase session exists throughout the application.
 * 6. Before Add Product, calls supabase.auth.getSession() and verifies that a valid session exists.
 * 7. If the access token has expired but a refresh token exists, allows Supabase to refresh the session.
 * 8. Only returns "Session expired. Please log in again." if the session truly cannot be restored after attempting a refresh.
 */
export async function ensureAuthenticatedSession(): Promise<{
  session: Session | null;
  user: User | null;
  error: string | null;
}> {
  try {
    // 1. Call getSession() to inspect persistent browser session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let session = sessionData?.session;

    // Check expiration with a 60-second proactive buffer
    const now = Math.floor(Date.now() / 1000);
    const isExpired = session?.expires_at ? session.expires_at <= (now + 60) : false;

    if (!session || isExpired || sessionError) {
      // 7. Token expired or session missing: attempt refreshSession()
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.warn('Session refresh failed or no refresh token:', refreshError?.message);
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
      if (userError || !userData.user) {
        const { data: retryRefresh } = await supabase.auth.refreshSession();
        if (!retryRefresh?.session?.user) {
          return {
            session: null,
            user: null,
            error: 'Session expired. Please log in again.',
          };
        }
        session = retryRefresh.session;
        user = retryRefresh.session.user;
      } else {
        user = userData.user;
      }
    }

    return { session, user, error: null };
  } catch (err: unknown) {
    console.warn('ensureAuthenticatedSession error:', err);
    try {
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData?.session?.user) {
        return {
          session: refreshData.session,
          user: refreshData.session.user,
          error: null,
        };
      }
    } catch {}
    return {
      session: null,
      user: null,
      error: 'Session expired. Please log in again.',
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
      return { user: null, session: null, error: signInError.message };
    }

    if (!signInData.session) {
      return {
        user: null,
        session: null,
        error: 'Failed to establish Supabase session. Please try logging in again.',
      };
    }

    // 3. After login, confirm and retrieve session and user from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    const activeSession = session || signInData.session;
    const activeUser = user || signInData.user || activeSession.user;

    return {
      user: activeUser,
      session: activeSession,
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
