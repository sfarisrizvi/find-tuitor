import { NextResponse } from 'next/server';
import { sendNotification } from '../../../lib/notifications';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { rateLimiter } from '@/lib/security/rateLimiter';

export async function POST(request) {
  try {
    // 1. Rate Limiting (Max 3 welcome emails per hour per IP)
    const rateResult = rateLimiter(request, { limit: 3, windowSeconds: 3600, keyPrefix: 'welcome_api' });
    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Cryptographic Session Authentication
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: A valid session is required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, userEmail, userName, role = 'client' } = body || {};

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing userId or userEmail' },
        { status: 400 }
      );
    }

    // 3. User Ownership Verification (Prevent using endpoint as an open spam relay)
    if (user.id !== userId || user.email?.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: You can only dispatch welcome notifications for your own account.' },
        { status: 403 }
      );
    }

    const isTutor = role === 'tutor';
    const templateName = isTutor ? 'welcome_tutor' : 'welcome_client';
    const title = isTutor
      ? 'Welcome to TutorOnline.pk! Start Building Your Profile 🎓'
      : 'Welcome to TutorOnline.pk! Find Your Ideal Home & Online Tutor 🌟';
    const message = isTutor
      ? `Hello ${userName || 'Tutor'}, welcome to Pakistan's premier tutor network! Complete your onboarding steps to get verified.`
      : `Hello ${userName || 'User'}, welcome to TutorOnline.pk! Browse verified home & online tutors across Pakistan with zero placement fees.`;
    const actionUrl = isTutor ? '/tutor/onboarding' : '/find-tutor/search';

    // Dispatch dual-channel (in-app notification + Resend HTML welcome email)
    const res = await sendNotification({
      userId,
      userEmail,
      userName: userName || 'Valued Member',
      title,
      message,
      type: 'welcome',
      priority: 'HIGH',
      actionUrl,
      templateName,
      templateData: {
        USER_NAME: userName || 'Valued Member',
        ONBOARDING_URL: 'https://tutoronline.pk/tutor/onboarding',
        ACTION_URL: 'https://tutoronline.pk/find-tutor/search',
      },
    });

    return NextResponse.json({ success: true, result: res });
  } catch (err) {
    console.error('Welcome API exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
