import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data, error } = await supabaseAdmin
      .from('tutor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API Admin KYC GET Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] }, { status: 200 });
  } catch (err) {
    console.error('API Admin KYC GET Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tutorId, tutorIds, action, rejectionNotes } = body;

    const idsToProcess = tutorIds || (tutorId ? [tutorId] : []);
    if (idsToProcess.length === 0 || !['approve', 'reject', 'suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    let updatePayload = {};
    if (action === 'approve') {
      updatePayload = { kyc_status: 'approved', verified: true };
    } else if (action === 'reject') {
      updatePayload = { kyc_status: 'rejected', verified: false, ...(rejectionNotes && { kyc_rejection_notes: rejectionNotes }) };
    } else if (action === 'suspend') {
      updatePayload = { status: 'Suspended', is_suspended: true };
    } else if (action === 'activate') {
      updatePayload = { status: 'Active', is_suspended: false };
    }

    const { data, error } = await supabaseAdmin
      .from('tutor_profiles')
      .update(updatePayload)
      .in('id', idsToProcess)
      .select();

    if (error) {
      console.error('API Admin KYC Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: idsToProcess.length, tutors: data }, { status: 200 });
  } catch (err) {
    console.error('API Admin KYC POST Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tutorIds } = body;

    if (!Array.isArray(tutorIds) || tutorIds.length === 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { error } = await supabaseAdmin
      .from('tutor_profiles')
      .delete()
      .in('id', tutorIds);

    if (error) {
      console.error('API Admin KYC DELETE Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attempt cleanup in auth.users
    for (const tId of tutorIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(tId);
      } catch (aErr) {
        console.warn(`Auth user delete warning for ${tId}:`, aErr.message);
      }
    }

    return NextResponse.json({ success: true, count: tutorIds.length }, { status: 200 });
  } catch (err) {
    console.error('API Admin KYC DELETE Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
