'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  Award,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  Lock
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

export default function FindJobs() {
  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // Fallback jobs to ensure a full list of jobs (up to 9 jobs)
  const mockJobs = [
    {
      id: 'job-mock-1',
      title: 'Need O-Level Physics Tutor (DHA Phase 5)',
      subject: 'Physics',
      mode: 'home',
      budget_amount: '3500',
      budget_type: 'hourly',
      status: 'open',
      desc: 'Looking for a FAST or NUST graduate to teach O-Level Physics. Focused on past paper practice and numerical problem-solving. DHA Lahore.'
    },
    {
      id: 'job-mock-2',
      title: 'A-Level Chemistry Online Instructor',
      subject: 'Chemistry',
      mode: 'online',
      budget_amount: '20000',
      budget_type: 'fixed',
      status: 'open',
      desc: 'Federal Board and Cambridge syllabus support. Classes will be held online 3 days a week. Looking for experienced tutor.'
    },
    {
      id: 'job-mock-3',
      title: 'Matric Maths & Physics Home Tutor',
      subject: 'Maths & Physics',
      mode: 'home',
      budget_amount: '15000',
      budget_type: 'fixed',
      status: 'open',
      desc: 'Require home tuition for grade 9 student. Gulshan-e-Iqbal, Karachi. Tutor must check-in via GPS attendance app.'
    },
    {
      id: 'job-mock-4',
      title: 'MDCAT Biology Prep Expert',
      subject: 'Biology',
      mode: 'online',
      budget_amount: '4000',
      budget_type: 'hourly',
      status: 'open',
      desc: 'Focused preparation for MDCAT Entry Test. Focus on biochem and plant anatomy shortcuts. Direct weekly payments.'
    },
    {
      id: 'job-mock-5',
      title: 'FSc Part-2 Mathematics Online',
      subject: 'Mathematics',
      mode: 'online',
      budget_amount: '12000',
      budget_type: 'fixed',
      status: 'open',
      desc: 'Punjab Board integration/differentiation syllabus prep. Needed immediately. 3 slots remaining.'
    },
    {
      id: 'job-mock-6',
      title: 'Primary English Home Tutor',
      subject: 'English',
      mode: 'home',
      budget_amount: '8000',
      budget_type: 'fixed',
      status: 'open',
      desc: 'Clifton Phase 2. Grammar, reading skills and creative writing exercises. Home check-ins required.'
    },
    {
      id: 'job-mock-7',
      title: 'A-Level Economics Specialist',
      subject: 'Economics',
      mode: 'online',
      budget_amount: '3000',
      budget_type: 'hourly',
      status: 'open',
      desc: 'Cambridge syllabus prep. Experienced teacher from IBA or LUMS preferred. Flexible timing.'
    },
    {
      id: 'job-mock-8',
      title: 'Federal Board Class 10 Chemistry',
      subject: 'Chemistry',
      mode: 'home',
      budget_amount: '14000',
      budget_type: 'fixed',
      status: 'open',
      desc: 'G-11 Islamabad. Prep for chemistry exam. Focus on chemical equations and organic chapters.'
    },
    {
      id: 'job-mock-9',
      title: 'Business Stats College Level',
      subject: 'Statistics',
      mode: 'online',
      budget_amount: '2500',
      budget_type: 'hourly',
      status: 'open',
      desc: 'B.Com statistics prep. Standard deviations, regression, and probability distributions support.'
    }
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setDbJobs(data);
      }
      setLoading(false);
    };

    fetchJobs();
  }, []);

  // Merge live jobs and mock jobs to make a perfect 3x3 layout
  const allJobs = [...dbJobs];
  mockJobs.forEach(mock => {
    if (allJobs.length < 9 && !allJobs.some(j => j.title === mock.title)) {
      allJobs.push(mock);
    }
  });

  // Filter jobs
  const filteredJobs = allJobs.filter(job => {
    const queryMatch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       job.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (job.desc && job.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const modeMatch = selectedMode ? job.mode === selectedMode : true;
    const subjectMatch = selectedSubject ? job.subject.toLowerCase().includes(selectedSubject.toLowerCase()) : true;
    return queryMatch && modeMatch && subjectMatch;
  });

  const tutorFaqs = [
    {
      q: "How much commission does FindTutors charge?",
      a: "FindTutors operates on a 0% commission model. You keep 100% of your hourly or monthly milestone billing rate. Tutors purchase cheap Connect bundles to bid on tuition posts."
    },
    {
      q: "When and how do I receive my tutoring payments?",
      a: "Payments are held securely in escrow when the parent hires you. Once you deliver the classes and log hours, the parent releases the weekly or monthly milestone directly to your linked JazzCash, NayaPay, or Bank Account."
    },
    {
      q: "How do geofenced attendance logs work?",
      a: "For physical home tuitions, you check in and check out using our mobile app. The app automatically cross-references your GPS coordinates with the parent's home bounds to generate tamper-proof attendance sheets."
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #001E2B 0%, #002e42 100%)',
        color: 'var(--on-dark)',
        padding: '80px 0 100px 0',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '48px', color: 'white', fontWeight: 700, marginBottom: '24px' }}>
            Find High-Paying Tutoring Jobs
          </h1>
          <p style={{ color: 'var(--on-dark-muted)', fontSize: '18px', marginBottom: '40px' }}>
            Bid on active tuition requests in your area or remote. Keep 100% of what you earn.
          </p>

          {/* Search bar inside Hero */}
          <div style={{
            backgroundColor: 'var(--canvas)',
            padding: '16px',
            borderRadius: 'var(--rounded-xl)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--stone)' }} />
              <Input 
                placeholder="Search job title, subject, or keywords..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '48px', border: '1px solid var(--hairline-strong)', color: 'var(--ink)' }}
              />
            </div>
            
            <div style={{ width: '160px', minWidth: '140px' }}>
              <select 
                className="input-field"
                value={selectedMode}
                onChange={e => setSelectedMode(e.target.value)}
                style={{
                  width: '100%', height: '44px', padding: '0 12px', borderRadius: 'var(--rounded-md)', 
                  border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '15px', color: 'var(--ink)'
                }}
              >
                <option value="">All Modes</option>
                <option value="online">Online / Remote</option>
                <option value="home">Physical Home</option>
                <option value="tutor_place">Tutor Place</option>
              </select>
            </div>

            <div style={{ width: '160px', minWidth: '140px' }}>
              <Input 
                placeholder="Subject (e.g. Math)" 
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                style={{ border: '1px solid var(--hairline-strong)', color: 'var(--ink)', height: '44px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid Section: 3x3 Active Tuitions */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Latest Tuition Requests</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Submit custom budget proposals directly to local families.</p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading jobs feed...</p>
          ) : filteredJobs.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '48px', color: 'var(--steel)' }}>
              No active jobs match your search filters. Try selecting other filters.
            </Card>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {filteredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  style={{
                    border: '1px solid var(--hairline-strong)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--canvas)',
                    boxShadow: 'var(--shadow-subtle)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <Badge variant={job.mode === 'online' ? 'popular' : 'green-soft'}>
                        {job.mode === 'online' ? 'Online' : 'Physical'}
                      </Badge>
                      <strong style={{ fontSize: '15px', color: 'var(--brand-green-dark)' }}>
                        Rs {job.budget_amount} {job.budget_type === 'hourly' ? '/ hr' : '/ month'}
                      </strong>
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--steel)', marginBottom: '8px', fontWeight: 500 }}>
                      Subject: {job.subject}
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--slate)', marginBottom: '24px', lineHeight: '1.5' }}>
                      {job.desc || 'Needs verified instruction matching Cambridge or Local Board criteria.'}
                    </p>
                  </div>

                  <div>
                    <Link href={`/login`}>
                      <Button variant="primary" style={{ width: '100%', padding: '10px' }}>
                        Apply & Bid
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tutor USPs (Shared USP style from Homepage, Tutor perspective) */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px auto' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Why Teach With Us</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Keep all your earnings. Secure your billing.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <DollarSign size={24} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>0% Commission Rates</h3>
              <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Stop paying academies 40% of your salary. Keep 100% of your milestone billing amount. We charge a flat bidding connect fee.
              </p>
            </Card>

            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Lock size={24} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Escrow Payout Guarantee</h3>
              <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Never get ghosted after delivering lessons. Milestone funds are deposited by parents before you start, and released directly upon verification.
              </p>
            </Card>

            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Calendar size={24} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Flexible Schedule Control</h3>
              <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Define your own hourly tuition slots. Match with home tuition requests in your locality or teach students remotely from across Pakistan.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works (Shared Component from Homepage, Tutor perspective) */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div className="grid-split" style={{ gap: 'var(--spacing-xxl)', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>
                Get Verified and Start Earning.
              </h2>
              <p style={{ color: 'var(--steel)', fontSize: '16px', marginBottom: '32px' }}>
                Sign up in minutes. Pass our manual academic transcript verification and place custom bids on tuition requests.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Create Profile & Upload Documents</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>Upload your CNIC and degree transcripts. Our admin verifies your credentials in 24 hours.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Bid on Tuition Requirements</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>Review student posts, analyze local rates, and submit tailored pricing bids with your intro video.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Log Sessions & Secure Income</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>Check-in on location or use remote logs. Payouts are made directly to your JazzCash or bank account.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side mockup */}
            <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-xxl)', border: '1px solid var(--hairline-strong)', boxShadow: 'var(--shadow-mockup)', padding: '24px' }}>
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--rounded-lg)', padding: '16px', border: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Tutor Wallet Balance</span>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--steel)' }}>Escrow Funds Released</span>
                  <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand-green-dark)', margin: 0 }}>Rs 48,000</h2>
                  <span style={{ fontSize: '12px', color: 'var(--stone)' }}>Settled to JazzCash: 0300****567</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section (From Tutor Perspective) */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Tutor FAQ</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Answers to your questions about connect bids, geofencing, and milestone processing.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tutorFaqs.map((faq, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline-strong)', overflow: 'hidden' }}>
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontWeight: 600, fontSize: '16px', color: 'var(--ink)', textAlign: 'left'
                  }}
                >
                  {faq.q}
                  <ChevronDown style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 20px 20px 20px', fontSize: '14px', color: 'var(--slate)', lineHeight: '1.6', borderTop: '1px solid var(--hairline-soft)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA at Bottom */}
      <section style={{
        background: 'var(--brand-teal-deep)',
        color: 'var(--on-dark)',
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
            Become a Verified Educator Today
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--on-dark-muted)', marginBottom: '32px' }}>
            Create your tutor profile, submit your credentials, and start bidding on high-paying tuition requests.
          </p>
          <Link href="/register">
            <Button variant="primary" style={{ padding: '16px 32px', fontSize: '16px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}>
              Join as Tutor for Free
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
