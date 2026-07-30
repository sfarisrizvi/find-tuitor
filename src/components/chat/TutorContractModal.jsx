'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, FileText, Check, DollarSign, Calendar, MapPin, User, AlertCircle } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function TutorContractModal({ isOpen, onClose, conversation, tutorUser, clientUser, onContractCreated }) {
  const [children, setChildren] = useState([]);
  const [selectedChildIds, setSelectedChildIds] = useState([]);
  const [clientType, setClientType] = useState('parent');
  const [loadingChildren, setLoadingChildren] = useState(false);

  const [terms, setTerms] = useState(
    '1. Tutor will deliver dedicated tuition sessions adhering to the agreed schedule.\n2. Payment will be processed transparently according to the agreed rate and plan.\n3. Both parties agree to maintain professional conduct and log attendance updates in-app.'
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

    const fetchClientInfo = async () => {
      setLoadingChildren(true);
      try {
        const supabase = createClient();
        const { data: clientProf } = await supabase
          .from('client_profiles')
          .select('id, client_type')
          .eq('id', clientUser.id)
          .maybeSingle();

        if (clientProf?.client_type === 'student') {
          setClientType('student');
          setSelectedChildIds(['student_self']);
        } else {
          setClientType('parent');
          const { data: kids } = await supabase
            .from('children')
            .select('id, name, grade, subjects')
            .eq('client_id', clientUser.id);

          setChildren(kids || []);
          if (kids && kids.length > 0) {
            setSelectedChildIds([kids[0].id]);
          }
        }
      } catch (err) {
        console.error('Error fetching client children:', err);
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchClientInfo();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid rate/amount.');
      return;
    }
    if (!terms.trim()) {
      setError('Contract terms cannot be empty.');
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
          creator_role: 'tutor',
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
      if (!res.ok) throw new Error(data.error || 'Failed to create contract.');

      onContractCreated(data.contract, data.message);
      onClose();
    } catch (err) {
      console.error('Error submitting contract:', err);
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
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="var(--brand-green-dark)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Create Formal Contract
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--steel)' }}>
                Propose structured terms to client for approval
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Select Student(s) Covered
            </label>
            {clientType === 'student' ? (
              <div style={{ padding: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--hairline-strong)', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                Direct Student Account
              </div>
            ) : children.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--hairline-strong)', borderRadius: '12px', fontSize: '13px', color: 'var(--steel)' }}>
                {loadingChildren ? 'Loading parent children...' : 'Parent profile has not added specific child records yet. General tuition agreement will apply.'}
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
                        <User size={16} color={isChecked ? 'var(--brand-green-dark)' : 'var(--steel)'} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{child.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--steel)' }}>Grade: {child.grade || 'General'}</div>
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
                Payment Plan
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
                Rate Amount (PKR)
              </label>
              <Input
                type="number"
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Teaching Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Teaching Mode
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

          {/* Contract Duration Timeline */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Contract Duration Timeline
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

          {/* Terms & Conditions Box */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Customizable Contract Terms & Expectations
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
              {submitting ? 'Sending Contract...' : 'Send Contract'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
