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

// GET: Fetch all tutors and clients profiles
export async function GET(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Fetch tutor profiles
    const { data: tutors, error: tutorError } = await supabaseAdmin
      .from('tutor_profiles')
      .select('id, full_name, email, city, status, is_suspended, created_at, phone')
      .order('created_at', { ascending: false });

    if (tutorError) {
      console.error('API Admin Users GET Tutors Error:', tutorError);
    }

    // 2. Fetch client profiles
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('client_profiles')
      .select('id, full_name, email, city, status, is_suspended, client_type, created_at, phone')
      .order('created_at', { ascending: false });

    if (clientError) {
      console.error('API Admin Users GET Clients Error:', clientError);
    }

    const formattedTutors = (tutors || []).map(t => ({
      id: t.id,
      name: t.full_name || 'Tutor User',
      email: t.email || 'N/A',
      phone: t.phone || '',
      city: t.city || 'N/A',
      role: 'Tutor',
      roleKey: 'tutor',
      status: t.is_suspended || t.status === 'suspended' || t.status === 'Suspended' ? 'Suspended' : 'Active',
      joined: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 2026',
      rawDate: t.created_at || new Date().toISOString()
    }));

    const formattedClients = (clients || []).map(c => ({
      id: c.id,
      name: c.full_name || 'Client User',
      email: c.email || 'N/A',
      phone: c.phone || '',
      city: c.city || 'N/A',
      role: c.client_type === 'parent' ? 'Parent' : c.client_type === 'student' ? 'Student' : 'Client',
      roleKey: 'client',
      status: c.is_suspended || c.status === 'suspended' || c.status === 'Suspended' ? 'Suspended' : 'Active',
      joined: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 2026',
      rawDate: c.created_at || new Date().toISOString()
    }));

    const allUsers = [...formattedTutors, ...formattedClients].sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );

    return NextResponse.json({ users: allUsers }, { status: 200 });
  } catch (err) {
    console.error('API Admin Users GET Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Batch or single action (suspend / activate)
export async function POST(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, action } = body; // items: [{ id: string, roleKey: 'tutor' | 'client' }]

    if (!Array.isArray(items) || items.length === 0 || !['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const isSuspend = action === 'suspend';
    const newStatus = isSuspend ? 'Suspended' : 'Active';

    const tutorIds = items.filter(i => i.roleKey === 'tutor').map(i => i.id);
    const clientIds = items.filter(i => i.roleKey === 'client').map(i => i.id);

    // Update tutors
    if (tutorIds.length > 0) {
      const { error: tErr } = await supabaseAdmin
        .from('tutor_profiles')
        .update({ status: newStatus, is_suspended: isSuspend })
        .in('id', tutorIds);
      if (tErr) console.error('Error updating tutor status:', tErr);
    }

    // Update clients
    if (clientIds.length > 0) {
      const { error: cErr } = await supabaseAdmin
        .from('client_profiles')
        .update({ status: newStatus, is_suspended: isSuspend })
        .in('id', clientIds);
      if (cErr) console.error('Error updating client status:', cErr);
    }

    return NextResponse.json({ success: true, count: items.length, action }, { status: 200 });
  } catch (err) {
    console.error('API Admin Users POST Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Batch or single deletion
export async function DELETE(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // items: [{ id: string, roleKey: 'tutor' | 'client' }]

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items provided' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const tutorIds = items.filter(i => i.roleKey === 'tutor').map(i => i.id);
    const clientIds = items.filter(i => i.roleKey === 'client').map(i => i.id);

    // Delete tutor profiles
    if (tutorIds.length > 0) {
      const { error: tErr } = await supabaseAdmin
        .from('tutor_profiles')
        .delete()
        .in('id', tutorIds);
      if (tErr) console.error('Error deleting tutor profiles:', tErr);
    }

    // Delete client profiles
    if (clientIds.length > 0) {
      const { error: cErr } = await supabaseAdmin
        .from('client_profiles')
        .delete()
        .in('id', clientIds);
      if (cErr) console.error('Error deleting client profiles:', cErr);
    }

    // Attempt auth user deletion for full cleanup
    const allIds = items.map(i => i.id);
    for (const userId of allIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (aErr) {
        console.warn(`Auth deletion warning for ${userId}:`, aErr.message);
      }
    }

    return NextResponse.json({ success: true, count: items.length }, { status: 200 });
  } catch (err) {
    console.error('API Admin Users DELETE Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
