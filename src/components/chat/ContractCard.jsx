'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FileText, CheckCircle2, Clock, MapPin, DollarSign, Edit3, X, AlertCircle } from 'lucide-react';

export function ContractCard({ contract, currentUserId, onContractUpdated }) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!contract) return null;

  const isCreator = contract.creator_role === 'tutor' 
    ? currentUserId === contract.tutor_id 
    : currentUserId === contract.client_id;

  const isPending = contract.status === 'pending';
  const isApproved = contract.status === 'approved' || contract.status === 'active';
  const isRevision = contract.status === 'revision_requested';

  const handleApprove = async () => {
    if (!agreeTerms) {
      setError('Please accept the agreement checkbox to approve.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/chat/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_contract',
          contract_id: contract.id,
          user_id: currentUserId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve contract.');

      setShowViewModal(false);
      onContractUpdated(data.contract);
    } catch (err) {
      console.error('Error approving contract:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRevision = async (e) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/chat/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise_contract',
          contract_id: contract.id,
          user_id: currentUserId,
          revision_feedback: revisionFeedback.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send revision request.');

      setShowReviseModal(false);
      onContractUpdated(data.contract);
    } catch (err) {
      console.error('Error requesting revision:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeStyle = () => {
    if (isApproved) {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', label: 'APPROVED & ACTIVE' };
    }
    if (isRevision) {
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', label: 'REVISION REQUESTED' };
    }
    return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', label: 'PENDING APPROVAL' };
  };

  const badge = getStatusBadgeStyle();

  return (
    <div style={{
      backgroundColor: 'var(--canvas)',
      border: '1px solid var(--hairline-strong)',
      borderRadius: '18px',
      padding: '16px 20px',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      margin: '8px 0'
    }}>
      {/* Header Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--brand-green-dark)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {contract.creator_role === 'tutor' ? 'Formal Tutor Contract' : 'Client Tuition Offer'}
          </span>
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '999px',
          backgroundColor: badge.bg,
          color: badge.color
        }}>
          {badge.label}
        </span>
      </div>

      {/* Basic Info Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 600 }}>Rate & Plan</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>
            PKR {Number(contract.amount).toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--steel)', fontWeight: 500 }}>/{contract.payment_plan}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
            {contract.duration_value} {contract.duration_unit}(s)
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 600 }}>Teaching Mode</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>
            {contract.mode.replace('-', ' ')}
          </div>
        </div>
      </div>

      {/* Revision Notice if applicable */}
      {isRevision && contract.revision_feedback && (
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', lineHeight: '1.4' }}>
          <strong>Requested Revision Note:</strong> &quot;{contract.revision_feedback}&quot;
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          onClick={() => setShowViewModal(true)}
          variant="secondary"
          style={{ flex: 1, borderRadius: '999px', height: '36px', fontSize: '12px', fontWeight: 600 }}
        >
          View Terms
        </Button>

        {!isCreator && isPending && (
          <>
            <Button
              onClick={() => setShowReviseModal(true)}
              variant="secondary"
              style={{ borderRadius: '999px', height: '36px', fontSize: '12px', fontWeight: 600 }}
            >
              <Edit3 size={14} /> Revise
            </Button>
            <Button
              onClick={() => setShowViewModal(true)}
              variant="primary"
              style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', height: '36px', fontSize: '12px', fontWeight: 700 }}
            >
              Approve
            </Button>
          </>
        )}
      </div>

      {/* View & Approve Modal */}
      {showViewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '24px',
            maxWidth: '520px', width: '100%',
            padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>Contract Terms & Details</h3>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: 'var(--ink)' }}>
              <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--hairline-strong)' }}>
                <div style={{ fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '16px', marginBottom: '4px' }}>
                  PKR {Number(contract.amount).toLocaleString()} / {contract.payment_plan}
                </div>
                <div style={{ color: 'var(--steel)' }}>
                  Duration: {contract.duration_value} {contract.duration_unit}(s) · Mode: {contract.mode}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Full Terms & Agreements:</label>
                <div style={{ backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '13px', color: 'var(--steel)', border: '1px solid var(--hairline-strong)' }}>
                  {contract.terms}
                </div>
              </div>

              {!isCreator && isPending && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--brand-green)' }}>
                  <input
                    type="checkbox"
                    id={`agree-terms-${contract.id}`}
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)', cursor: 'pointer' }}
                  />
                  <label htmlFor={`agree-terms-${contract.id}`} style={{ fontSize: '13px', color: 'var(--ink)', cursor: 'pointer', lineHeight: '1.4' }}>
                    I agree to the proposed terms and authorize the commencement of this tuition engagement.
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ flex: 1, borderRadius: '999px' }}>
                  Close
                </Button>
                {!isCreator && isPending && (
                  <Button
                    onClick={handleApprove}
                    variant="primary"
                    disabled={submitting || !agreeTerms}
                    style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontWeight: 700 }}
                  >
                    {submitting ? 'Approving...' : 'Approve & Start Tuition'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify / Revise Feedback Modal */}
      {showReviseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '24px',
            maxWidth: '480px', width: '100%',
            padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>Request Revision / Changes</h3>
              <button onClick={() => setShowReviseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendRevision} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--steel)' }}>
                Specify what changes or adjustments you need (e.g. rate change, schedule adjustment) before approving:
              </p>

              <textarea
                rows={4}
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Type your feedback or required changes here..."
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid var(--hairline-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '12px',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
                required
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowReviseModal(false)} style={{ flex: 1, borderRadius: '999px' }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontWeight: 700 }}
                >
                  {submitting ? 'Sending...' : 'Send Revision Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
