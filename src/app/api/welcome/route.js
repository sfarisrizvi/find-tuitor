import { NextResponse } from 'next/server';
import { sendNotification } from '../../../lib/notifications';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userEmail, userName, role = 'client' } = body || {};

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing userId or userEmail' },
        { status: 400 }
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

    console.log(`Welcome email triggered for [${userEmail}] role [${role}]`);

    return NextResponse.json({ success: true, result: res });
  } catch (err) {
    console.error('Welcome API exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
