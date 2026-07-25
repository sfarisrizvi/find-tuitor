import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimiter, buildRateLimitHeaders } from '@/lib/security/rateLimiter';
import { sanitizePayload, validatePayloadSize } from '@/lib/security/sanitizer';
import { respondWithError, respondWithSuccess, generateTraceId } from '@/lib/security/logger';

export async function POST(request) {
  const traceId = generateTraceId();

  try {
    // 1. Validate Payload Size (Strict 10KB limit for small public forms)
    if (!(await validatePayloadSize(request, 10240))) {
      return respondWithError({ status: 413, message: 'Payload Too Large', traceId });
    }

    // 2. Strict Rate Limiting (5 requests per 15 minutes to prevent spam)
    const rateResult = rateLimiter(request, { limit: 5, windowSeconds: 900, keyPrefix: 'demo_request' });
    const headers = buildRateLimitHeaders(rateResult);
    
    if (!rateResult.success) {
      return respondWithError({ status: 429, message: 'Too Many Demo Requests. Please try again later.', traceId });
    }

    // 3. Extract and Sanitize Payload
    const rawPayload = await request.json();
    const payload = sanitizePayload(rawPayload);
    const { tutorId, clientEmail, clientName, clientPhone, subject, message } = payload;

    // 4. Validate Inputs
    if (!tutorId || !clientEmail || !clientName) {
      return respondWithError({ status: 400, message: 'Missing required fields: tutorId, clientEmail, clientName', traceId });
    }

    // 5. Init Supabase Admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 6. DB Operation (Insert into a demo_requests table, assuming it exists or using contact_queries as fallback)
    const { data: demoData, error: demoError } = await supabaseAdmin.from('contact_queries').insert([{
      name: clientName,
      email: clientEmail,
      subject: `Demo Request for Tutor ${tutorId} - ${subject || 'General'}`,
      message: `Phone: ${clientPhone || 'N/A'}\nMessage: ${message || 'No additional message.'}`,
      status: 'new'
    }]);

    if (demoError) {
      console.warn(`[${traceId}] Falling back: contact_queries failed, DB might not be ready.`, demoError);
      throw demoError;
    }

    // 7. Fire Async Notification to Tutor
    // Get tutor details first to know email
    const { data: tutor } = await supabaseAdmin.from('tutor_profiles').select('email, full_name, id').eq('id', tutorId).single();
    if (tutor && tutor.email) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           userId: tutor.id,
           userEmail: tutor.email,
           userName: tutor.full_name,
           type: 'demo_requested',
           actionUrl: `/tutor/dashboard`,
           clientName,
           subject
         })
      }).catch(err => console.error(`[${traceId}] Background demo notification error:`, err));
    }

    return respondWithSuccess({ status: 'success', message: 'Demo request sent successfully.' }, 201, headers);

  } catch (error) {
    return respondWithError({ error, status: 500, traceId });
  }
}
