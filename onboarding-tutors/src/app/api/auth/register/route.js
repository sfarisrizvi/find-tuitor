import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '../../../../utils/supabase/server'

export async function POST(request) {
  try {
    const { email, password, fullName, phone, city } = await request.json()

    if (!email || !password || !fullName || !phone || !city) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Initialize the Supabase admin client to bypass email verification (email_confirm: true)
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

    // 1. Create the user as confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'tutor'
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const user = authData.user

    // 2. The handle_new_user trigger already creates a row in tutor_profiles.
    // We just need to update it with the additional information (phone, city).
    // The name is usually mapped via raw_user_meta_data by the trigger if provided in metadata,
    // but we can explicitly update it here to be safe.
    const { error: profileError } = await supabaseAdmin
      .from('tutor_profiles')
      .update({ 
        full_name: fullName,
        phone,
        city
      })
      .eq('id', user.id)

    if (profileError) {
      // It's possible the trigger hasn't finished yet or something else went wrong
      console.error('Profile update error:', profileError)
      // We don't fail the request completely since the user is created,
      // but ideally we'd want this to succeed.
    }

    // 3. Log the user in to establish a session with cookies using SSR client
    const supabaseServer = await createServerClient()
    const { error: signInError } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: 'User registered but failed to log in automatically.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: user.id }, { status: 200 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
