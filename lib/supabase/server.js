import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export function getServerSupabase() {
  // next/headers/cookies je že sync!
  return createServerComponentClient({ cookies })
}