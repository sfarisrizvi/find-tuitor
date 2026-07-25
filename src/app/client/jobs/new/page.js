'use client';
import React, { useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../utils/supabase/client';

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Faisalabad', 
  'Multan', 'Gujranwala', 'Sialkot', 'Quetta', 'Hyderabad', 'Abbottabad'
];

const GRADE_LEVELS = [
  'Primary', 'Secondary', 'Matric', 'FSc', 'O-Level', 'A-Level', 'University', 'Professional'
];

export default function PostJob() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [children, setChildren] = useState([]);
  const [job, setJob] = useState({
    title: '',
    child_id: '',
    subject: '',
    grade_level: 'O-Level',
    mode: 'online',
    city: '',
    area: '',
    duration: '1-3 months',
    hours_per_week: '',
    gender_preference: 'Any Gender',
    description: '',
    budgetType: 'hourly',
    budgetAmount: ''
  });

  const [clientType, setClientType] = useState('parent');

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('client_profiles').select('client_type, city').eq('id', user.id).single();
        if (profile) {
          setClientType(profile.client_type);
          if (profile.city) {
            setJob(prev => ({...prev, city: profile.city}));
          }
        }
        
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
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: job.title,
            subject: job.subject,
            grade_level: job.grade_level,
            mode: job.mode,
            city: job.city,
            area: job.area,
            duration: job.duration,
            hours_per_week: job.hours_per_week ? parseInt(job.hours_per_week) : null,
            gender_preference: job.gender_preference,
            description: job.description,
            budget_type: job.budgetType,
            budget_amount: job.budgetAmount,
            client_type: clientType,
            child_id: job.child_id
          })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || 'Failed to post job');
        }
        
        router.push('/client/jobs');
      } catch (err) {
        console.error('Job post error:', err);
        alert(err.message);
      }
    }
  };

  const inputStyle = { width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)' };

  return (
    <div className="container" style={{ maxWidth: '650px', paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h2>Post a Tuition Requirement</h2>
        <p style={{ color: 'var(--slate)' }}>Fill in the details so we can match you with the best tutors.</p>
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
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>What you are looking for</label>
                <Input placeholder="e.g. Need A-Level Computer Science Coding Specialist" value={job.title} onChange={e => setJob({...job, title: e.target.value})} required />
              </div>
              
              {clientType === 'parent' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>For which child?</label>
                  <select className="input-field" style={inputStyle} value={job.child_id} onChange={e => setJob({...job, child_id: e.target.value})} required>
                    {children.length === 0 && <option value="">No children found</option>}
                    {children.map(child => (
                      <option key={child.id} value={child.id}>{child.name} ({child.academic_route})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Subject</label>
                  <Input placeholder="e.g. Computer Science" value={job.subject} onChange={e => setJob({...job, subject: e.target.value})} required />
                </div>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Grade / Level</label>
                  <select className="input-field" style={inputStyle} value={job.grade_level} onChange={e => setJob({...job, grade_level: e.target.value})} required>
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Tuition Mode</label>
                  <select className="input-field" style={inputStyle} value={job.mode} onChange={e => setJob({...job, mode: e.target.value})} required>
                    <option value="online">Remote / Online</option>
                    <option value="home">Physical (Tutor visits my home)</option>
                    <option value="tutor_place">Physical (I will visit Tutor&apos;s place)</option>
                  </select>
                </div>
                {job.mode !== 'online' && (
                  <div style={{ flex: '1 1 45%' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>City</label>
                    <select className="input-field" style={inputStyle} value={job.city} onChange={e => setJob({...job, city: e.target.value})} required={job.mode !== 'online'}>
                      <option value="">Select City...</option>
                      {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {job.mode !== 'online' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Area (Location Address)</label>
                  <Input placeholder="e.g. DHA Phase 5" value={job.area} onChange={e => setJob({...job, area: e.target.value})} required={job.mode !== 'online'} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Estimated Schedule (hrs/week)</label>
                  <Input type="number" placeholder="e.g. 10" value={job.hours_per_week} onChange={e => setJob({...job, hours_per_week: e.target.value})} required />
                </div>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Contract Duration</label>
                  <select className="input-field" style={inputStyle} value={job.duration} onChange={e => setJob({...job, duration: e.target.value})} required>
                    <option value="Less than 1 month">Less than 1 month</option>
                    <option value="1-3 months">1-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="Full Academic Year">Full Academic Year</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Tutor Preference</label>
                  <select className="input-field" style={inputStyle} value={job.gender_preference} onChange={e => setJob({...job, gender_preference: e.target.value})} required>
                    <option value="Any Gender">Any Gender</option>
                    <option value="Female Only">Female Only</option>
                    <option value="Male Only">Male Only</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 45%' }}>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Budget Setup (PKR)</label>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Input type="number" placeholder="Amount" value={job.budgetAmount} onChange={e => setJob({...job, budgetAmount: e.target.value})} required style={{ flex: 2 }} />
                    <select className="input-field" style={{...inputStyle, flex: 1}} value={job.budgetType} onChange={e => setJob({...job, budgetType: e.target.value})}>
                      <option value="hourly">/ hour</option>
                      <option value="fixed">/ month</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Special Instructions</label>
                <textarea 
                  className="input-field"
                  style={{ width: '100%', minHeight: '100px', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', resize: 'vertical' }}
                  placeholder="Any additional details or requirements for the tutor..."
                  value={job.description}
                  onChange={e => setJob({...job, description: e.target.value})}
                ></textarea>
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
