'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';
import { AlertCircle, ChevronRight, CheckCircle2, MapPin, X } from 'lucide-react';

const TOTAL_STEPS = 8;
const STEP_LABELS = [
  'Profile Photo & Cover', 'Identity & Documents', 'Teaching Categories',
  'Languages', 'Experience Timeline', 'Teaching Availability', 'Schedule & Rate', 'About You',
];

export default function TutorDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
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

        // Fetch jobs (recommended open jobs, not applied yet)
        const { data: appliedProposals } = await supabase
          .from('proposals')
          .select('job_id')
          .eq('tutor_id', user.id);
        
        const appliedJobIds = appliedProposals ? appliedProposals.map(p => p.job_id) : [];

        let query = supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(3);
        const { data: dbJobs } = await query;
        
        if (!cancelled && dbJobs) {
          // Filter out jobs already applied to
          const filteredJobs = dbJobs.filter(j => !appliedJobIds.includes(j.id));
          setJobs(filteredJobs);
        }

        // Fetch Active Contracts (proposals accepted/hired)
        const { data: contractsData } = await supabase
          .from('proposals')
          .select('*, jobs(*)')
          .eq('tutor_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (!cancelled && contractsData) {
          setActiveContracts(contractsData);
        }

      } catch (err) {
        console.error('Error loading dashboard profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDashboard();
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

  const openProposalModal = (job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setBidAmount(job.budget_amount || '');
    setIsProposalModalOpen(true);
  };

  const submitProposal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && selectedJob) {
      try {
        const { error } = await supabase.from('proposals').insert([{
          job_id: selectedJob.id,
          tutor_id: user.id,
          cover_letter: coverLetter,
          bid_amount: bidAmount,
          status: 'pending'
        }]);

        if (error) throw error;
        
        setIsProposalModalOpen(false);
        setJobs(jobs.filter(j => j.id !== selectedJob.id));
        alert('Proposal submitted successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to submit proposal.');
      }
    }
    setSubmitting(false);
  };

  const onboardingStep = profile?.onboarding_step || 0;
  const isComplete = profile?.onboarding_complete;
  const progressPct = Math.min(100, (onboardingStep / TOTAL_STEPS) * 100);

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Suspension Alert */}
      {!loading && profile?.suspended && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 'var(--rounded-lg)', padding: '20px', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={24} color="#EF4444" />
            <span style={{ fontWeight: 700, color: '#991B1B', fontSize: '16px' }}>Your account has been suspended</span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#991B1B', lineHeight: 1.5 }}>
            An administrator has suspended your tutor profile. You cannot edit your profile, apply for jobs, or receive new student enquiries. Please contact administrator support to resolve this suspension.
          </p>
          <div style={{ marginTop: '8px' }}>
            <a href="mailto:support@tutoronline.pk" style={{ textDecoration: 'none' }}>
              <Button style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none' }}>Get Admin Support</Button>
            </a>
          </div>
        </div>
      )}

      {/* KYC Status Banners */}
      {!loading && !profile?.suspended && (
        <>
          {profile?.kyc_status === 'rejected' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 'var(--rounded-lg)', padding: '16px 20px', marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={22} color="#EF4444" />
                <div>
                  <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '15px' }}>Action Required: Document Verification Update</div>
                  <div style={{ fontSize: '13px', color: '#B71C1C', marginTop: '2px' }}>Our team reviewed your documents and requires a re-upload before approval.</div>
                </div>
              </div>
              <Link href="/tutor/fix-documents" style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none', fontSize: '13px', height: '38px', padding: '0 20px', fontWeight: 600 }}>
                  See why & fix documents →
                </Button>
              </Link>
            </div>
          ) : profile?.kyc_status === 'pending' && profile?.onboarding_complete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFF9E6', border: '1px solid #FFD566', borderRadius: 'var(--rounded-lg)', padding: '14px 20px', marginBottom: 'var(--spacing-lg)' }}>
              <AlertCircle size={20} color="#B45309" />
              <span style={{ fontWeight: 600, color: '#78350F', fontSize: '14px' }}>
                Verification Pending: Your documents have been submitted and are currently pending review by our moderation team.
              </span>
            </div>
          ) : isComplete && profile?.kyc_status === 'approved' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', borderRadius: 'var(--rounded-lg)', padding: '14px 20px', marginBottom: 'var(--spacing-lg)' }}>
              <CheckCircle2 size={20} color="var(--brand-green-dark)" />
              <span style={{ fontWeight: 600, color: 'var(--brand-green-dark)', fontSize: '14px' }}>Your profile is complete and live!</span>
              <Link href={`/tutors/${profile?.id}`} style={{ marginLeft: 'auto', color: 'var(--brand-green-dark)', fontSize: '13px', fontWeight: 600 }}>View My Profile →</Link>
            </div>
          ) : null}
        </>
      )}

      {/* Onboarding Ticker if onboarding incomplete */}
      {!loading && !isComplete && !profile?.suspended && profile?.kyc_status !== 'rejected' && (
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

      {/* Premium Active Contracts Cards UI */}
      {!loading && activeContracts.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>Active Tuition Contracts</h3>
            <span style={{ fontSize: '13px', color: 'var(--steel)', fontWeight: 500 }}>{activeContracts.length} Ongoing</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {activeContracts.map(contract => {
              const job = contract.jobs || {};
              return (
                <div 
                  key={contract.id}
                  style={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline-strong)',
                    borderRadius: 'var(--rounded-lg)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(180deg, var(--canvas) 0%, var(--surface-soft) 100%)'
                  }}
                >
                  {/* Top Status Accent Bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--brand-green), var(--brand-teal))' }} />

                  <div>
                    {/* Contract Header & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
                        {job.title || 'Tuition Contract'}
                      </h4>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--brand-green-dark)',
                        backgroundColor: 'var(--brand-green-soft)',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid rgba(65, 176, 27, 0.3)',
                        flexShrink: 0
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-green-dark)' }} />
                        Active
                      </span>
                    </div>

                    {/* Metadata Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                      {job.subject && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', backgroundColor: 'var(--surface)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                          📚 {job.subject}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', backgroundColor: 'var(--surface)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                        {job.mode === 'online' ? '🌐 Online' : job.mode === 'home' ? '🏠 Home Visit' : '🏫 Tutor Place'}
                      </span>
                      {job.city && job.mode !== 'online' && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', backgroundColor: 'var(--surface)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '2px' }} /> {job.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Agreed Rate & Actions Bar */}
                  <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '16px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Agreed Rate</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-green-dark)' }}>
                        PKR {parseInt(contract.bid_amount || job.budget_amount || 0).toLocaleString()} 
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--stone)' }}>{job.budget_type === 'hourly' ? '/hr' : '/mo'}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="outline" style={{ fontSize: '12px', height: '34px', padding: '0 12px', fontWeight: 600 }}>
                        Details
                      </Button>
                      <Button variant="primary" style={{ fontSize: '12px', height: '34px', padding: '0 14px', fontWeight: 600 }}>
                        Message Client
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>Recommended Jobs</h3>
        <Link href="/tutor/jobs"><Button variant="secondary">Browse All Jobs</Button></Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {jobs.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--stone)', margin: 0 }}>No new recommended jobs available right now.</p>
        ) : (
          jobs.map(job => (
            <Card key={job.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--brand-green-dark)' }}>{job.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>
                    Posted {getRelativeTime(job.created_at)} &bull; {job.mode === 'online' ? 'Online' : job.mode === 'home' ? 'Home Visits' : 'Tutor&apos;s Place'}
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
                <Button 
                  variant="primary" 
                  disabled={profile?.suspended}
                  onClick={() => openProposalModal(job)}
                  style={{ marginLeft: 'auto' }}
                >
                  {profile?.suspended ? "Account Suspended" : "Submit Proposal"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Proposal Modal */}
      {isProposalModalOpen && selectedJob && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99998 }} onClick={() => setIsProposalModalOpen(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', padding: '24px', width: '90%', maxWidth: '500px', zIndex: 99999, boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Submit Proposal</h3>
              <button onClick={() => setIsProposalModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--steel)" /></button>
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>{selectedJob.title}</strong>
              <span style={{ fontSize: '13px', color: 'var(--slate)' }}>Client Budget: PKR {selectedJob.budget_amount} {selectedJob.budget_type === 'hourly' ? '/hr' : '(Fixed)'}</span>
            </div>
            <form onSubmit={submitProposal}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Your Bid Amount (PKR)</label>
                <Input type="number" required value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Cover Letter</label>
                <textarea 
                  required
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a good fit..."
                  style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Send Proposal'}
              </Button>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
