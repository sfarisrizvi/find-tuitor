import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '../../../utils/supabase/server';
import { sendNotification } from '../../../lib/notifications';
import { filterContactInfo } from '../../../lib/chatSecurity';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper: Mask name for client privacy (e.g. "Ahmed Khan" -> "Ahmed K.")
function formatReviewerName(fullName) {
  if (!fullName) return 'Verified Parent';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

// ----------------------------------------------------
// GET: Fetch verified reviews for a tutor or contract
// ----------------------------------------------------
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutor_id');
    const contractId = searchParams.get('contract_id');

    // Scenario A: Check review status for a specific contract
    if (contractId) {
      const { data: reviews, error } = await serviceClient
        .from('contract_reviews')
        .select('*')
        .eq('contract_id', contractId);

      if (error) throw error;
      return NextResponse.json({ reviews: reviews || [] });
    }

    // Scenario B: Fetch public published reviews for a tutor
    if (tutorId) {
      const { data: reviews, error } = await serviceClient
        .from('contract_reviews')
        .select(`
          id,
          contract_id,
          reviewer_id,
          reviewer_role,
          overall_rating,
          subject_mastery,
          punctuality,
          communication,
          recommend_score,
          feedback_text,
          response_text,
          responded_at,
          is_verified_hire,
          created_at,
          contracts (
            subjects,
            mode,
            payment_plan,
            duration_value,
            duration_unit,
            created_at
          )
        `)
        .eq('reviewee_id', tutorId)
        .eq('reviewer_role', 'client')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Collect reviewer profiles to display formatted names
      const reviewerIds = [...new Set((reviews || []).map(r => r.reviewer_id))];
      let reviewerMap = {};

      if (reviewerIds.length > 0) {
        const { data: profiles } = await serviceClient
          .from('client_profiles')
          .select('id, full_name, city, avatar_url')
          .in('id', reviewerIds);

        if (profiles) {
          profiles.forEach(p => {
            reviewerMap[p.id] = p;
          });
        }
      }

      // Format reviews with verified metadata
      let totalMastery = 0;
      let totalPunctuality = 0;
      let totalComm = 0;
      let dimCount = 0;

      const formatted = (reviews || []).map(rev => {
        const prof = reviewerMap[rev.reviewer_id] || {};
        if (rev.subject_mastery) {
          totalMastery += rev.subject_mastery;
          totalPunctuality += rev.punctuality || rev.subject_mastery;
          totalComm += rev.communication || rev.subject_mastery;
          dimCount++;
        }

        return {
          id: rev.id,
          contract_id: rev.contract_id,
          reviewer_name: formatReviewerName(prof.full_name),
          reviewer_city: prof.city || 'Pakistan',
          reviewer_avatar: prof.avatar_url || null,
          overall_rating: Number(rev.overall_rating),
          subject_mastery: rev.subject_mastery,
          punctuality: rev.punctuality,
          communication: rev.communication,
          recommend_score: rev.recommend_score,
          feedback_text: rev.feedback_text,
          response_text: rev.response_text,
          responded_at: rev.responded_at,
          is_verified_hire: rev.is_verified_hire,
          created_at: rev.created_at,
          tuition_details: {
            subjects: rev.contracts?.subjects || [],
            mode: rev.contracts?.mode || 'online',
            duration: rev.contracts?.duration_value ? `${rev.contracts.duration_value} ${rev.contracts.duration_unit}(s)` : null,
            contract_date: rev.contracts?.created_at
          }
        };
      });

      return NextResponse.json({
        reviews: formatted,
        total: formatted.length,
        dimensions: dimCount > 0 ? {
          subject_mastery: +(totalMastery / dimCount).toFixed(1),
          punctuality: +(totalPunctuality / dimCount).toFixed(1),
          communication: +(totalComm / dimCount).toFixed(1),
        } : null
      });
    }

    return NextResponse.json({ error: 'Missing tutor_id or contract_id parameter.' }, { status: 400 });
  } catch (err) {
    console.error('Error in reviews GET:', err);
    return NextResponse.json({ error: err.message || 'Server error fetching reviews.' }, { status: 500 });
  }
}

