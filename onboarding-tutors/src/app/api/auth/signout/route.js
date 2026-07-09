import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function handleSignOutFlow() {
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
            // Ignore
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

  // Clear cookies explicitly using the Next.js cookieStore
  const cookiesToClear = cookieStore.getAll()
  cookiesToClear.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      try {
        cookieStore.set(cookie.name, '', { maxAge: -1, path: '/' })
      } catch (e) {
        console.error(`Failed to clear cookie ${cookie.name}:`, e)
      }
    }
  })
}

export async function POST(request) {
  await handleSignOutFlow()
  return NextResponse.json({ success: true })
}

export async function GET(request) {
  await handleSignOutFlow()
  return NextResponse.redirect(new URL('/', request.url))
}
