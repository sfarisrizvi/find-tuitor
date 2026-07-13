import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = request.nextUrl.clone()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    console.error('Supabase environment variables are missing or invalid in middleware!');
    const isProtectedRoute = url.pathname.startsWith('/tutor');
    if (isProtectedRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

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
  


  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = url.pathname === '/' || 
                        url.pathname === '/login' || 
                        url.pathname === '/register' || 
                        url.pathname === '/signup' || 
                        url.pathname === '/coming-soon';

  const isProtectedRoute = url.pathname.startsWith('/tutor');

  if (isProtectedRoute) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    if (user.user_metadata?.role === 'tutor' || url.pathname.startsWith('/tutor')) {
      const { data: profile } = await supabase.from('tutor_profiles').select('onboarding_complete').eq('id', user.id).maybeSingle();
      
      if (profile) {
        if (!profile.onboarding_complete && url.pathname !== '/tutor/onboarding') {
          url.pathname = '/tutor/onboarding';
          return NextResponse.redirect(url);
        }
        
        if (profile.onboarding_complete && url.pathname === '/tutor/onboarding') {
          url.pathname = '/tutor/dashboard';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
