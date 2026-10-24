import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read Vite environment variables safely across both browser and test environments
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const supabaseUrl: string = typeof env.VITE_SUPABASE_URL === 'string'
  ? env.VITE_SUPABASE_URL.trim()
  : '';

const supabaseAnonKey: string = typeof env.VITE_SUPABASE_ANON_KEY === 'string'
  ? env.VITE_SUPABASE_ANON_KEY.trim()
  : '';

/**
 * Validates whether authentic Supabase credentials have been configured
 * (guards against placeholder or unconfigured strings).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes('your-anon-public-api-key')
  );
}

export function getSupabaseConfig(): { url: string; hasKey: boolean } {
  return {
    url: supabaseUrl,
    hasKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-anon-public-api-key'))
  };
}

/**
 * Active Supabase client instance using the public anonymous key.
 * Only instantiated if valid credentials are present.
 * Never uses or requires a service-role secret key.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export interface ConnectionTestResult {
  connected: boolean;
  provider: 'supabase' | 'local';
  url?: string;
  latencyMs?: number;
  error?: string;
}

/**
 * Performs a live ping check against the configured Supabase instance.
 */
export async function checkDatabaseConnection(): Promise<ConnectionTestResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      provider: 'local',
      error: 'Supabase credentials not configured in environment variables (running in local storage mode).'
    };
  }

  const start = performance.now();
  try {
    const { error } = await supabase
      .from('brand_profiles')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        provider: 'supabase',
        url: supabaseUrl,
        latencyMs,
        error: error.message
      };
    }

    return {
      connected: true,
      provider: 'supabase',
      url: supabaseUrl,
      latencyMs
    };
  } catch (err) {
    return {
      connected: false,
      provider: 'supabase',
      url: supabaseUrl,
      error: err instanceof Error ? err.message : 'Network error reaching Supabase server.'
    };
  }
}
