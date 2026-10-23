import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '../../../../utils/supabase/server'
import { sendNotification } from '../../../../lib/notifications'
import { rateLimiter, buildRateLimitHeaders } from '@/lib/security/rateLimiter'
import { validatePayloadSize, sanitizePayload } from '@/lib/security/sanitizer'

export async function POST(request) {
  try {
    // 1. Validate Payload Size (Max 10KB for registration payload)
    if (!(await validatePayloadSize(request, 10240))) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
    }

    // 2. Strict Rate Limiting (Max 5 registrations per hour per IP to prevent bot account floods)
    const rateResult = rateLimiter(request, { limit: 5, windowSeconds: 3600, keyPrefix: 'register_form' })
    const rateHeaders = buildRateLimitHeaders(rateResult)

    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts from this network. Please try again later.' },
        { status: 429, headers: rateHeaders }
      )
    }

    const rawBody = await request.json()
    const { email, password, fullName, phone, city } = sanitizePayload(rawBody) || {}

    if (!email || !password || !fullName || !phone || !city) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400, headers: rateHeaders })
    }

    // 3. Email & Password Syntax Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400, headers: rateHeaders })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400, headers: rateHeaders })
    }

    if (fullName.trim().length > 100 || city.trim().length > 100 || phone.trim().length > 30) {
      return NextResponse.json({ error: 'Input field exceeds maximum allowed length.' }, { status: 400, headers: rateHeaders })
    }

    // 4. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 5. Create user as confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        role: 'tutor'
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400, headers: rateHeaders })
    }

    const user = authData.user

    // 6. Update tutor profile record
    const { error: profileError } = await supabaseAdmin
      .from('tutor_profiles')
      .update({ 
        full_name: fullName.trim(),
        phone: phone.trim(),
        city: city.trim()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error on registration:', profileError)
    }

    // 7. Trigger Welcome Email & In-App Notification for new Tutor
    await sendNotification({
      userId: user.id,
      userEmail: email.trim().toLowerCase(),
      userName: fullName.trim(),
      title: 'Welcome to TutorOnline.pk! Start Building Your Profile 🎓',
      message: `Hello ${fullName.trim()}, welcome to Pakistan's premier tutor network! Complete your onboarding steps to get verified.`,
      type: 'welcome',
      priority: 'HIGH',
      actionUrl: '/tutor/onboarding',
      templateName: 'welcome_tutor',
      templateData: {
        USER_NAME: fullName.trim(),
        ONBOARDING_URL: 'https://tutoronline.pk/tutor/onboarding',
      },
    }).catch(err => console.warn('Welcome notification error:', err))

    // 8. Log the user in to establish a session with cookies using SSR client
    const supabaseServer = await createServerClient()
    const { error: signInError } = await supabaseServer.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'User registered but failed to log in automatically.' }, { status: 500, headers: rateHeaders })
    }

    return NextResponse.json({ success: true, user: user.id }, { status: 200, headers: rateHeaders })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
