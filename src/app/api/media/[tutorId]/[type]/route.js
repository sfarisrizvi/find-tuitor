import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-side Supabase client with service role — never exposed to browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_MAP = {
  avatar:  { table: 'tutor_profiles', field: 'avatar_url',   bucket: 'teacher-media' },
  cover:   { table: 'tutor_profiles', field: 'cover_url',    bucket: 'teacher-media' },
};

// Cache signed URL in memory for up to 50 minutes
// (signed URLs are valid for 1 hour; we refresh at 50 min to avoid edge expiry)
const cache = new Map(); // key → { signedUrl, expiresAt }

export async function GET(request, { params }) {
  const { tutorId, type } = await params;

  const mapping = BUCKET_MAP[type];
  if (!mapping) {
    return new NextResponse('Unknown media type', { status: 400 });
  }

  // Cache key
  const cacheKey = `${tutorId}:${type}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.redirect(cached.signedUrl, {
      headers: { 'Cache-Control': 'public, max-age=2700, s-maxage=2700' },
    });
  }

  // Fetch path from DB server-side (never sent to browser)
  const { data: row, error: dbErr } = await supabase
    .from(mapping.table)
    .select(mapping.field)
    .eq('id', tutorId)
    .single();

  if (dbErr || !row || !row[mapping.field]) {
    return new NextResponse('Not found', { status: 404 });
  }

  const storagePath = row[mapping.field];

  // If path is already a full URL (legacy), extract just the path after bucket name
  let resolvedPath = storagePath;
  const bucketMarker = `/${mapping.bucket}/`;
  if (storagePath.includes(bucketMarker)) {
    resolvedPath = storagePath.split(bucketMarker)[1];
  }

  // Generate a 1-hour signed URL — path stays server-side only
  const { data: signed, error: signErr } = await supabase.storage
    .from(mapping.bucket)
    .createSignedUrl(resolvedPath, 3600); // 1 hour TTL

  if (signErr || !signed?.signedUrl) {
    return new NextResponse('Could not generate URL', { status: 500 });
  }

  // Cache for 50 min
  cache.set(cacheKey, {
    signedUrl: signed.signedUrl,
    expiresAt: Date.now() + 50 * 60 * 1000,
  });

  return NextResponse.redirect(signed.signedUrl, {
    headers: { 'Cache-Control': 'public, max-age=2700, s-maxage=2700' },
  });
}
