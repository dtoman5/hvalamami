// app/api/delete-account/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from '../../../lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST() {
  // 1) identify the logged-in user
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ error: 'Niste prijavljeni.' }, { status: 401 })
  }

  // 2) delete via the admin client
  const admin = createAdminClient()
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  // 3) success
  return NextResponse.json({ success: true })
}

export async function GET() {
  // disallow GET
  return NextResponse.json(
    { error: 'Method not allowed. Pošljite POST.' },
    { status: 405 }
  )
}