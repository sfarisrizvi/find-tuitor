import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const url = request.nextUrl.clone()
  
  // 1. Coming Soon bypass check
  const hasAccessCookie = request.cookies.get('access_allowed')?.value === 'true';
  const hasAccessParam = url.searchParams.get('access') === 'allowed' || url.searchParams.has('accessallowed');
  const hasAccess = hasAccessCookie || hasAccessParam;

  if (!hasAccess && url.pathname !== '/coming-soon') {
    return NextResponse.rewrite(new URL('/coming-soon', request.url));
  }

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = url.pathname === '/' || 
                        url.pathname === '/login' || 
                        url.pathname === '/register' || 
                        url.pathname === '/signup' || 
                        url.pathname === '/contact' || 
                        url.pathname === '/find-tutor' || 
                        url.pathname.startsWith('/find-tutor/') || 
                        url.pathname === '/tutor/jobs' || 
                        url.pathname.startsWith('/tutors/') ||
                        url.pathname === '/coming-soon';

  const isProtectedRoute = (url.pathname.startsWith('/client') || 
                            url.pathname.startsWith('/tutor') || 
                            url.pathname.startsWith('/admin')) && 
                           !isPublicRoute;

  if (isProtectedRoute) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = user.user_metadata?.role
    if (role) {
      if (url.pathname.startsWith('/tutor') && role !== 'tutor') {
        url.pathname = role === 'client' ? '/client/dashboard' : '/login'
        return NextResponse.redirect(url)
      }
      if (url.pathname.startsWith('/client') && role !== 'client') {
        url.pathname = role === 'tutor' ? '/tutor/dashboard' : '/login'
        return NextResponse.redirect(url)
      }
      if (url.pathname.startsWith('/admin') && role !== 'admin') {
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
    }
  }

  if (hasAccessParam && !hasAccessCookie) {
    supabaseResponse.cookies.set('access_allowed', 'true', {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
