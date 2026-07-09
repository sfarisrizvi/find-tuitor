import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // next is a custom redirect param to forward the user to after login
  const next = searchParams.get('next') ?? '/tutor/dashboard'

  // Construct absolute redirect URL
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'signup.tutoronline.pk'
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const absoluteOrigin = `${protocol}://${host}`

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
              // Ignore
            }
          },
        },
      }
    )
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If a role was passed (from signup), update the user metadata
      const roleParam = searchParams.get('role')
      if (roleParam) {
        await supabase.auth.updateUser({
          data: {
            role: 'client',
            client_type: roleParam
          }
        })
      }
      return NextResponse.redirect(`${absoluteOrigin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${absoluteOrigin}/login?error=auth_failed`)
}
