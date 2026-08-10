import { createClient } from '@supabase/supabase-js'

/**
 * supabase-js appends its own `/rest/v1`, `/auth/v1` etc. to the base URL, so
 * it must be given the bare project URL. Pasting the REST endpoint from the
 * dashboard instead produces `/rest/v1/rest/v1/...` and every query fails with
 * "Invalid path specified in request URL". Normalise it here so a mistyped
 * environment variable — locally or on Vercel — can't break the whole app.
 */
function normaliseUrl(raw) {
  if (!raw) return raw
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/(rest|auth|storage|realtime|functions)\/v\d+$/, '')
}

const supabaseUrl = normaliseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
