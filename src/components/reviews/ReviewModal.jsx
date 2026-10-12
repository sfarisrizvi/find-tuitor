'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Star, X, CheckCircle2, ShieldCheck, ThumbsUp, ThumbsDown, MessageSquare, AlertCircle } from 'lucide-react';

const RATING_LABELS = {
  1: 'Unsatisfactory',
  2: 'Below Average',
  3: 'Average / Neutral',
  4: 'Good & Capable',
  5: 'Exceptional & Highly Recommended'
};

export function ReviewModal({
  isOpen,
  onClose,
  contract,
  reviewerRole = 'client',
  onReviewSubmitted
}) {
  const [overallRating, setOverallRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const [subjectMastery, setSubjectMastery] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [communication, setCommunication] = useState(5);

  const [recommendScore, setRecommendScore] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !contract) return null;

  const currentDisplayRating = hoverRating || overallRating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (feedbackText.trim().length < 10) {
      setError('Please provide at least 10 characters of detailed feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: contract.id,
          overall_rating: overallRating,
          subject_mastery: subjectMastery,
          punctuality: punctuality,
          communication: communication,
          recommend_score: recommendScore,
          feedback_text: feedbackText.trim(),
          private_feedback: privateFeedback.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSuccess(true);
      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted(data.review);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--canvas)',
          borderRadius: '24px',
          border: '1px solid var(--hairline-strong)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          padding: '28px',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--stone)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--brand-green-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
              Verified Review Published!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--stone)', maxWidth: '360px', margin: '0 auto' }}>
              Thank you for providing honest feedback. Your review has been permanently verified and linked to this tuition contract.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
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
                marginBottom: '10px'
              }}>
                <ShieldCheck size={14} /> 100% VERIFIED CONTRACT REVIEW
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                {reviewerRole === 'client' ? 'Review Your Tutor' : 'Review Your Student / Parent'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--stone)', margin: 0 }}>
                Your feedback helps maintain a trusted marketplace for Pakistani families and educators.
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Rating Stars */}
            <div style={{
              backgroundColor: 'var(--surface-soft)',
              padding: '20px',
              borderRadius: '18px',
              textAlign: 'center',
              marginBottom: '20px',
              border: '1px solid var(--hairline)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                OVERALL EXPERIENCE
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setOverallRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transform: currentDisplayRating >= star ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star
                      size={32}
                      fill={currentDisplayRating >= star ? '#F59E0B' : 'transparent'}
                      color={currentDisplayRating >= star ? '#F59E0B' : 'var(--hairline-strong)'}
                    />
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>
                {RATING_LABELS[currentDisplayRating]} ({currentDisplayRating}.0 / 5.0)
              </div>
            </div>

            {/* Dimension Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Performance Breakdown
              </div>

              {[
                { label: reviewerRole === 'client' ? 'Subject Mastery & Pedagogy' : 'Student Engagement', val: subjectMastery, set: setSubjectMastery },
                { label: 'Punctuality & Attendance', val: punctuality, set: setPunctuality },
                { label: 'Communication & Respect', val: communication, set: setCommunication }
              ].map((dim) => (
                <div key={dim.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--hairline)'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{dim.label}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => dim.set(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <Star
                          size={18}
                          fill={dim.val >= s ? '#F59E0B' : 'transparent'}
                          color={dim.val >= s ? '#F59E0B' : 'var(--hairline-strong)'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Would Recommend Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: 'var(--surface-soft)',
              border: '1px solid var(--hairline)',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                  {reviewerRole === 'client' ? 'Would you recommend this tutor to other families?' : 'Would you teach for this client again?'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--stone)' }}>
                  This impacts the public Job Success Score (JSS).
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRecommendScore(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: recommendScore ? 'var(--brand-green-dark)' : 'var(--hairline-strong)',
                    backgroundColor: recommendScore ? 'var(--brand-green-dark)' : 'var(--canvas)',
                    color: recommendScore ? '#fff' : 'var(--stone)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsUp size={13} /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendScore(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: !recommendScore ? '#EF4444' : 'var(--hairline-strong)',
                    backgroundColor: !recommendScore ? '#EF4444' : 'var(--canvas)',
                    color: !recommendScore ? '#fff' : 'var(--stone)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsDown size={13} /> No
                </button>
              </div>
            </div>

            {/* Written Review */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                  Public Feedback (Visible on Profile) *
                </label>
                <span style={{ fontSize: '11px', color: feedbackText.length < 10 ? '#EF4444' : 'var(--stone)' }}>
                  {feedbackText.length} / min 10 chars
                </span>
              </div>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience (e.g. teaching style, clarity of concepts, punctuality, results achieved)..."
                required
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid var(--hairline-strong)',
                  backgroundColor: 'var(--canvas)',
                  color: 'var(--ink)',
                  padding: '12px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Private Note to Admin */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MessageSquare size={14} color="var(--stone)" />
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--stone)' }}>
                  Private Feedback to TutorOnline Admins (Optional)
                </label>
              </div>
              <textarea
                rows={2}
                value={privateFeedback}
                onChange={(e) => setPrivateFeedback(e.target.value)}
                placeholder="Anything you'd like our admin team to know privately? (Not shown to public or tutor)"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid var(--hairline)',
                  backgroundColor: 'var(--surface-soft)',
                  color: 'var(--ink)',
                  padding: '10px 12px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                style={{ flex: 1, height: '44px', borderRadius: '999px', fontSize: '13px' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || feedbackText.trim().length < 10}
                style={{
                  flex: 1.5,
                  height: '44px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: 'var(--brand-green)',
                  color: 'var(--on-primary)'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Verified Review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
