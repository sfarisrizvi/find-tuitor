'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Send, Plus, Check, User, AlertCircle } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function ClientOfferModal({ isOpen, onClose, conversation, clientUser, tutorUser, onOfferCreated }) {
  const [children, setChildren] = useState([]);
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [clientType, setClientType] = useState('parent');
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // New Child Inline Form
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('Primary');
  const [newChildSchool, setNewChildSchool] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  // Form Fields
  const [terms, setTerms] = useState(
    '1. Parent/Student agrees to process payments according to the agreed schedule.\n2. Tutor will provide dedicated instruction matching selected subjects.\n3. Both parties agree to report attendance and progress through the platform.'
  );
  const [paymentPlan, setPaymentPlan] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('online');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState('month');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !clientUser?.id) return;
    let isCancelled = false;

    const fetchClientChildren = async () => {
      setLoadingChildren(true);
      try {
        const supabase = createClient();
        const { data: clientProf } = await supabase
          .from('client_profiles')
          .select('id, client_type')
          .eq('id', clientUser.id)
          .maybeSingle();

        if (isCancelled) return;

        if (clientProf?.client_type === 'student') {
          setClientType('student');
          setSelectedChildIds(['student_self']);
        } else {
          setClientType('parent');
          const { data: kids } = await supabase
            .from('children')
            .select('id, name, grade, subjects')
            .eq('client_id', clientUser.id);

          if (!isCancelled) {
            setChildren(kids || []);
            if (kids && kids.length > 0) {
              setSelectedChildIds([kids[0].id]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching client children:', err);
      } finally {
        if (!isCancelled) setLoadingChildren(false);
      }
    };

    fetchClientChildren();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, clientUser?.id]);

  if (!isOpen) return null;

  const toggleChildSelection = (childId) => {
    if (selectedChildIds.includes(childId)) {
      if (selectedChildIds.length > 1) {
        setSelectedChildIds(prev => prev.filter(id => id !== childId));
      }
    } else {
      setSelectedChildIds(prev => [...prev, childId]);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    setAddingChild(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('children')
        .insert({
          client_id: clientUser.id,
          name: newChildName.trim(),
          grade: newChildGrade,
          school_college: newChildSchool.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setChildren(prev => [...prev, data]);
      setSelectedChildIds(prev => [...prev, data.id]);
      setNewChildName('');
      setNewChildSchool('');
      setShowAddChildModal(false);
    } catch (err) {
      console.error('Error adding child:', err);
      alert('Failed to add child profile. Please try again.');
    } finally {
      setAddingChild(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid tuition rate/amount.');
      return;
    }
    if (!terms.trim()) {
      setError('Offer terms cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/chat/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_contract',
          conversation_id: conversation.id,
          tutor_id: tutorUser.id,
          client_id: clientUser.id,
          creator_role: 'client',
          child_ids: selectedChildIds,
          terms,
          payment_plan: paymentPlan,
          amount: parseFloat(amount),
          mode,
          duration_value: parseInt(durationValue),
          duration_unit: durationUnit
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create offer.');

      onOfferCreated(data.contract, data.message);
      onClose();
    } catch (err) {
      console.error('Error submitting offer:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--canvas)',
        border: '1px solid var(--hairline-strong)',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        padding: '28px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} color="var(--brand-green)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Send Direct Tuition Offer
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--steel)' }}>
                Propose rates and duration to tutor
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Child / Student Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                Select Student / Child(ren)
              </label>
              {clientType === 'parent' && (
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Add Child Profile
                </button>
              )}
            </div>

            {clientType === 'student' ? (
              <div style={{ padding: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--hairline-strong)', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                Direct Student Account
              </div>
            ) : children.length === 0 ? (
              <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px border-dashed var(--hairline-strong)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--steel)' }}>
                  You haven&apos;t added any child profiles yet.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddChildModal(true)}
                  style={{ borderRadius: '999px', fontSize: '12px', padding: '6px 16px' }}
                >
                  <Plus size={14} /> Add Child Details Now
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {children.map(child => {
                  const isChecked = selectedChildIds.includes(child.id);
                  return (
                    <div
                      key={child.id}
                      onClick={() => toggleChildSelection(child.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface)',
                        border: isChecked ? '1px solid var(--brand-green)' : '1px solid var(--hairline-strong)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={16} color={isChecked ? 'var(--brand-green)' : 'var(--steel)'} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{child.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--steel)' }}>Grade: {child.grade || 'Primary'}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--brand-green)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Plan & Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Payment Plan Offered
              </label>
              <select
                value={paymentPlan}
                onChange={(e) => setPaymentPlan(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '12px',
                  border: '1px solid var(--hairline-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '0 12px',
                  fontWeight: 600
                }}
              >
                <option value="monthly">Monthly Rate</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Offered Amount (PKR)
              </label>
              <Input
                type="number"
                placeholder="e.g. 20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Teaching Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Preferred Teaching Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { id: 'online', label: 'Remote (Online)' },
                { id: 'home-tuition', label: 'Home Tuition' },
                { id: 'in-house', label: 'In-House (Tutor Home)' }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: mode === m.id ? 'var(--brand-green-soft)' : 'var(--surface)',
                    border: mode === m.id ? '1px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)',
                    color: mode === m.id ? 'var(--brand-green-dark)' : 'var(--ink)'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offer Duration Timeline */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Tuition Duration Timeline
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                type="number"
                min="1"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                required
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '12px',
                  border: '1px solid var(--hairline-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  padding: '0 12px',
                  fontWeight: 600
                }}
              >
                <option value="month">Month(s)</option>
                <option value="week">Week(s)</option>
              </select>
            </div>
          </div>

          {/* Terms & Expectations */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Offer Expectations & Terms
            </label>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid var(--hairline-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                padding: '12px',
                fontSize: '13px',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
              required
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              style={{ flex: 1, borderRadius: '999px', height: '44px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', height: '44px', fontWeight: 700 }}
            >
              {submitting ? 'Sending Offer...' : 'Send Offer'}
            </Button>
          </div>

        </form>

        {/* Inline Add Child Sub-Modal */}
        {showAddChildModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 16px 32px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>+ Add Child Details</h4>
                <button onClick={() => setShowAddChildModal(false)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddChild} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>Child Full Name</label>
                  <Input placeholder="e.g. Ali Ahmed" value={newChildName} onChange={e => setNewChildName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>Grade / Level</label>
                  <select
                    value={newChildGrade}
                    onChange={e => setNewChildGrade(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--surface)', padding: '0 10px', color: 'var(--ink)', fontSize: '13px' }}
                  >
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Primary">Primary (Class 1-5)</option>
                    <option value="Secondary">Secondary (Class 6-8)</option>
                    <option value="Matric">Matric / SSC</option>
                    <option value="Inter">Inter / O-Levels</option>
                    <option value="BS/MS">University Level</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>School / College (optional)</label>
                  <Input placeholder="e.g. Beaconhouse" value={newChildSchool} onChange={e => setNewChildSchool(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button type="button" variant="secondary" onClick={() => setShowAddChildModal(false)} style={{ flex: 1, borderRadius: '999px' }}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={addingChild} style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px' }}>
                    {addingChild ? 'Saving...' : 'Save Child'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
