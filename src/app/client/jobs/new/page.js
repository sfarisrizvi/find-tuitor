'use client';
import React, { useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { useRouter } from 'next/navigation';

import { createClient } from '../../../../utils/supabase/client';

export default function PostJob() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [children, setChildren] = useState([]);
  const [job, setJob] = useState({
    title: '',
    child_id: '',
    subject: '',
    mode: 'online',
    budgetType: 'hourly',
    budgetAmount: ''
  });

  const [clientType, setClientType] = useState('parent');

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('client_type').eq('id', user.id).single();
        if (profile) setClientType(profile.client_type);
        
        if (profile?.client_type === 'parent') {
          const { data } = await supabase.from('children').select('*').eq('client_id', user.id);
          if (data) {
            setChildren(data);
            if (data.length > 0) setJob(prev => ({...prev, child_id: data[0].id}));
          }
        }
      }
    };
    fetchData();
  }, []);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('jobs').insert([{
        client_id: user.id,
        child_id: clientType === 'parent' ? job.child_id : null,
        title: job.title,
        subject: job.subject,
        mode: job.mode,
        budget_type: job.budgetType,
        budget_amount: job.budgetAmount
      }]);
      router.push('/client/jobs');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h2>Post a Tuition Requirement</h2>
        <p>Fill in the details so we can match you with the best tutors.</p>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--hairline)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '12px', left: 0, width: step === 1 ? '50%' : '100%', height: '2px', backgroundColor: 'var(--brand-green-dark)', zIndex: 0, transition: 'width 0.3s' }} />
          
          <div style={{ zIndex: 1, backgroundColor: step >= 1 ? 'var(--brand-green-dark)' : 'var(--canvas)', color: step >= 1 ? 'var(--on-dark)' : 'var(--steel)', border: `2px solid ${step >= 1 ? 'var(--brand-green-dark)' : 'var(--hairline-strong)'}`, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>1</div>
          <div style={{ zIndex: 1, backgroundColor: step >= 2 ? 'var(--brand-green-dark)' : 'var(--canvas)', color: step >= 2 ? 'var(--on-dark)' : 'var(--steel)', border: `2px solid ${step >= 2 ? 'var(--brand-green-dark)' : 'var(--hairline-strong)'}`, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>2</div>
        </div>

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Job Title</label>
                <Input placeholder="e.g. Need O-Level Physics Tutor" value={job.title} onChange={e => setJob({...job, title: e.target.value})} required />
              </div>
              
              {clientType === 'parent' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>For which child?</label>
                  <select 
                    className="input-field" 
                    style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)' }}
                    value={job.child_id}
                    onChange={e => setJob({...job, child_id: e.target.value})}
                    required
                  >
                    {children.length === 0 && <option value="">No children found</option>}
                    {children.map(child => (
                      <option key={child.id} value={child.id}>{child.name} ({child.academic_route})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Subject</label>
                <Input placeholder="e.g. Physics, Math, Chemistry" value={job.subject} onChange={e => setJob({...job, subject: e.target.value})} required />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Tuition Mode</label>
                <select 
                  className="input-field" 
                  style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)' }}
                  value={job.mode}
                  onChange={e => setJob({...job, mode: e.target.value})}
                >
                  <option value="online">Remote / Online</option>
                  <option value="home">Physical (Tutor visits my home)</option>
                  <option value="tutor_place">Physical (I will visit Tutor&apos;s place)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Budget Setup</label>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Input type="number" placeholder="Amount (PKR)" value={job.budgetAmount} onChange={e => setJob({...job, budgetAmount: e.target.value})} required style={{ flex: 2 }} />
                  <select 
                    className="input-field" 
                    style={{ flex: 1, height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)' }}
                    value={job.budgetType}
                    onChange={e => setJob({...job, budgetType: e.target.value})}
                  >
                    <option value="hourly">/ hour</option>
                    <option value="fixed">/ month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
            {step === 2 ? (
              <Button type="button" variant="secondary" onClick={handleBack}>Back</Button>
            ) : <div />}
            <Button type="submit" variant="primary">{step === 1 ? 'Next Step' : 'Post Job'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
