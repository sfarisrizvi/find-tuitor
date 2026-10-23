import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // 1. Sanitize 'next' parameter to prevent Open Redirect attacks
  let next = searchParams.get('next') ?? '/tutor/dashboard'
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || next.includes('\\')) {
    next = '/tutor/dashboard'
  }

  // 2. Prevent Host Header Injection: Use environment-defined or whitelisted origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tutoronline.pk'
  const isLocal = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1'
  const trustedOrigin = isLocal ? request.nextUrl.origin : siteUrl

  if (code) {
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Validate client signup role parameter against strict whitelist
      const roleParam = searchParams.get('role')
      if (roleParam && ['parent', 'student'].includes(roleParam)) {
        await supabase.auth.updateUser({
          data: {
            role: 'client',
            client_type: roleParam
          }
        })
      }
      return NextResponse.redirect(`${trustedOrigin}${next}`)
    }
  }

  // Return to login with error parameter on failure
  return NextResponse.redirect(`${trustedOrigin}/login?error=auth_failed`)
}
