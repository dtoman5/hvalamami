// middleware.js
import { NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs'

// This middleware will run on every request (except _next/, static files, etc.)
// and make sure the Supabase session cookie is parsed & available.
export async function middleware(req) {
  const res = NextResponse.next()
  // `createMiddlewareSupabaseClient` will read/write the same cookie that
  // `createPagesBrowserClient` (in your client components) writes.
  const supabase = createMiddlewareSupabaseClient({ req, res })

  // By calling getSession() here, we hydrate the session from the cookie
  // so any downstream `createServerComponentClient({ cookies })` or
  // `getUser()` calls will see it.
  await supabase.auth.getSession()

  return res
}

// Apply to all app routes except _next/static, _next/image, favicon.ico
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}