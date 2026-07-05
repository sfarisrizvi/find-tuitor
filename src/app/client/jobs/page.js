'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';

export default function ParentJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('jobs')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setJobs(data);
      }
      setLoading(false);
    };

    fetchJobs();
  }, []);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>My Job Posts</h2>
          <p>Manage your tuition requirements and view proposals.</p>
        </div>
        <Link href="/client/jobs/new">
          <Button variant="primary">Post a New Job</Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)' }}>
          <p style={{ color: 'var(--steel)', marginBottom: '16px' }}>You haven&apos;t posted any jobs yet.</p>
          <Link href="/client/jobs/new">
            <Button variant="secondary">Post your first job</Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {jobs.map(job => (
            <Card key={job.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>{job.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>{job.subject} &bull; {job.mode === 'online' ? 'Online' : 'Physical'}</p>
                </div>
                <Badge variant={job.status === 'open' ? 'green-soft' : 'popular'}>{job.status}</Badge>
              </div>
              <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>Budget: {job.budget_amount} {job.budget_type === 'hourly' ? '/ hr' : '/ month'}</p>
              <Button variant="secondary">View Proposals</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
