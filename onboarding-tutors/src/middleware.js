import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = request.nextUrl.clone()

  // Prevent crash if environment variables are missing on deployment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are missing in middleware!');
    // If it's a protected route, redirect to login (or render public pages without auth checks)
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
  }



  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
