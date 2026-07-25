'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import Link from 'next/link';
import { createClient } from '../../../../utils/supabase/client';
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, Star, ShieldCheck, CheckCircle2, User } from 'lucide-react';
import Image from 'next/image';

export default function JobDetailsPage({ params }) {
  const { id: jobId } = params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openProposalId, setOpenProposalId] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            proposals (
              id,
              cover_letter,
              bid_amount,
              status,
              created_at,
              tutor_profiles (
                id,
                full_name,
                avatar_url,
                city,
                verified,
                tagline
              )
            )
          `)
          .eq('id', jobId)
          .eq('client_id', user.id)
          .single();
          
        if (data) setJob(data);
        if (error) console.error("Error fetching job:", error);
      }
      setLoading(false);
    };

    fetchJobDetails();
  }, [jobId]);

  if (loading) return <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Loading Job Details...</div>;
  if (!job) return <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Job not found or you don&apos;t have permission.</div>;

  const proposals = job.proposals || [];

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <Link href="/client/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green-dark)', textDecoration: 'none', fontWeight: 500, marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to My Jobs
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{job.title}</h1>
            <Badge variant={job.status === 'open' ? 'green-soft' : job.status === 'hired' ? 'brand-soft' : 'popular'}>
              {job.status === 'open' ? 'Active' : job.status === 'hired' ? 'Hired' : 'Closed'}
            </Badge>
          </div>
          <p style={{ color: 'var(--slate)', fontSize: '15px', margin: 0 }}>
            {job.subject} &bull; {job.mode === 'online' ? 'Online' : 'Physical'} 
            {job.city && ` • ${job.city}`} {job.area && ` (${job.area})`}
          </p>
        </div>
      </div>

      <Card style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>Job Details</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--slate)', marginBottom: '4px' }}>Budget</span>
            <strong style={{ fontSize: '15px' }}>PKR {job.budget_amount} {job.budget_type === 'hourly' ? '/ hr' : '/ month'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--slate)', marginBottom: '4px' }}>Grade / Level</span>
            <strong style={{ fontSize: '15px' }}>{job.grade_level || 'Not specified'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--slate)', marginBottom: '4px' }}>Duration</span>
            <strong style={{ fontSize: '15px' }}>{job.duration || 'Not specified'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--slate)', marginBottom: '4px' }}>Schedule</span>
            <strong style={{ fontSize: '15px' }}>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : 'Not specified'}</strong>
          </div>
        </div>
        
        {job.description && (
          <div>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--slate)', marginBottom: '8px' }}>Special Instructions</span>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--charcoal)', whiteSpace: 'pre-wrap' }}>
              {job.description}
            </p>
          </div>
        )}
      </Card>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>Proposals ({proposals.length})</h2>
        <p style={{ color: 'var(--slate)', margin: 0 }}>Review the tutors who have applied for this job.</p>
      </div>

      {proposals.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--stone)' }}>
          No proposals have been submitted yet.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {proposals.map(proposal => {
            const tutor = proposal.tutor_profiles;
            const isOpen = openProposalId === proposal.id;
            
            return (
              <Card key={proposal.id} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Accordion Header */}
                <div 
                  onClick={() => setOpenProposalId(isOpen ? null : proposal.id)}
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isOpen ? '#f8fafc' : '#fff', transition: 'background-color 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--hairline)', overflow: 'hidden' }}>
                      {tutor?.avatar_url ? (
                        <Image src={tutor.avatar_url} alt={tutor.full_name || 'Tutor'} width={48} height={48} style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)' }}>
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>{tutor?.full_name || 'Anonymous Tutor'}</h4>
                        {tutor?.verified && (
                          <Badge variant="blue-soft" style={{ padding: '2px 6px', fontSize: '10px' }}>
                            <ShieldCheck size={12} style={{ marginRight: '4px' }}/> Verified
                          </Badge>
                        )}
                        {proposal.status === 'accepted' && (
                          <Badge variant="brand-soft" style={{ padding: '2px 6px', fontSize: '10px' }}>
                            <CheckCircle2 size={12} style={{ marginRight: '4px' }}/> Hired
                          </Badge>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--slate)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {tutor?.city || 'Pakistan'}</span>
                        <span>Bid: PKR {proposal.bid_amount}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--stone)' }}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                {/* Accordion Body */}
                {isOpen && (
                  <div style={{ padding: '20px', borderTop: '1px solid var(--hairline)' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--slate)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase' }}>Cover Letter / Message</span>
                      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6', color: 'var(--charcoal)', whiteSpace: 'pre-wrap' }}>
                        {proposal.cover_letter || 'No cover letter provided.'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <Link href={`/tutors/${tutor?.id}`}>
                        <Button variant="outline" style={{ height: '40px' }}>View Full Profile</Button>
                      </Link>
                      {proposal.status !== 'accepted' && job.status !== 'hired' && (
                        <Button variant="primary" style={{ height: '40px' }}>Hire Tutor</Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
