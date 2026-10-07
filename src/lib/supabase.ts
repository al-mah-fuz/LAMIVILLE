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

export function getStoredSupabaseConfig(): SupabaseConfig {
  const localUrl = typeof window !== 'undefined' ? (localStorage.getItem('lamiville_supabase_url') || '').trim() : '';
  const localKey = typeof window !== 'undefined' ? (localStorage.getItem('lamiville_supabase_anon_key') || '').trim() : '';

  // VITE_ environment variables take precedence in production, fallback to localStorage
  const activeUrl = envUrl || localUrl;
  const activeKey = envAnonKey || localKey;

  return {
    url: activeUrl,
    anonKey: activeKey,
    isEnvConfigured: Boolean(envUrl && envAnonKey),
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
  return Boolean(url && anonKey && url.startsWith('http') && !url.includes('placeholder'));
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
