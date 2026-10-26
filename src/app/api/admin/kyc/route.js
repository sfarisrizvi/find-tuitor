
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

async function checkIsAdmin(supabaseUser, user) {
  if (!user) return false;

  // CRITICAL: Never trust client-controlled user_metadata for administrative authorization.
  // Role verification must exclusively query the database user_roles table.
  const { data: roleRecord } = await supabaseUser
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return roleRecord?.role === 'admin';
}

export async function GET(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(supabaseUser, user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    const isAdmin = await checkIsAdmin(supabaseUser, user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { tutorId, action, rejectionNotes } = body;

    if (!tutorId || !['approve', 'reject', 'set_verified'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const isApprove = action === 'approve';
    const updatePayload = {
      ...(action === 'approve' && { kyc_status: 'approved' }),
      ...(action === 'reject' && { kyc_status: 'rejected', ...(rejectionNotes && { kyc_rejection_notes: rejectionNotes }) }),
      ...(action === 'set_verified' && { verified: Boolean(body.verified) }),
      ...(body.verified !== undefined && action !== 'set_verified' && { verified: Boolean(body.verified) })
    };

    const { data, error } = await supabaseAdmin
      .from('tutor_profiles')
      .update(updatePayload)
      .eq('id', tutorId)
      .select()
      .single();

    if (error) {
      console.error('API Admin KYC Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tutor: data }, { status: 200 });
  } catch (err) {
    console.error('API Admin KYC POST Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
