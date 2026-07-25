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

    // 2. Rate Limiting (20 requests per minute for onboarding setup)
    const rateResult = rateLimiter(request, { limit: 20, windowSeconds: 60, keyPrefix: 'client_onboarding' });
    const headers = buildRateLimitHeaders(rateResult);
    
    if (!rateResult.success) {
      return respondWithError({ status: 429, message: 'Too Many Requests', traceId });
    }

    // 3. User Authentication
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return respondWithError({ status: 401, message: 'Unauthorized session', traceId });
    }

    // 4. Extract and Sanitize Payload
    const rawPayload = await request.json();
    const payload = sanitizePayload(rawPayload);
    const { 
      action, 
      nextStep,
      clientType, 
      fullName, 
      phone, 
      city, 
      address, 
      studentGrade, 
      studentSchool, 
      studentSubjects, 
      childrenData 
    } = payload;

    // 5. Init Supabase Admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'SAVE_STEP') {
      const updatePayload = {
        full_name: fullName,
        phone,
        city,
        address,
        client_type: clientType,
        onboarding_step: nextStep
      };

      if (clientType === 'student') {
        updatePayload.grade = studentGrade;
        updatePayload.school_college = studentSchool;
        updatePayload.subjects = studentSubjects;
      }

      const { error: profileError } = await supabaseAdmin
        .from('client_profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sync children if parent
      if (clientType === 'parent' && nextStep === 4) { // Moving past details/children setup to step 4
        // We delete old ones first
        await supabaseAdmin.from('children').delete().eq('client_id', user.id);
        
        if (childrenData && childrenData.length > 0) {
          const inserts = childrenData.map(c => ({
            client_id: user.id,
            name: c.name,
            academic_route: c.grade, // fallback mapping
            grade: c.grade,
            school_college: c.school_college,
            subjects: c.subjects
          }));
          const { error: childError } = await supabaseAdmin.from('children').insert(inserts);
          if (childError) throw childError;
        }
      }

      return respondWithSuccess({ status: 'success', nextStep }, 200, headers);
    } 
    
    else if (action === 'COMPLETE') {
      const { error: completeError } = await supabaseAdmin
        .from('client_profiles')
        .update({
          onboarding_complete: true,
          onboarding_step: 4
        })
        .eq('id', user.id);

      if (completeError) throw completeError;

      return respondWithSuccess({ status: 'success' }, 200, headers);
    } 
    
    else {
      return respondWithError({ status: 400, message: 'Invalid action', traceId });
    }

  } catch (error) {
    return respondWithError({ error, status: 500, traceId });
  }
}
