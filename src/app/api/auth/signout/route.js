import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method can be ignored if
            // how the middleware is refreshing is configured
          }
        },
      },
    }
  )

  // Check if session exists
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  // Clear cookie explicitly if signout didn't catch everything
  const response = NextResponse.json({ success: true })
  
  // In Next.js App Router, cookies can be deleted from the response
  const cookiesToClear = cookieStore.getAll()
  cookiesToClear.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    }
  })

  return response
}
export async function GET(request) {
  // Support GET redirect signout as fallback
  const response = await POST(request)
  return NextResponse.redirect(new URL('/', request.url))
}
