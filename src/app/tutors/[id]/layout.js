import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return {};

  if (id.startsWith('mock-')) {
    return {
      title: 'Mock Tutor | TutorOnline.pk',
      description: 'Mock tutor profile for TutorOnline.pk',
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        }
      }
    }
  );

  const { data: profile } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) {
    return {
      title: 'Tutor Not Found | TutorOnline.pk',
    };
  }

  // Calculate experience
  const { data: experience } = await supabase
    .from('tutor_experience')
    .select('year_from')
    .eq('tutor_id', id);

  let expText = '';
  if (experience && experience.length > 0) {
    let earliestYear = new Date().getFullYear();
    let hasAny = false;
    experience.forEach(e => {
      if (e.year_from) {
        hasAny = true;
        if (e.year_from < earliestYear) earliestYear = e.year_from;
      }
    });
    if (hasAny) {
      const diff = new Date().getFullYear() - earliestYear;
      expText = diff > 0 ? `${diff}+ Years` : '1 Year';
    }
  }

  const name = profile.full_name || 'Tutor';
  const city = profile.city || profile.area || 'Pakistan';
  const rating = profile.rating ? `${profile.rating.toFixed(1)} ⭐ (${profile.reviews_count || 0} reviews)` : 'New Tutor';
  
  // Format for OG description
  const expStr = expText ? ` | Exp: ${expText}` : '';
  const title = `${name} - Tutor in ${city} | TutorOnline.pk`;
  const description = `Rating: ${rating}${expStr} | City: ${city}. ${profile.bio || ''}`.trim();
  
  let avatarUrl = 'https://tutoronline.pk/default-og.png';
  if (profile.avatar_url) {
    if (profile.avatar_url.startsWith('http')) {
      avatarUrl = profile.avatar_url;
    } else {
      avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/teacher-media/${profile.avatar_url}`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://tutoronline.pk/tutors/${id}`,
      siteName: 'TutorOnline.pk',
      images: [
        {
          url: avatarUrl,
          width: 800,
          height: 800,
          alt: `${name} - Tutor Profile`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [avatarUrl],
    },
  };
}

export default function TutorProfileLayout({ children }) {
  return children;
}
