import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use a valid local placeholder while building when deployment environment variables
// have not been configured yet. Set the real NEXT_PUBLIC_* values in the host.
export const supabase = createClient(
  url || 'http://127.0.0.1:54321',
  key || 'build-placeholder-key'
)

export const hasSupabaseConfig = Boolean(url && key)
