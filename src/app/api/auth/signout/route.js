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
            // Ignore in server component context
          }
        },
      },
    }
  )

  // Verify and terminate session using cryptographically checked getUser()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
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
  // Prevent Logout CSRF: Reject cross-site image or subresource embedding
  const secFetchSite = request.headers.get('sec-fetch-site')
  const secFetchMode = request.headers.get('sec-fetch-mode')
  if (secFetchSite === 'cross-site' || secFetchMode === 'no-cors') {
    return new NextResponse('Forbidden: Cross-site signout requests are disallowed.', { status: 403 })
  }

  await handleSignOutFlow()
  
  const { searchParams } = new URL(request.url)
  const nextParam = searchParams.get('next')
  
  // Whitelist redirect path to avoid open redirects
  const targetPath = (nextParam && nextParam.startsWith('/tutors/')) ? nextParam : '/'

  // Prevent Host Header Injection
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tutoronline.pk'
  const isLocal = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1'
  const trustedOrigin = isLocal ? request.nextUrl.origin : siteUrl

  return NextResponse.redirect(new URL(targetPath, trustedOrigin))
}
