import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimiter, buildRateLimitHeaders } from '@/lib/security/rateLimiter';
import { sanitizePayload, validatePayloadSize } from '@/lib/security/sanitizer';
import { respondWithError, respondWithSuccess, generateTraceId } from '@/lib/security/logger';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(request) {
  const traceId = generateTraceId();

  try {
    // 1. Validate Payload Size
    if (!(await validatePayloadSize(request))) {
      return respondWithError({ status: 413, message: 'Payload Too Large', traceId });
    }

    // 2. Rate Limiting (10 requests per minute for job creation)
    const rateResult = rateLimiter(request, { limit: 10, windowSeconds: 60, keyPrefix: 'jobs_api' });
    const headers = buildRateLimitHeaders(rateResult);
    
    if (!rateResult.success) {
      return respondWithError({ status: 429, message: 'Too Many Requests', traceId });
    }

    // 3. User Authentication & Authorization (using standard Next.js Supabase auth)
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return respondWithError({ status: 401, message: 'Unauthorized session', traceId });
    }

    // 4. Extract and Sanitize Payload
    const rawPayload = await request.json();
    const payload = sanitizePayload(rawPayload);
    const { 
      title, child_id, subject, mode, budget_type, budget_amount, client_type,
      grade_level, city, area, duration, hours_per_week, gender_preference, description 
    } = payload;

    // 5. Basic Validation
    if (!title || !subject || !mode) {
      return respondWithError({ status: 400, message: 'Missing required fields: title, subject, mode', traceId });
    }

    // 6. DB Operation with Service Role to bypass client-side RLS risks
    // Actually, creating a job can be done via RLS by standard user, but since the requirement is
    // "All calls must be passed through our server", we use service role or just standard user token here.
    // For maximal security and to hide database topology completely, using Service Role is acceptable
    // since we already explicitly verified the user's session token above.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the job mapping to the authenticated user ID
    const insertData = {
      client_id: user.id,
      child_id: client_type === 'parent' ? child_id : null,
      title: title,
      subject: subject,
      mode: mode,
      budget_type: budget_type,
      budget_amount: budget_amount,
      grade_level: grade_level,
      city: city || null,
      area: area || null,
      duration: duration || null,
      hours_per_week: hours_per_week || null,
      gender_preference: gender_preference || 'Any Gender',
      description: description || null,
      status: 'open' // Default status
    };

    const { data, error } = await supabaseAdmin.from('jobs').insert([insertData]).select().single();

    if (error) throw error;

    return respondWithSuccess({ job: data, status: 'success' }, 201, headers);
  } catch (error) {
    return respondWithError({ error, status: 500, traceId });
  }
}

export async function PATCH(request) {
  const traceId = generateTraceId();
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return respondWithError({ status: 401, message: 'Unauthorized', traceId });
    
    const payload = await request.json();
    const { jobId, status } = sanitizePayload(payload);
    
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabaseAdmin.from('jobs').update({ status }).eq('id', jobId).eq('client_id', user.id);
    
    if (error) throw error;
    return respondWithSuccess({ status: 'success' }, 200);
  } catch (error) {
    return respondWithError({ error, status: 500, traceId });
  }
}

export async function DELETE(request) {
  const traceId = generateTraceId();
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return respondWithError({ status: 401, message: 'Unauthorized', traceId });
    
    const payload = await request.json();
    const { jobId } = sanitizePayload(payload);
    
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Delete proposals first (if not cascading)
    await supabaseAdmin.from('proposals').delete().eq('job_id', jobId);
    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', jobId).eq('client_id', user.id);
    
    if (error) throw error;
    return respondWithSuccess({ status: 'success' }, 200);
  } catch (error) {
    return respondWithError({ error, status: 500, traceId });
  }
}
