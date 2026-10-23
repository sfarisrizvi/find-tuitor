import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '../../../lib/notifications';
import { rateLimiter, buildRateLimitHeaders } from '@/lib/security/rateLimiter';
import { validatePayloadSize, sanitizePayload } from '@/lib/security/sanitizer';

export async function POST(request) {
  try {
    // 1. Validate Payload Size (Strict 10KB limit for contact submissions)
    if (!(await validatePayloadSize(request, 10240))) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    }

    // 2. Strict Rate Limiting (5 requests per 15 minutes per IP)
    const rateResult = rateLimiter(request, { limit: 5, windowSeconds: 900, keyPrefix: 'contact_form' });
    const rateHeaders = buildRateLimitHeaders(rateResult);

    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: rateHeaders }
      );
    }

    const rawBody = await request.json();
    const body = sanitizePayload(rawBody);
    const { name, email, phone, role, message, isVerified, timeSpentMs, honeypot } = body || {};

    // 3. Multi-Layer Anti-Bot Security Validation
    if (honeypot && honeypot.trim() !== '') {
      // Honeypot triggered by automated bot -> drop request silently
      return NextResponse.json(
        { success: true, message: 'Message sent successfully! We will get back to you shortly.' },
        { status: 200, headers: rateHeaders }
      );
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Security Check failed: Please complete the slide verification bar.' },
        { status: 400, headers: rateHeaders }
      );
    }

    if (typeof timeSpentMs === 'number' && timeSpentMs < 1500) {
      return NextResponse.json(
        { error: 'Security Check failed: Submission too fast.' },
        { status: 400, headers: rateHeaders }
      );
    }

    // 4. Strict Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400, headers: rateHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400, headers: rateHeaders }
      );
    }

    if (name.trim().length > 100 || message.trim().length > 3000) {
      return NextResponse.json(
        { error: 'Field length exceeds maximum limit.' },
        { status: 400, headers: rateHeaders }
      );
    }

    // 5. Initialize Supabase Server client using environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server database configuration is missing.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 6. Insert into contact_queries securely from server side
    const { error } = await supabase
      .from('contact_queries')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        role: role || 'parent_student',
        message: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Server error inserting contact query:', error);
      return NextResponse.json(
        { error: 'Failed to submit message to database.' },
        { status: 500 }
      );
    }

    // 7. Dispatch notification to admins
    try {
      const { data: adminUsers } = await supabase
        .rpc('get_admin_users')
        .catch(() => ({ data: null }));

      if (adminUsers && Array.isArray(adminUsers)) {
        for (const admin of adminUsers) {
          await sendNotification({
            userId: admin.id,
            userEmail: admin.email,
            userName: 'Admin',
            title: `New Inquiry from ${name.trim()}`,
            message: message.trim().substring(0, 100) + '...',
            type: 'contact_inquiry',
            priority: 'HIGH',
            actionUrl: '/admin/dashboard',
          });
        }
      }
    } catch (notifErr) {
      console.warn('Admin notification warning:', notifErr.message);
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully! We will get back to you shortly.' },
      { status: 200, headers: rateHeaders }
    );
  } catch (err) {
    console.error('Contact API Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
