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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, []);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
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
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Available Connects</p>
          <h2 style={{ margin: 0, color: 'var(--brand-teal-deep)' }}>24</h2>
          <p style={{ fontSize: '12px', color: 'var(--stone)', margin: '16px 0 0 0' }}>Resets in 14 days</p>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>Recommended Jobs</h3>
        <Link href="/tutor/jobs"><Button variant="secondary">Browse All Jobs</Button></Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--brand-green-dark)' }}>Looking for O-Level Physics Tutor</h4>
              <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>Posted 2 hours ago &bull; Physical (DHA, Lahore)</p>
            </div>
            <h4 style={{ margin: 0 }}>Rs 5,000/hr</h4>
          </div>
          <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>
            Need an experienced tutor for my son who is appearing for exams in May. Must be able to visit our house 3 days a week.
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Badge variant="purple">O-Levels</Badge>
            <Badge variant="orange">Physics</Badge>
            <span style={{ fontSize: '14px', color: 'var(--steel)' }}>Costs 2 Connects</span>
            <Button variant="primary" style={{ marginLeft: 'auto' }}>Submit Proposal</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
