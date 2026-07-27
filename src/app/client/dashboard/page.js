'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';
import { BookOpen, Search, PlusCircle, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [activeEngagements, setActiveEngagements] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !profile.onboarding_complete) {
        window.location.href = '/client/onboarding';
        return;
      }

      setClientName(profile.full_name || 'Parent');

      // Fetch active engagements (accepted proposals on client's jobs)
      try {
        const { data: contracts } = await supabase
          .from('proposals')
          .select(`
            id,
            bid_amount,
            status,
            created_at,
            tutor_profiles (
              id,
              full_name,
              avatar_url,
              city,
              verified
            ),
            jobs!inner (
              id,
              title,
              subject,
              mode,
              city,
              client_id
            )
          `)
          .eq('jobs.client_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (contracts) {
          setActiveEngagements(contracts);
        }
      } catch (err) {
        console.error('Error loading active engagements:', err);
      }

      setLoading(false);
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)' }}>
        <p style={{ fontSize: '18px', fontWeight: 500 }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Welcome back, {clientName}!</h2>
          <p style={{ color: 'var(--steel)', margin: 0 }}>Here is an overview of your active tuitions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/find-tutor/search">
            <Button variant="secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Search size={16} /> Search Tutors
            </Button>
          </Link>
          <Link href="/client/jobs/new">
            <Button variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <PlusCircle size={16} /> Post a New Tuition
            </Button>
          </Link>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Active Engagements</h3>

      {activeEngagements.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline-strong)', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={32} color="var(--brand-green-dark)" />
          </div>
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>No Active Tuitions Yet</h4>
          <p style={{ color: 'var(--steel)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px', lineHeight: '1.5' }}>
            You don&apos;t have any ongoing tuitions right now. Post a tuition requirement or search for verified tutors to start learning!
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/client/jobs/new">
              <Button variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', padding: '0 24px', height: '42px', fontWeight: 700 }}>
                Post a Tuition Requirement
              </Button>
            </Link>
            <Link href="/find-tutor/search">
              <Button variant="secondary" style={{ borderRadius: '999px', padding: '0 24px', height: '42px', fontWeight: 600 }}>
                Explore Verified Tutors
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {activeEngagements.map((eng) => {
            const tutor = eng.tutor_profiles || {};
            const job = eng.jobs || {};
            return (
              <Card key={eng.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                  <div>
                    <h4 style={{ marginBottom: '4px' }}>{tutor.full_name || 'Tutor'}</h4>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <Badge variant={tutor.verified ? 'green-soft' : 'popular'}>
                        {tutor.verified ? 'ID Verified' : 'Registered'}
                      </Badge>
                      <Badge variant="purple">
                        {job.mode === 'online' ? 'Online' : 'Physical'}
                      </Badge>
                    </div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--hairline)' }}>
                    {tutor.avatar_url ? (
                      <Image src={tutor.avatar_url} alt={tutor.full_name || 'Tutor'} width={48} height={48} style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--brand-green)', color: '#001E2B', fontWeight: 700 }}>
                        {(tutor.full_name || 'T').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ color: 'var(--steel)', fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Subject:</strong> {job.subject || job.title}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Agreed Rate:</strong> PKR {parseInt(eng.bid_amount || 0).toLocaleString()}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Status:</strong> <span style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>Active Tuition</span></p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/client/messages" style={{ flex: 1 }}>
                    <Button variant="secondary" style={{ width: '100%', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                      <MessageSquare size={14} /> Message
                    </Button>
                  </Link>
                  <Link href={`/tutors/${tutor.id}`} style={{ flex: 1 }}>
                    <Button variant="primary" style={{ width: '100%', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}>
                      View Profile
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
