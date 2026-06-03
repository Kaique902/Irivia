export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _client: any = null;
let _clientPromise: Promise<any> | null = null;
let adminClient: any = null;

/** Get or create a single Supabase anon client instance (promise-based singleton) */
async function getSupabaseClient(): Promise<any> {
  if (_client) return _client;
  if (_clientPromise) return _clientPromise;

  _clientPromise = (async () => {
    const { createClient } = await import('@supabase/supabase-js');
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true },
    });
    _clientPromise = null;
    return _client;
  })();

  return _clientPromise;
}

/** Browser client (anon key, RLS enforced) — only returns client if session exists */
export async function getBrowserClient() {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const client = await getSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  if (session) return client;
  return null;
}

/** Server admin client (service role, bypasses RLS) */
export async function getAdminClient() {
  if (adminClient) return adminClient;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

/** Check if Supabase is configured */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey);
}

/** Get the underlying Supabase client (regardless of session) — used by auth flows */
export { getSupabaseClient };
