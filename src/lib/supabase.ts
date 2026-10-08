import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for production Vercel and local Vite builds
const envUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  ''
).trim();

const envAnonKey = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  ''
).trim();

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnvConfigured: boolean;
}

export function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  if (trimmed.includes('your-project-id') || trimmed.includes('placeholder.supabase.co')) return false;
  return true;
}

export function isValidSupabaseKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.includes('placeholder-anon-key') || trimmed.endsWith('...') || trimmed.length < 20) return false;
  return true;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const localUrl = typeof window !== 'undefined' ? (localStorage.getItem('lamiville_supabase_url') || '').trim() : '';
  const localKey = typeof window !== 'undefined' ? (localStorage.getItem('lamiville_supabase_anon_key') || '').trim() : '';

  // In production (Vercel deployment) or when valid env vars are present, use env vars.
  // Otherwise, use valid localStorage credentials if configured, fallback to env/placeholder.
  let activeUrl = '';
  if (isValidSupabaseUrl(envUrl)) {
    activeUrl = envUrl;
  } else if (isValidSupabaseUrl(localUrl)) {
    activeUrl = localUrl;
  } else {
    activeUrl = envUrl || localUrl;
  }

  let activeKey = '';
  if (isValidSupabaseKey(envAnonKey)) {
    activeKey = envAnonKey;
  } else if (isValidSupabaseKey(localKey)) {
    activeKey = localKey;
  } else {
    activeKey = envAnonKey || localKey;
  }

  const isConfigured = isValidSupabaseUrl(activeUrl) && isValidSupabaseKey(activeKey);

  return {
    url: activeUrl,
    anonKey: activeKey,
    isEnvConfigured: isConfigured,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    const current = getStoredSupabaseConfig();

    if (current.url !== cleanUrl || current.anonKey !== cleanKey) {
      localStorage.setItem('lamiville_supabase_url', cleanUrl);
      localStorage.setItem('lamiville_supabase_anon_key', cleanKey);
      // Reload page so singleton Supabase client initializes with the updated project credentials
      window.location.reload();
    }
  }
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lamiville_supabase_url');
    localStorage.removeItem('lamiville_supabase_anon_key');
  }
}

const config = getStoredSupabaseConfig();
const clientUrl = config.url || 'https://placeholder.supabase.co';
const clientAnonKey = config.anonKey || 'placeholder-anon-key';

/**
 * 1 & 2: Singleton Supabase browser client shared across the entire application.
 * Initialized with:
 *   persistSession: true
 *   autoRefreshToken: true
 *   detectSessionInUrl: true
 */
export const supabase: SupabaseClient = createClient(clientUrl, clientAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function getSupabase(): SupabaseClient {
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return isValidSupabaseUrl(url) && isValidSupabaseKey(anonKey);
}

/**
 * Formats a Supabase or PostgREST error into a comprehensive string.
 * Displays error.message, error.code, error.details, and error.hint so no error is hidden.
 */
export function formatSupabaseError(error: unknown): string {
  if (!error) return 'Unknown error occurred.';
  if (typeof error === 'string') return error;

  const err = error as {
    message?: string;
    code?: string | number;
    details?: string;
    hint?: string;
    error_description?: string;
  };

  const parts: string[] = [];
  if (err.message) {
    parts.push(err.message);
  } else if (err.error_description) {
    parts.push(err.error_description);
  } else if (error instanceof Error) {
    parts.push(error.message);
  }

  if (err.code) parts.push(`Code: ${err.code}`);
  if (err.details) parts.push(`Details: ${err.details}`);
  if (err.hint) parts.push(`Hint: ${err.hint}`);

  return parts.length > 0 ? parts.join(' | ') : JSON.stringify(error);
}

/**
 * Health check helper to test connection & table existence
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableExists?: boolean;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon Key is missing. Please configure your credentials.',
    };
  }

  try {
    const { error } = await client.from('products').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          tableExists: false,
          message: 'Connected to Supabase, but the "products" table does not exist yet. Please run the SQL schema script.',
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Successfully connected to Supabase and verified the "products" table!',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      success: false,
      message: `Failed to connect to Supabase: ${message}`,
    };
  }
}
