import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface ServerSupabaseConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
}

export function getServerSupabaseConfig(): ServerSupabaseConfig {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  // Server-only key: NEVER exposed to browser/client-side bundles
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  ).trim();

  // Public anon key used for verifying user tokens
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  return { supabaseUrl, serviceRoleKey, anonKey };
}

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client initialized with the SERVICE_ROLE_KEY.
 * This client bypasses Row Level Security on the server side, ensuring safe admin writes
 * without exposing the service-role secret to the browser or disabling RLS in PostgreSQL.
 */
export function getServerSupabase(): { client: SupabaseClient | null; error: string | null } {
  const { supabaseUrl, serviceRoleKey, anonKey } = getServerSupabaseConfig();

  if (!supabaseUrl || (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
    return {
      client: null,
      error: 'Missing or invalid Supabase URL on server. Please set SUPABASE_URL or VITE_SUPABASE_URL in your server environment.',
    };
  }

  const keyToUse = serviceRoleKey || anonKey;
  if (!keyToUse) {
    return {
      client: null,
      error: 'Server credentials missing. Please configure SUPABASE_SERVICE_ROLE_KEY in your server environment variables.',
    };
  }

  if (cachedAdminClient) {
    return { client: cachedAdminClient, error: null };
  }

  try {
    cachedAdminClient = createClient(supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return { client: cachedAdminClient, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { client: null, error: `Failed to initialize server Supabase client: ${msg}` };
  }
}

/**
 * Verifies the admin user's JWT from the incoming Authorization header.
 * Uses Supabase Auth to cryptographically validate the session token.
 */
export async function verifyAdminToken(
  authHeader: string | undefined
): Promise<{ user: User | null; error: string | null }> {
  if (!authHeader) {
    return { user: null, error: 'Unauthorized: Authorization header is required (Bearer <token>).' };
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { user: null, error: 'Unauthorized: Invalid Authorization header format. Expected "Bearer <token>".' };
  }

  const token = parts[1].trim();
  if (!token) {
    return { user: null, error: 'Unauthorized: Access token is missing.' };
  }

  const { supabaseUrl, anonKey, serviceRoleKey } = getServerSupabaseConfig();
  if (!supabaseUrl) {
    return { user: null, error: 'Server configuration error: Supabase URL is not set.' };
  }

  try {
    // Authenticate the token with Supabase Auth
    const verifier = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await verifier.auth.getUser(token);
    if (error || !data?.user) {
      return {
        user: null,
        error: error?.message || 'Unauthorized: Invalid or expired admin session. Please log in again.',
      };
    }

    return { user: data.user, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { user: null, error: `Authentication verification failed: ${msg}` };
  }
}
