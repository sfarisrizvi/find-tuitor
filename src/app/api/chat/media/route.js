import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server-side Supabase client with service role key (never exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_BUCKETS = ['chat-media', 'teacher-media', 'teacher-files', 'client-files'];

function parseStorageParams(searchParams) {
  let bucket = searchParams.get('bucket');
  let filePath = searchParams.get('path');
  const rawUrl = searchParams.get('url');

  if (rawUrl) {
    const match = rawUrl.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/([^?]+)/);
    if (match) {
      bucket = match[1];
      filePath = decodeURIComponent(match[2]);
    }
  }

  if (!bucket) bucket = 'chat-media';
  return { bucket, filePath };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { bucket, filePath } = parseStorageParams(searchParams);
    const customName = searchParams.get('name');

    if (!filePath) {
      return new NextResponse('Missing file path', { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return new NextResponse('Access to specified bucket is not permitted', { status: 403 });
    }

    // Prevent directory traversal attacks
    const cleanPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '');

    // ----------------------------------------------------
    // AUTHORIZATION MATRIX
    // ----------------------------------------------------
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();

    // Case 1: Sensitive KYC Documents & Transcripts (teacher-files & client-files)
    if (bucket === 'teacher-files' || bucket === 'client-files') {
      if (authErr || !user) {
        return new NextResponse('Unauthorized: Session required for sensitive KYC files', { status: 401 });
      }

      const isOwner = cleanPath.startsWith(`${user.id}/`);
      if (!isOwner) {
        // Check if caller is an administrator
        const { data: roleRecord } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleRecord?.role !== 'admin') {
          return new NextResponse('Forbidden: Access denied to this document', { status: 403 });
        }
      }
    }

    // Case 2: Private Chat Media & Voice Notes
    else if (bucket === 'chat-media') {
      if (authErr || !user) {
        return new NextResponse('Unauthorized: Session required for chat media', { status: 401 });
      }

      // Check admin status
      const { data: roleRecord } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = roleRecord?.role === 'admin';

      if (!isAdmin) {
        // Verify user is a sender or receiver of the message referencing this attachment
        const { data: msg } = await supabaseAdmin
          .from('messages')
          .select('id')
          .ilike('media_url', `%${cleanPath}%`)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .maybeSingle();

        if (!msg) {
          // Allow transient staging preview for freshly recorded/selected uploads (within 15 minutes)
          const timeMatch = cleanPath.match(/_(1[6-9][0-9]{11})_/);
          const isRecentUpload = timeMatch && (Date.now() - parseInt(timeMatch[1], 10) < 900000);
          if (!isRecentUpload) {
            return new NextResponse('Forbidden: You are not a participant in this conversation media', { status: 403 });
          }
        }
      }
    }

    // Case 3: Public profile assets (teacher-media: avatar and cover images)
    // Allowed for authenticated and public search browsing.

    // ----------------------------------------------------
    // DOWNLOAD & STREAM
    // ----------------------------------------------------
    const { data: blob, error: downloadErr } = await supabaseAdmin.storage
      .from(bucket)
      .download(cleanPath);

    if (downloadErr || !blob) {
      console.warn(`[API Gateway Media] Direct download error for ${bucket}/${cleanPath}:`, downloadErr?.message);

      // Fallback: Generate short-lived signed URL and redirect
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(cleanPath, 3600);

      if (signErr || !signed?.signedUrl) {
        return new NextResponse('File not found or inaccessible', { status: 404 });
      }

      return NextResponse.redirect(signed.signedUrl, {
        headers: { 'Cache-Control': 'private, max-age=3600, s-maxage=3600' }
      });
    }

    const arrayBuffer = await blob.arrayBuffer();
    const contentType = blob.type || 'application/octet-stream';
    const filename = customName || cleanPath.split('/').pop() || 'attachment';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': bucket === 'teacher-media' 
          ? 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
          : 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[API Gateway Media] Exception:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
