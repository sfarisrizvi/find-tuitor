'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { FileText, CheckCircle2, Clock, MapPin, Banknote, Edit3, X, AlertCircle, Calendar, User, BookOpen } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function ContractCard({ contract, currentUserId, onContractUpdated }) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [clientInfo, setClientInfo] = useState(null);
  const [childrenDetails, setChildrenDetails] = useState([]);

  useEffect(() => {
    if (!showViewModal || !contract?.client_id) return;
    let isCancelled = false;

    const fetchDetails = async () => {
      try {
        const supabase = createClient();

        // 1. Fetch client profile
        const { data: clientProf } = await supabase
          .from('client_profiles')
          .select('full_name, client_type, city, grade, subjects, school_college')
          .eq('id', contract.client_id)
          .maybeSingle();

        if (!isCancelled && clientProf) {
          setClientInfo(clientProf);
        }

        // 2. Fetch children details if child_ids present
        if (contract.child_ids && Array.isArray(contract.child_ids) && contract.child_ids.length > 0 && !contract.child_ids.includes('student_self')) {
          const { data: kids } = await supabase
            .from('children')
            .select('id, name, grade, subjects, school_college')
            .in('id', contract.child_ids);

          if (!isCancelled && kids) {
            setChildrenDetails(kids);
          }
        }
      } catch (err) {
        console.error('Error fetching client & child details:', err);
      }
    };

    fetchDetails();

    // Keydown listener for Esc key to close modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowViewModal(false);
        setShowReviseModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isCancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showViewModal, contract?.client_id, contract?.child_ids]);

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
      setShowViewModal(false);
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
      borderRadius: '20px',
      padding: '18px 20px',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      margin: '8px 0'
    }}>
      {/* Header Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--brand-green-dark)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {contract.creator_role === 'tutor' ? 'Formal Tutor Contract' : 'Client Tuition Offer'}
          </span>
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: '999px',
          backgroundColor: badge.bg,
          color: badge.color
        }}>
          {badge.label}
        </span>
      </div>

      {/* Basic Info Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '14px', border: '1px solid var(--hairline-strong)' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>RATE &amp; PLAN</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-green-dark)', marginTop: '2px' }}>
            PKR {Number(contract.amount).toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--steel)', fontWeight: 500 }}>/{contract.payment_plan}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>DURATION</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
            {contract.duration_value} {contract.duration_unit}(s)
          </div>
        </div>

        <div style={{ gridColumn: 'span 2', paddingTop: '4px', borderTop: '1px solid var(--hairline-soft)' }}>
          <div style={{ fontSize: '10px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>TEACHING MODE</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize', marginTop: '2px' }}>
            {contract.mode.replace('-', ' ')}
          </div>
        </div>
      </div>

      {/* Revision Notice if applicable */}
      {isRevision && contract.revision_feedback && (
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', marginBottom: '14px', lineHeight: '1.4' }}>
          <strong>Requested Revision Note:</strong> &quot;{contract.revision_feedback}&quot;
        </div>
      )}

      {/* Action Buttons: strictly 2 buttons (View Terms & Approve) */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          onClick={() => setShowViewModal(true)}
          variant="secondary"
          style={{ flex: 1, borderRadius: '999px', height: '40px', fontSize: '13px', fontWeight: 700 }}
        >
          View Terms
        </Button>

        {!isCreator && isPending && (
          <Button
            onClick={() => setShowViewModal(true)}
            variant="primary"
            style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', height: '40px', fontSize: '13px', fontWeight: 700 }}
          >
            Approve
          </Button>
        )}
      </div>

      {/* View Details & Approve Modal */}
      {showViewModal && (
        <div
          onClick={() => setShowViewModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: '24px',
              maxWidth: '540px', width: '100%',
              padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="var(--brand-green-dark)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                    {contract.creator_role === 'tutor' ? 'Tutor Contract Details' : 'Tuition Offer Details'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--steel)' }}>
                    Review terms before approving or requesting adjustments
                  </p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', color: 'var(--ink)' }}>
              
              {/* Student & Parent Details Box */}
              <div style={{ backgroundColor: 'var(--surface)', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--hairline-strong)' }}>
                <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <User size={14} color="var(--brand-green)" /> Student &amp; Parent Profile
                </div>
                
                <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                    Parent / Client: {clientInfo?.full_name || 'Client Household'}
                  </div>

                  {childrenDetails.length > 0 ? (
                    childrenDetails.map(kid => (
                      <div key={kid.id} style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: 'var(--canvas)', borderRadius: '12px', border: '1px solid var(--hairline-soft)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brand-green-dark)' }}>Student: {kid.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '2px' }}>
                          Grade Level: {kid.grade || 'General'} {kid.school_college ? `· ${kid.school_college}` : ''}
                        </div>
                        {kid.subjects && (
                          <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '4px', fontWeight: 500 }}>
                            Subjects: {Array.isArray(kid.subjects) ? kid.subjects.join(', ') : kid.subjects}
                          </div>
                        )}
                      </div>
                    ))
                  ) : clientInfo?.client_type === 'student' ? (
                    <div style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: 'var(--canvas)', borderRadius: '12px', border: '1px solid var(--hairline-soft)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-green-dark)' }}>Direct Student: {clientInfo.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '2px' }}>
                        Grade Level: {clientInfo.grade || 'General'} {clientInfo.school_college ? `· ${clientInfo.school_college}` : ''}
                      </div>
                      {clientInfo.subjects && (
                        <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '4px', fontWeight: 500 }}>
                          Subjects: {Array.isArray(clientInfo.subjects) ? clientInfo.subjects.join(', ') : clientInfo.subjects}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '4px' }}>
                      General tuition agreement for parent household
                    </div>
                  )}
                </div>
              </div>

              {/* Highlight Boxes for Key Attributes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                
                {/* Rate Box */}
                <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '16px', border: '1px solid var(--hairline-strong)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Banknote size={14} color="var(--brand-green)" /> Rate &amp; Payment Plan
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-green-dark)', fontSize: '17px', marginTop: '4px' }}>
                    PKR {Number(contract.amount).toLocaleString()}
                    <span style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 500 }}> /{contract.payment_plan}</span>
                  </div>
                </div>

                {/* Duration Box */}
                <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '16px', border: '1px solid var(--hairline-strong)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--brand-green)" /> Contract Duration
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '16px', marginTop: '4px' }}>
                    {contract.duration_value} {contract.duration_unit}(s)
                  </div>
                </div>

                {/* Mode Box */}
                <div style={{ gridColumn: 'span 2', backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '16px', border: '1px solid var(--hairline-strong)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--brand-green)" /> Preferred Teaching Mode
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '15px', marginTop: '4px', textTransform: 'capitalize' }}>
                    {contract.mode.replace('-', ' ')}
                  </div>
                </div>

              </div>

              {/* Full Terms Box */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: 'var(--ink)', marginBottom: '8px' }}>
                  Full Contract Terms &amp; Expectations:
                </label>
                <div style={{
                  backgroundColor: 'var(--surface)',
                  padding: '16px',
                  borderRadius: '16px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontSize: '13px',
                  color: 'var(--ink)',
                  border: '1px solid var(--hairline-strong)',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {contract.terms}
                </div>
              </div>

              {/* Agreement Checkbox */}
              {!isCreator && isPending && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '6px', padding: '14px', borderRadius: '16px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--brand-green)' }}>
                  <input
                    type="checkbox"
                    id={`agree-terms-modal-${contract.id}`}
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--brand-green)', cursor: 'pointer' }}
                  />
                  <label htmlFor={`agree-terms-modal-${contract.id}`} style={{ fontSize: '13px', color: 'var(--ink)', cursor: 'pointer', lineHeight: '1.4', fontWeight: 500 }}>
                    I accept and agree to the proposed tuition terms and authorize commencement.
                  </label>
                </div>
              )}

              {/* Action Buttons inside Modal: ONLY 2 buttons (Request Revision & Approve) */}
              {!isCreator && isPending && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowReviseModal(true)}
                    style={{ borderRadius: '999px', flex: 1, height: '44px', fontWeight: 700, color: '#D97706', borderColor: '#FCD34D', backgroundColor: '#FFFBEB' }}
                  >
                    <Edit3 size={15} /> Request Revision
                  </Button>

                  <Button
                    onClick={handleApprove}
                    variant="primary"
                    disabled={submitting || !agreeTerms}
                    style={{ flex: 1.2, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', height: '44px', fontWeight: 700 }}
                  >
                    {submitting ? 'Approving...' : 'Approve & Start'}
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Modify / Revise Feedback Sub-Modal */}
      {showReviseModal && (
        <div
          onClick={() => setShowReviseModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: '24px',
              maxWidth: '480px', width: '100%',
              padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
            }}
          >
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
