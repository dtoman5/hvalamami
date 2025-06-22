// lib/supabase/admin.js

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Supabase admin environment variables are not set')
}

export const createAdminClient = () => {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}