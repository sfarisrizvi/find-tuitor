import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Helper to construct response with Supabase auth cookies forwarded to avoid losing session updates
  const redirect = (targetUrl) => {
    const res = NextResponse.redirect(targetUrl)
    supabaseResponse.cookies.getAll().forEach((c) => {
      res.cookies.set(c.name, c.value, {
        path: c.path,
        domain: c.domain,
        maxAge: c.maxAge,
        secure: c.secure,
        sameSite: c.sameSite,
        expires: c.expires,
      })
    })
    
    // Clean up RSC headers to prevent Next.js from caching HTML responses as JSON payloads
    res.headers.delete('x-middleware-prefetch')
    res.headers.delete('rsc')
    
    return res
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // Refresh and verify session cryptographically
  const { data: { user } } = await supabase.auth.getUser()

  // If already authenticated and navigating to login/signup/register -> redirect to appropriate dashboard
  if (user && (url.pathname === '/login' || url.pathname === '/signup' || url.pathname === '/register')) {
    let role = user.user_metadata?.role;

    // Verify role legitimately
    if (role === 'admin') {
      const { data: roleRecord } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (roleRecord?.role !== 'admin') role = null;
    }

    if (!role) {
      const { data: clientProf } = await supabase.from('client_profiles').select('id').eq('id', user.id).maybeSingle();
      if (clientProf) {
        role = 'client';
      } else {
        const { data: tutorProf } = await supabase.from('tutor_profiles').select('id').eq('id', user.id).maybeSingle();
        if (tutorProf) {
          role = 'tutor';
        }
      }
    }

    if (role === 'tutor') {
      url.pathname = '/tutor/dashboard';
      return redirect(url);
    } else {
      url.pathname = '/client/dashboard';
      return redirect(url);
    }
  }

  const isPublicRoute = url.pathname === '/' ||
    url.pathname === '/login' ||
    url.pathname === '/register' ||
    url.pathname === '/signup' ||
    url.pathname === '/contact' ||
    url.pathname === '/find-tutor' ||
    url.pathname.startsWith('/find-tutor/') ||
    url.pathname.startsWith('/tutor/jobs') ||
    url.pathname.startsWith('/tutors/') ||
    url.pathname === '/terms' ||
    url.pathname === '/privacy' ||
    url.pathname === '/forgot-password' ||
    url.pathname === '/update-password' ||
    url.pathname === '/confirm';

  const isProtectedRoute = (url.pathname.startsWith('/client') ||
    url.pathname.startsWith('/tutor')) &&
    !isPublicRoute;

  if (isProtectedRoute) {
    if (!user) {
      url.pathname = '/login'
      return redirect(url)
    }

    let role = user.user_metadata?.role;

    // Secure administrative validation (prevent client metadata forgery)
    if (role === 'admin') {
      const { data: roleRecord } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (roleRecord?.role !== 'admin') {
        role = null;
      }
    }

    // Role-based directory access control
    if (role && role !== 'admin') {
      if (url.pathname.startsWith('/tutor') && role !== 'tutor') {
        url.pathname = '/client/dashboard'
        return redirect(url)
      }
      if (url.pathname.startsWith('/client') && role !== 'client') {
        url.pathname = '/tutor/dashboard'
        return redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
