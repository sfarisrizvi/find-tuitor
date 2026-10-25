'use client';
import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, ThumbsUp, MessageSquare, Reply, AlertCircle, Sparkles, BookOpen, MapPin, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

export function TutorReviewsSection({
  tutorId,
  isOwner = false,
  avgRating = null,
  reviewsCount = 0,
  jssScore = 100
}) {
  const [reviews, setReviews] = useState([]);
  const [dimensions, setDimensions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Replying state (for tutor owner)
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    if (!tutorId) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews?tutor_id=${tutorId}`);
        const data = await res.json();
        if (res.ok) {
          setReviews(data.reviews || []);
          setDimensions(data.dimensions || null);
        } else {
          setError(data.error || 'Failed to load reviews.');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Could not load reviews.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [tutorId]);

  const handlePostReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          response_text: replyText.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post reply.');

      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response_text: data.review.response_text, responded_at: data.review.responded_at } : r));
      setReplyingToId(null);
      setReplyText('');
    } catch (err) {
      alert(err.message || 'Error posting reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const hasReviews = reviews.length > 0;
  const displayRating = avgRating !== null ? avgRating.toFixed(1) : (hasReviews ? (reviews.reduce((a, b) => a + b.overall_rating, 0) / reviews.length).toFixed(1) : null);
  const recommendPercent = hasReviews ? Math.round((reviews.filter(r => r.recommend_score).length / reviews.length) * 100) : 100;

  return (
    <section style={{
      backgroundColor: 'var(--canvas)',
      borderRadius: 'var(--rounded-lg)',
      border: '1px solid var(--hairline)',
      padding: '28px',
      marginTop: '28px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--brand-green-dark)',
            backgroundColor: 'rgba(0, 104, 74, 0.08)',
            padding: '4px 10px',
            borderRadius: '999px',
            marginBottom: '8px'
          }}>
            <ShieldCheck size={14} /> 100% VERIFIED CLIENT REVIEWS
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
            Student &amp; Parent Feedback
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--stone)' }}>
            Only parents and students who have hired this tutor through an active contract can leave reviews.
          </p>
        </div>

        {hasReviews && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 104, 74, 0.06)',
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 104, 74, 0.15)'
          }}>
            <CheckCircle2 size={16} color="var(--brand-green-dark)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>
              {recommendPercent}% Would Recommend
            </span>
          </div>
        )}
      </div>

      {/* Aggregate Overview Card */}
      {hasReviews && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          backgroundColor: 'var(--surface-soft)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--hairline)',
          marginBottom: '28px'
        }}>
          {/* Big Score */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <div style={{ fontSize: '42px', fontWeight: 900, color: 'var(--ink)', lineHeight: '1' }}>
              {displayRating}
            </div>
            <div style={{ display: 'flex', gap: '3px', margin: '8px 0 4px 0' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={16}
                  fill={Math.round(Number(displayRating)) >= s ? '#F59E0B' : 'transparent'}
                  color={Math.round(Number(displayRating)) >= s ? '#F59E0B' : 'var(--hairline-strong)'}
                />
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 600 }}>
              Based on {reviews.length} verified review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Dimension Breakdown Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            {[
              { label: 'Subject Mastery', val: dimensions?.subject_mastery || displayRating },
              { label: 'Punctuality & Attendance', val: dimensions?.punctuality || displayRating },
              { label: 'Communication & Respect', val: dimensions?.communication || displayRating }
            ].map(dim => {
              const numVal = Number(dim.val) || 5;
              const pct = Math.min(100, Math.round((numVal / 5) * 100));
              return (
                <div key={dim.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    <span>{dim.label}</span>
                    <span style={{ color: '#D97706' }}>{numVal.toFixed(1)} / 5.0</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--hairline-strong)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--brand-green-dark)', borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--stone)', fontSize: '14px' }}>
          Loading verified reviews...
        </div>
      ) : !hasReviews ? (
        <div style={{
          textAlign: 'center',
          padding: '36px 20px',
          backgroundColor: 'var(--surface-soft)',
          borderRadius: '16px',
          border: '1px dashed var(--hairline-strong)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 104, 74, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--brand-green-dark)'
          }}>
            <Sparkles size={22} />
          </div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
            No Reviews Yet
          </h4>
          <p style={{ margin: '0 auto', maxWidth: '380px', fontSize: '13px', color: 'var(--stone)', lineHeight: '1.5' }}>
            This tutor hasn&apos;t completed a tuition contract on TutorOnline yet. Only confirmed students and parents can leave authentic reviews.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((rev) => {
            const dateStr = rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            const subjectsStr = Array.isArray(rev.tuition_details?.subjects) ? rev.tuition_details.subjects.join(', ') : '';
            const modeStr = rev.tuition_details?.mode ? rev.tuition_details.mode.replace('-', ' ') : '';

            return (
              <div
                key={rev.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--hairline)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header Row: Reviewer + Verified Badge + Date */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand-teal-deep, #001E2B)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {rev.reviewer_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{rev.reviewer_name}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--brand-green-dark)',
                          backgroundColor: 'rgba(0, 104, 74, 0.08)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <CheckCircle2 size={11} /> Verified Hire
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--stone)' }}>
                        {rev.reviewer_city} • {dateStr}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={rev.overall_rating >= s ? '#F59E0B' : 'transparent'}
                          color={rev.overall_rating >= s ? '#F59E0B' : 'var(--hairline-strong)'}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#D97706' }}>
                      {rev.overall_rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Tuition Context Metadata */}
                {(subjectsStr || modeStr) && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--steel)'
                  }}>
                    {subjectsStr && (
                      <span style={{ backgroundColor: 'var(--canvas)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--hairline)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={11} color="var(--brand-teal)" />
                        <span>{subjectsStr}</span>
                      </span>
                    )}
                    {modeStr && (
                      <span style={{ backgroundColor: 'var(--canvas)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--hairline)', textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} color="var(--brand-teal)" />
                        <span>{modeStr}</span>
                      </span>
                    )}
                    {rev.tuition_details?.duration && (
                      <span style={{ backgroundColor: 'var(--canvas)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--hairline)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} color="var(--brand-teal)" />
                        <span>{rev.tuition_details.duration}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Review Text */}
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--ink)',
                  lineHeight: '1.6'
                }}>
                  &ldquo;{rev.feedback_text}&rdquo;
                </p>

                {/* Tutor Response if present */}
                {rev.response_text && (
                  <div style={{
                    marginTop: '8px',
                    backgroundColor: 'rgba(0, 104, 74, 0.04)',
                    borderLeft: '3px solid var(--brand-green-dark)',
                    padding: '12px 14px',
                    borderRadius: '0 12px 12px 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--brand-green-dark)', marginBottom: '4px' }}>
                      <Reply size={13} style={{ transform: 'scaleX(-1)' }} />
                      <span>Response from Tutor</span>
                      {rev.responded_at && (
                        <span style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 400 }}>
                          • {new Date(rev.responded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--charcoal)', lineHeight: '1.5' }}>
                      {rev.response_text}
                    </p>
                  </div>
                )}

                {/* Tutor Owner Response Form (if no response yet and viewer is tutor) */}
                {isOwner && !rev.response_text && (
                  <div style={{ marginTop: '8px' }}>
                    {replyingToId === rev.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--surface-soft)', borderRadius: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                          Write a public reply to this review:
                        </label>
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Thank the parent or provide context..."
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            border: '1px solid var(--hairline-strong)',
                            padding: '8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--canvas)'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { setReplyingToId(null); setReplyText(''); }}
                            style={{ height: '30px', fontSize: '11px', padding: '0 10px' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            disabled={replySubmitting || !replyText.trim()}
                            onClick={() => handlePostReply(rev.id)}
                            style={{ height: '30px', fontSize: '11px', padding: '0 14px', backgroundColor: 'var(--brand-green-dark)', color: '#fff' }}
                          >
                            {replySubmitting ? 'Posting...' : 'Post Reply'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReplyingToId(rev.id); setReplyText(''); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--brand-green-dark)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                      >
                        <Reply size={13} style={{ transform: 'scaleX(-1)' }} />
                        Reply to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
