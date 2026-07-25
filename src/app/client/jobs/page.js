'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';
import { Trash2, Power, PowerOff } from 'lucide-react';
import Image from 'next/image';

export default function ParentJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch jobs and their proposals (including tutor profiles for avatars)
      const { data } = await supabase
        .from('jobs')
        .select(`
          *,
          proposals (
            id,
            tutor_profiles (
              avatar_url,
              full_name
            )
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setJobs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/jobs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: newStatus })
      });
      if (res.ok) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to update job status');
      }
    } catch (err) {
      alert('Error updating job');
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to completely delete this job? This will also remove all proposals associated with it.')) return;
    try {
      const res = await fetch(`/api/jobs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== jobId));
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to delete job');
      }
    } catch (err) {
      alert('Error deleting job');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>My Job Posts</h2>
          <p style={{ color: 'var(--slate)' }}>Manage your tuition requirements and view proposals.</p>
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
          {jobs.map(job => {
            const proposals = job.proposals || [];
            const displayProposals = proposals.slice(0, 3);
            const extraCount = proposals.length > 3 ? proposals.length - 3 : 0;
            
            return (
              <Card key={job.id} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px' }}>{job.title}</h4>
                      <Badge variant={job.status === 'open' ? 'green-soft' : job.status === 'hired' ? 'brand-soft' : 'popular'}>
                        {job.status === 'open' ? 'Active' : job.status === 'hired' ? 'Hired' : 'Closed'}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--slate)', margin: '0 0 12px 0' }}>
                      {job.subject} &bull; {job.mode === 'online' ? 'Online' : 'Physical'} 
                      {job.city && ` • ${job.city}`}
                    </p>
                    <p style={{ fontSize: '14px', margin: '0 0 16px 0', fontWeight: 500 }}>
                      Budget: PKR {job.budget_amount} {job.budget_type === 'hourly' ? '/ hr' : '/ month'}
                    </p>
                  </div>
                  
                  {/* Actions Menu */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => toggleJobStatus(job.id, job.status)}
                      style={{ background: 'transparent', border: '1px solid var(--hairline-strong)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: job.status === 'open' ? 'var(--charcoal)' : 'var(--brand-green-dark)' }}
                      title={job.status === 'open' ? 'Deactivate Job' : 'Activate Job'}
                    >
                      {job.status === 'open' ? <PowerOff size={16} /> : <Power size={16} />}
                    </button>
                    <button 
                      onClick={() => deleteJob(job.id)}
                      style={{ background: 'transparent', border: '1px solid var(--error)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--error)' }}
                      title="Delete Job"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--hairline)' }}>
                  
                  {/* Proposal Avatars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {proposals.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex' }}>
                          {displayProposals.map((p, idx) => (
                            <div key={p.id} style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', border: '2px solid white', 
                              backgroundColor: 'var(--hairline)', overflow: 'hidden', marginLeft: idx > 0 ? '-12px' : '0', zIndex: 10 - idx
                            }}>
                              {p.tutor_profiles?.avatar_url ? (
                                <Image src={p.tutor_profiles.avatar_url} alt="tutor" width={32} height={32} style={{ objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)', fontSize: '12px' }}>
                                  {p.tutor_profiles?.full_name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {extraCount > 0 && (
                          <div style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--stone)', fontWeight: 500 }}>
                            +{extraCount} applied
                          </div>
                        )}
                        {extraCount === 0 && (
                          <div style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--stone)' }}>
                            {proposals.length} applied
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--stone)' }}>No proposals yet</span>
                    )}
                  </div>

                  <Link href={`/client/jobs/${job.id}`}>
                    <Button variant="secondary" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>View Proposals</Button>
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
