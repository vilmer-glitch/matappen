import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL och VITE_SUPABASE_PUBLISHABLE_KEY saknas i .env.local')
}

// The session is saved in localStorage by default, so you stay logged in.
export const supabase = createClient(url, key)