// ----------------------------------------------------
// POST: Submit a Verified Review (Closed-Loop)
// ----------------------------------------------------
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please login to submit a review.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      contract_id,
      overall_rating,
      subject_mastery,
      punctuality,
      communication,
      recommend_score = true,
      feedback_text,
      private_feedback
    } = body;

    // 1. Validation
    if (!contract_id || !overall_rating || !feedback_text) {
      return NextResponse.json({ error: 'Missing required review fields (contract, rating, feedback).' }, { status: 400 });
    }

    const numRating = Number(overall_rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Overall rating must be between 1.0 and 5.0 stars.' }, { status: 400 });
    }

    const trimmedFeedback = feedback_text.trim();
    if (trimmedFeedback.length < 10) {
      return NextResponse.json({ error: 'Please provide at least 10 characters of detailed feedback.' }, { status: 400 });
    }

    // 2. Fetch and verify contract authenticity
    const { data: contract, error: contractErr } = await serviceClient
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .single();

    if (contractErr || !contract) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    // Check caller is a verified party
    const isClient = contract.client_id === user.id;
    const isTutor = contract.tutor_id === user.id;

    if (!isClient && !isTutor) {
      return NextResponse.json({ error: 'Forbidden: You are not a participant in this contract.' }, { status: 403 });
    }

    // Contract must be approved, active, or completed
    if (!['approved', 'active', 'completed'].includes(contract.status)) {
      return NextResponse.json({ error: 'Reviews are only permitted for approved, active, or completed tuition contracts.' }, { status: 400 });
    }

    const reviewerId = user.id;
    const revieweeId = isClient ? contract.tutor_id : contract.client_id;
    const reviewerRole = isClient ? 'client' : 'tutor';

    // Anti-self review check
    if (reviewerId === revieweeId) {
      return NextResponse.json({ error: 'Anti-fraud policy violation: You cannot review your own account.' }, { status: 400 });
    }

    // 3. Check for existing review (Unique constraint check)
    const { data: existingRev } = await serviceClient
      .from('contract_reviews')
      .select('id')
      .eq('contract_id', contract_id)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();

    if (existingRev) {
      return NextResponse.json({ error: 'You have already submitted a review for this contract.' }, { status: 400 });
    }

    // 4. Contact filter security check on public feedback
    const { filteredText, hasViolation } = filterContactInfo(trimmedFeedback);
    const sanitizedFeedback = hasViolation ? filteredText : trimmedFeedback;

    // 5. Insert Review
    const { data: newReview, error: insertErr } = await serviceClient
      .from('contract_reviews')
      .insert({
        contract_id,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        reviewer_role: reviewerRole,
        overall_rating: numRating,
        subject_mastery: subject_mastery ? Math.min(5, Math.max(1, Number(subject_mastery))) : Math.round(numRating),
        punctuality: punctuality ? Math.min(5, Math.max(1, Number(punctuality))) : Math.round(numRating),
        communication: communication ? Math.min(5, Math.max(1, Number(communication))) : Math.round(numRating),
        recommend_score: Boolean(recommend_score),
        feedback_text: sanitizedFeedback,
        private_feedback: private_feedback?.trim() || null,
        is_verified_hire: true,
        status: 'published'
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 6. Ensure contract is marked completed if it was active
    if (contract.status !== 'completed') {
      await serviceClient
        .from('contracts')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', contract_id);
    }

    // 7. Dispatch Notification to Reviewee
    const revieweeTable = isClient ? 'tutor_profiles' : 'client_profiles';
    const { data: revieweeProf } = await serviceClient
      .from(revieweeTable)
      .select('full_name, email')
      .eq('id', revieweeId)
      .maybeSingle();

    if (revieweeProf) {
      const notifTitle = `⭐ New ${numRating}★ Verified Review Received!`;
      const notifMsg = `${isClient ? 'A parent' : 'Your tutor'} left a verified review: "${sanitizedFeedback.slice(0, 80)}${sanitizedFeedback.length > 80 ? '...' : ''}"`;
      const actionUrl = isClient ? `/tutors/${revieweeId}` : '/client/dashboard';

      await sendNotification({
        userId: revieweeId,
        userEmail: revieweeProf.email,
        userName: revieweeProf.full_name || 'User',
        title: notifTitle,
        message: notifMsg,
        type: 'contract',
        priority: 'MEDIUM',
        actionUrl,
        templateName: 'contract_notice',
        templateData: {
          TITLE: notifTitle,
          MESSAGE: notifMsg,
          ACTION_URL: `https://tutoronline.pk${actionUrl}`
        }
      });
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (err) {
    console.error('Error in reviews POST:', err);
    return NextResponse.json({ error: err.message || 'Server error submitting review.' }, { status: 500 });
  }
}

// ----------------------------------------------------
// PATCH: Tutor / Reviewee Public Response
// ----------------------------------------------------
export async function PATCH(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { review_id, response_text } = body;

    if (!review_id || !response_text?.trim()) {
      return NextResponse.json({ error: 'Missing review ID or response text.' }, { status: 400 });
    }

    // Check reviewee ownership
    const { data: review, error: fetchErr } = await serviceClient
      .from('contract_reviews')
      .select('*')
      .eq('id', review_id)
      .single();

    if (fetchErr || !review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    if (review.reviewee_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: Only the tutor/reviewee can respond to this review.' }, { status: 403 });
    }

    const { filteredText } = filterContactInfo(response_text.trim());

    const { data: updated, error: updateErr } = await serviceClient
      .from('contract_reviews')
      .update({
        response_text: filteredText,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', review_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, review: updated });
  } catch (err) {
    console.error('Error in reviews PATCH:', err);
    return NextResponse.json({ error: err.message || 'Server error updating response.' }, { status: 500 });
  }
}
