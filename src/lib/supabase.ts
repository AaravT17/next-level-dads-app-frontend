import { AuthClient } from '@supabase/auth-js'

/**
 * The Supabase auth client, built directly rather than via `createClient`.
 *
 * `createClient` statically imports the realtime, storage, postgrest and
 * functions sub-clients whether or not you touch them, which cost about 21 kB
 * gzipped here for code that never runs — this app reaches Supabase only for
 * auth, and talks to its own backend for everything else.
 *
 * The configuration below reproduces what `createClient` would have passed, so
 * behaviour is unchanged. `SupabaseAuthClient` is a bare subclass of
 * `AuthClient` that adds nothing, and the storage key is derived the same way,
 * so a session already in localStorage is still found.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set. See .env.example.',
  )
}

// Trailing slash matters: `new URL('auth/v1', 'https://x.co/rest')` would
// resolve against the parent path and drop the last segment.
const baseUrl = new URL(supabaseUrl.trim().replace(/\/*$/, '/'))

export const supabaseAuth = new AuthClient({
  url: new URL('auth/v1', baseUrl).href,
  headers: {
    Authorization: `Bearer ${supabasePublishableKey}`,
    apikey: supabasePublishableKey,
  },
  storageKey: `sb-${baseUrl.hostname.split('.')[0]}-auth-token`,
  autoRefreshToken: true,
  persistSession: true,
  // We handle OAuth and recovery tokens manually.
  detectSessionInUrl: false,
  flowType: 'implicit',
})
