import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, grade, school_college, subjects } = body;

    if (!name) {
      return NextResponse.json({ error: "Child's name is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload = {
      client_id: user.id,
      name,
      academic_route: grade || 'Primary',
      grade: grade || 'Primary',
      school_college: school_college || '',
      subjects: subjects || []
    };

    const { data, error } = await supabaseAdmin
      .from('children')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('API Children Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ child: data }, { status: 201 });
  } catch (err) {
    console.error('API Children POST Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, grade, school_college, subjects } = body;

    if (!id) {
      return NextResponse.json({ error: 'Child ID is required for update' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload = {
      name,
      academic_route: grade,
      grade,
      school_college,
      subjects
    };

    const { data, error } = await supabaseAdmin
      .from('children')
      .update(payload)
      .eq('id', id)
      .eq('client_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('API Children Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ child: data }, { status: 200 });
  } catch (err) {
    console.error('API Children PUT Exception:', err);
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabaseAdmin
      .from('children')
      .delete()
      .eq('id', id)
      .eq('client_id', user.id);

    if (error) {
      console.error('API Children Delete Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('API Children DELETE Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
