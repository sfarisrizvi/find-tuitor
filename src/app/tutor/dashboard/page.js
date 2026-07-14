'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';
import { AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

const TOTAL_STEPS = 8;
const STEP_LABELS = [
  'Profile Photo & Cover', 'Identity & Documents', 'Teaching Categories',
  'Languages', 'Experience Timeline', 'Teaching Availability', 'Schedule & Rate', 'About You',
];

export default function TutorDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          // Don't redirect here — let middleware handle it
          setLoading(false);
          return;
        }
        
        // Fetch profile
        const { data, error } = await supabase.from('tutor_profiles').select('*').eq('id', user.id).maybeSingle();
        if (cancelled) return;
        if (!data || error) {
          window.location.href = '/tutor/onboarding';
          return;
        }
        setProfile(data);

        // Fetch jobs
        const { data: dbJobs } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(3);
        if (!cancelled) setJobs(dbJobs || []);
      } catch (err) {
        console.error('Error loading dashboard profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const created = new Date(dateStr);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const onboardingStep = profile?.onboarding_step || 0;
  const isComplete = profile?.onboarding_complete;
  const progressPct = Math.min(100, (onboardingStep / TOTAL_STEPS) * 100);

  return (
    <div className="container">
      {/* Onboarding Ticker */}
      {!loading && !isComplete && (
        <Link href="/tutor/onboarding" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--brand-teal-deep)', borderRadius: 'var(--rounded-lg)', padding: '16px 20px', marginBottom: 'var(--spacing-lg)', cursor: 'pointer', border: '1px solid rgba(0,237,100,0.2)' }}>
            <AlertCircle size={20} color="var(--brand-green)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                Complete your profile to start getting discovered!
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: 'var(--brand-green)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', flexShrink: 0 }}>{onboardingStep}/{TOTAL_STEPS} steps</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                Next: {STEP_LABELS[onboardingStep] || 'Finish Setup'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-green)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
              Continue <ChevronRight size={16} />
            </div>
          </div>
        </Link>
      )}

      {!loading && isComplete && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', borderRadius: 'var(--rounded-lg)', padding: '14px 20px', marginBottom: 'var(--spacing-lg)' }}>
          <CheckCircle2 size={20} color="var(--brand-green-dark)" />
          <span style={{ fontWeight: 600, color: 'var(--brand-green-dark)', fontSize: '14px' }}>Your profile is complete and live!</span>
          <Link href={`/tutors/${profile?.id}`} style={{ marginLeft: 'auto', color: 'var(--brand-green-dark)', fontSize: '13px', fontWeight: 600 }}>View My Profile →</Link>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Card variant="feature-dark">
          <p style={{ fontSize: '14px', color: 'var(--on-dark-muted)', margin: '0 0 8px 0' }}>Available Balance</p>
          <h2 style={{ margin: 0 }}>Rs 45,000</h2>
          <Button variant="secondary-on-dark" style={{ marginTop: '16px', fontSize: '12px', padding: '6px 12px' }}>Withdraw Funds</Button>
        </Card>
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Active Contracts</p>
          <h2 style={{ margin: 0, color: 'var(--brand-teal-deep)' }}>3</h2>
          <Link href="/tutor/contracts" style={{ display: 'inline-block', marginTop: '16px', fontSize: '14px', color: 'var(--brand-green-dark)' }}>View Details &rarr;</Link>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>Recommended Jobs</h3>
        <Link href="/tutor/jobs"><Button variant="secondary">Browse All Jobs</Button></Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {jobs.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--stone)', margin: 0 }}>No recommended jobs available right now.</p>
        ) : (
          jobs.map(job => (
            <Card key={job.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--brand-green-dark)' }}>{job.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>
                    Posted {getRelativeTime(job.created_at)} &bull; {job.mode === 'online' ? 'Online' : job.mode === 'home' ? 'Home Visits' : 'Tutor\'s Place'}
                  </p>
                </div>
                <h4 style={{ margin: 0 }}>
                  Rs {parseInt(job.budget_amount).toLocaleString()}{job.budget_type === 'hourly' ? '/hr' : ' (Fixed)'}
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '13px', 
                  color: 'var(--charcoal)', 
                  backgroundColor: 'var(--surface)', 
                  padding: '4px 12px', 
                  borderRadius: '999px', 
                  fontWeight: 500,
                  border: '1px solid var(--hairline)',
                }}>
                  {job.subject}
                </span>
                <Link href="/tutor/jobs" style={{ marginLeft: 'auto' }}>
                  <Button variant="primary">Submit Proposal</Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
