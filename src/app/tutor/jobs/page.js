'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  DollarSign,
  Calendar,
  ChevronDown,
  Lock,
  Zap,
  CheckCircle2,
  User,
  Users,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

const MOCK_JOBS = [
  {
    id: 'job-mock-1',
    title: 'O-Level Physics Home Tuition Expert Needed',
    subject: 'Physics',
    grade_level: 'O-Level',
    mode: 'home_tuition',
    city: 'Lahore',
    gender_preference: 'Male',
    budget_amount: '25000',
    budget_type: 'fixed',
    status: 'open',
    verified_required: true,
    immediate_hiring: true,
    description: 'Looking for a dedicated NUST or FAST graduate to teach Physics to my grade 10 son. Needs to cover past papers from 2018-2025. Must reside in or near DHA Phase 5 Lahore for regular home visits.',
    duration: '3-6 months',
    experience_level: 'Expert',
    hours_per_week: 12,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-2',
    title: 'Female Online Tutor for Class 9 Biology (Matric)',
    subject: 'Biology',
    grade_level: 'Matric',
    mode: 'online',
    city: 'Karachi',
    gender_preference: 'Female',
    budget_amount: '12000',
    budget_type: 'fixed',
    status: 'open',
    verified_required: false,
    immediate_hiring: true,
    description: 'Need a female instructor to conduct online Biology sessions for Matriculation boards. Must explain diagram markings and cell division chapters clearly. 3 classes per week.',
    duration: '1-3 months',
    experience_level: 'Intermediate',
    hours_per_week: 6,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-3',
    title: 'University Level Calculus & Linear Algebra Help',
    subject: 'Calculus',
    grade_level: 'University',
    mode: 'online',
    city: 'Islamabad',
    gender_preference: 'Any',
    budget_amount: '3500',
    budget_type: 'hourly',
    status: 'open',
    verified_required: true,
    immediate_hiring: false,
    description: 'Seeking a tutor who has strong expertise in vector spaces, matrix factorization, and advanced integration. The student is in their 2nd semester of BS Computer Science. Zoom classes only.',
    duration: '1-3 months',
    experience_level: 'Expert',
    hours_per_week: 8,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-4',
    title: 'Home Tuition for Class 3 All Subjects',
    subject: 'General Knowledge',
    grade_level: 'Primary',
    mode: 'home_tuition',
    city: 'Islamabad',
    gender_preference: 'Female',
    budget_amount: '18000',
    budget_type: 'fixed',
    status: 'open',
    verified_required: false,
    immediate_hiring: true,
    description: 'Seeking a kind and patient female tutor for physical tuition in Sector G-11. Must teach basic English, math word problems, and school homework for standard 3.',
    duration: '6+ months',
    experience_level: 'Beginner',
    hours_per_week: 15,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-5',
    title: 'A-Level Computer Science Coding Specialist',
    subject: 'Computer Science',
    grade_level: 'A-Level',
    mode: 'online',
    city: 'Rawalpindi',
    gender_preference: 'Any',
    budget_amount: '3000',
    budget_type: 'hourly',
    status: 'open',
    verified_required: true,
    immediate_hiring: true,
    description: 'Looking for a teacher who can explain Python sorting algorithms, SQL queries, and networking topologies. Student is appearing for Cambridge A-Levels in the upcoming session.',
    duration: '1-3 months',
    experience_level: 'Expert',
    hours_per_week: 10,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-6',
    title: 'A-Level Economics & Accounting Tutor',
    subject: 'Economics',
    grade_level: 'A-Level',
    mode: 'tutor_home',
    city: 'Lahore',
    gender_preference: 'Any',
    budget_amount: '30000',
    budget_type: 'fixed',
    status: 'open',
    verified_required: false,
    immediate_hiring: false,
    description: 'Prefer physical sessions where student will travel to tutor home in DHA Phase 3 or Cantonment area. Looking to cover micro/macro graphs and balance sheets.',
    duration: '3-6 months',
    experience_level: 'Intermediate',
    hours_per_week: 8,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function FindJobsLanding() {
  const router = useRouter();
  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [tutorCity, setTutorCity] = useState('');

  // Hero Search inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // Modal States
  const [activeJobForApply, setActiveJobForApply] = useState(null);
  const [bidType, setBidType] = useState('fixed');
  const [bidAmount, setBidAmount] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [bookDemoLink, setBookDemoLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setSession(user);
        const role = user.user_metadata?.role || 'tutor';
        setUserRole(role);

        if (role === 'tutor') {
          const { data: prof } = await supabase
            .from('tutor_profiles')
            .select('city')
            .eq('id', user.id)
            .maybeSingle();
          if (prof?.city) {
            setTutorCity(prof.city);
          }
        }
      }

      // Fetch active jobs from Supabase
      try {
        const { data: jobsList } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (jobsList && jobsList.length > 0) {
          const parsed = jobsList.map(j => ({
            id: j.id,
            title: j.title,
            subject: j.subject,
            grade_level: j.grade_level || 'O-Level',
            mode: j.mode || 'online',
            city: j.city || 'Karachi',
            gender_preference: j.gender_preference || 'Any',
            budget_amount: String(j.budget_amount),
            budget_type: j.budget_type || 'fixed',
            status: j.status || 'open',
            verified_required: j.verified_required || false,
            immediate_hiring: j.immediate_hiring || false,
            description: j.description || j.desc || 'No description provided.',
            duration: j.duration || '1-3 months',
            experience_level: j.experience_level || 'Intermediate',
            hours_per_week: j.hours_per_week || 10,
            created_at: j.created_at
          }));
          setDbJobs(parsed);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Merge live jobs and mock jobs to make a perfect 3x2 grid
  const displayJobs = [...dbJobs];
  MOCK_JOBS.forEach(mock => {
    if (displayJobs.length < 6 && !displayJobs.some(j => j.title.toLowerCase() === mock.title.toLowerCase())) {
      displayJobs.push(mock);
    }
  });

  const handleHeroSearch = (e) => {
    e.preventDefault();
    router.push(`/tutor/jobs/search?mode=${encodeURIComponent(selectedMode)}&query=${encodeURIComponent(searchQuery)}`);
  };

  const handleApplyClick = (job) => {
    setActiveJobForApply(job);
    setBidType(job.budget_type);
    setBidAmount(job.budget_amount);
    setProposalMessage('');
    setDemoLink('');
    setBookDemoLink('');
    setIsSuccess(false);
  };

  const handleProposalSubmit = (e) => {
    e.preventDefault();
    if (!session) return;
    if (userRole === 'client') return;
    if (proposalMessage.length < 20) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const showCityWarning = activeJobForApply && 
                         userRole === 'tutor' && 
                         activeJobForApply.mode !== 'online' && 
                         tutorCity && 
                         tutorCity.toLowerCase() !== activeJobForApply.city.toLowerCase();

  const getRelativeTime = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Styling tweaks */}
      <style>{`
        .jobs-landing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }
        .main-hero-search-box {
          background-color: var(--canvas);
          padding: 16px 24px;
          border-radius: 999px;
          box-shadow: var(--shadow-card);
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 780px;
          margin: 0 auto;
          border: 1px solid var(--hairline-strong);
        }
        .mode-select-hero {
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          outline: none;
          cursor: pointer;
          padding-right: 20px;
          border-right: 1.5px solid var(--hairline-strong);
          height: 32px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235c6c75' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right center;
        }
        @media (max-width: 768px) {
          .main-hero-search-box {
            border-radius: var(--rounded-lg) !important;
            flex-direction: column !important;
            padding: 16px !important;
            gap: 12px !important;
          }
          .mode-select-hero {
            border-right: none !important;
            border-bottom: 1.5px solid var(--hairline-strong) !important;
            width: 100% !important;
            padding-bottom: 8px !important;
            height: auto !important;
          }
          .jobs-landing-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #001E2B 0%, #002e42 100%)',
        color: 'var(--on-dark)',
        padding: '80px 0 100px 0',
        textAlign: 'center',
        position: 'relative',
        borderBottom: '1px solid var(--hairline-dark)'
      }}>
        <div className="container" style={{ maxWidth: '850px', position: 'relative', zIndex: 1 }}>
          <Badge variant="green-soft" style={{ marginBottom: '16px', color: 'var(--brand-green)', backgroundColor: 'rgba(0, 237, 100, 0.1)', fontSize: '13px', padding: '6px 16px', borderRadius: '999px' }}>
            0% Commission Academy Platform
          </Badge>
          <h1 style={{ fontSize: '46px', color: 'white', fontWeight: 700, marginBottom: '16px', letterSpacing: '-1px' }}>
            Find High-Paying Tutoring Jobs
          </h1>
          <p style={{ color: 'var(--on-dark-muted)', fontSize: '18px', marginBottom: '40px', maxWidth: '650px', margin: '0 auto 40px auto' }}>
            Browse active home tuition requirements or remote slots across Pakistan. Apply directly with custom rates and keep 100% of your earnings.
          </p>

          {/* Search Box */}
          <form onSubmit={handleHeroSearch} className="main-hero-search-box">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="mode-select-hero"
              style={{ minWidth: '150px' }}
            >
              <option value="">Any Mode</option>
              <option value="online">Online / Remote</option>
              <option value="home_tuition">Home Tuition</option>
              <option value="tutor_home">Tutor's Home</option>
            </select>

            <div style={{ flex: 1, position: 'relative', display: 'flex', width: '100%' }}>
              <input
                type="text"
                placeholder="Search tuition requirements by subject, keywords, or location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  color: 'var(--ink)',
                  paddingRight: '36px'
                }}
              />
              <button type="submit" style={{ border: 'none', background: 'transparent', position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', cursor: 'pointer' }}>
                <Search size={18} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3x2 grid of jobs */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Featured Tuition Jobs</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Submit custom budget proposals directly to local families.</p>
          </div>

          {loading ? (
            <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--steel)' }}>Loading featured jobs...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
              <div className="jobs-landing-grid" style={{ width: '100%' }}>
                {displayJobs.map((job) => {
                  const isHourly = job.budget_type === 'hourly';
                  return (
                    <Card
                      key={job.id}
                      style={{
                        padding: '24px',
                        border: '1px solid var(--hairline-strong)',
                        backgroundColor: 'var(--canvas)',
                        boxShadow: 'var(--shadow-subtle)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        {/* Tags */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <Badge variant={job.mode === 'online' ? 'purple' : 'green-soft'}>
                            {job.mode === 'online' ? 'Remote' : job.mode === 'tutor_home' ? 'Tutor Home' : 'Physical'}
                          </Badge>
                          <span style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 500 }}>
                            {getRelativeTime(job.created_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--brand-teal-deep)', margin: '0 0 12px 0', minHeight: '44px', lineHeight: '1.4' }}>
                          {job.title}
                        </h4>

                        {/* Basic Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', fontSize: '13px', color: 'var(--slate)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>Budget:</span>
                            <span style={{ color: 'var(--brand-green-dark)', fontWeight: 700 }}>
                              Rs {parseInt(job.budget_amount).toLocaleString()} {isHourly ? '/ hr' : '/ month'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>Grade/Subject:</span>
                            <span>{job.grade_level} • {job.subject}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>Location:</span>
                            <span>{job.city}</span>
                          </div>
                        </div>

                        {/* Short Description */}
                        <p style={{
                          fontSize: '13px', color: 'var(--steel)', lineHeight: '1.5', marginBottom: '20px',
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {job.description}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleApplyClick(job)}
                        variant="primary"
                        style={{
                          backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)',
                          fontWeight: 700, width: '100%', borderRadius: '8px'
                        }}
                      >
                        Apply Now
                      </Button>
                    </Card>
                  );
                })}
              </div>

              {/* Browse more jobs CTA button */}
              <Link href="/tutor/jobs/search">
                <Button
                  variant="primary"
                  style={{
                    padding: '16px 36px', fontSize: '15px', fontWeight: 700,
                    backgroundColor: 'var(--brand-teal-deep)', color: '#fff',
                    borderRadius: '999px', boxShadow: 'var(--shadow-card)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  Browse More Jobs <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why teach with us */}
      <section style={{ padding: '64px 0', backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>Why Teach With Us</h2>
            <p style={{ color: 'var(--steel)', fontSize: '15px' }}>Keep all your earnings. Secure your billing. Teach on your own terms.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <DollarSign size={20} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>0% Commission Rates</h3>
              <p style={{ color: 'var(--slate)', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                Stop paying academy hubs 30-40% of your earnings. Keep 100% of the milestone billing amount. We charge a flat connect bidding fee.
              </p>
            </Card>

            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Lock size={20} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>Escrow Payout Guarantee</h3>
              <p style={{ color: 'var(--slate)', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                Never get ghosted after delivering lessons. Milestone funds are deposited by parents before you start, and released directly upon verification.
              </p>
            </Card>

            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Calendar size={20} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>Flexible Schedule Control</h3>
              <p style={{ color: 'var(--slate)', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                Define your own hourly tuition slots. Match with home tuition requests in your locality or teach students remotely from across Pakistan.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--hairline)' }}>
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

      {/* FAQs */}
      <section style={{ padding: '64px 0', backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700 }}>Tutor FAQs</h2>
            <p style={{ color: 'var(--steel)', fontSize: '15px' }}>Answers to your questions about scheduling, escrows, and verification.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tutorFaqs.map((faq, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--canvas)', borderRadius: '8px', border: '1px solid var(--hairline-strong)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontWeight: 600, fontSize: '15px', color: 'var(--ink)', textAlign: 'left', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'
                  }}
                >
                  {faq.q}
                  <ChevronDown size={16} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--stone)' }} />
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 20px 16px 20px', fontSize: '13.5px', color: 'var(--slate)', lineHeight: '1.6', borderTop: '1px solid var(--hairline-soft)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Sheet / Modal */}
      {activeJobForApply && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 30, 43, 0.65)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: 'var(--canvas)', borderRadius: '20px', width: '100%',
            maxWidth: '600px', boxShadow: 'var(--shadow-modal)',
            maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative',
            animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <button
              onClick={() => setActiveJobForApply(null)}
              style={{
                position: 'absolute', top: '24px', right: '24px', border: 'none',
                backgroundColor: 'var(--surface)', width: '36px', height: '36px',
                borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', color: 'var(--steel)'
              }}
            >
              ✕
            </button>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  <CheckCircle2 size={44} color="var(--brand-green-dark)" />
                </div>
                <h3 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--brand-teal-deep)', marginBottom: '12px' }}>Proposal Submitted!</h3>
                <p style={{ color: 'var(--slate)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                  Your proposal bid has been sent to the parent/student. You will receive a direct chat notification when they accept or request a trial lesson.
                </p>
                <Button
                  onClick={() => setActiveJobForApply(null)}
                  variant="primary"
                  style={{ width: '100%', maxWidth: '200px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand-teal-deep)', marginBottom: '8px', paddingRight: '32px' }}>
                  Apply for Tuition Job
                </h3>
                <p style={{ color: 'var(--slate)', fontSize: '14px', marginBottom: '24px' }}>
                  Submit your proposal for: <strong>{activeJobForApply.title}</strong>
                </p>

                {!session ? (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid #FCA5A5',
                    borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px'
                  }}>
                    <Lock size={32} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
                    <h4 style={{ color: '#EF4444', fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Sign In Required</h4>
                    <p style={{ fontSize: '14px', color: 'var(--slate)', margin: '0 0 20px 0' }}>
                      You must be signed in as a Tutor to submit proposals for active tuition requirements.
                    </p>
                    <Link href={`/login?next=/tutor/jobs`}>
                      <Button variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', width: '100%' }}>
                        Sign In / Register as Tutor
                      </Button>
                    </Link>
                  </div>
                ) : userRole === 'client' ? (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid #FCA5A5',
                    borderRadius: '12px', padding: '24px', textAlign: 'center'
                  }}>
                    <Lock size={32} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
                    <h4 style={{ color: '#EF4444', fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Access Restricted</h4>
                    <p style={{ fontSize: '14px', color: 'var(--slate)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                      You are currently logged in with a Parent / Student account. Only registered Tutors can apply to tuition jobs.
                    </p>
                    <Link href="/signup">
                      <Button variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', width: '100%' }}>
                        Sign Up as a Tutor
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleProposalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {showCityWarning && (
                      <div style={{
                        backgroundColor: '#FFFBEB', border: '1px solid #FCD34D',
                        borderRadius: '8px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start'
                      }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <div style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.5', fontWeight: 500 }}>
                          <strong>Location Warning:</strong> You are located in <strong>{tutorCity}</strong>, but this physical home tuition requires travel to <strong>{activeJobForApply.city}</strong>. Please ensure you are willing/able to commute before submitting.
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                        Your Proposed Rate
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px' }}>
                        <select
                          value={bidType}
                          onChange={(e) => setBidType(e.target.value)}
                          style={{
                            height: '44px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                            backgroundColor: 'var(--canvas)', fontSize: '14px', padding: '0 12px', outline: 'none'
                          }}
                        >
                          <option value="fixed">Fixed / month</option>
                          <option value="hourly">Hourly / hr</option>
                        </select>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', fontSize: '14px', fontWeight: 600 }}>
                            Rs
                          </span>
                          <Input
                            type="number"
                            required
                            placeholder="e.g. 15000"
                            style={{ paddingLeft: '40px', height: '44px' }}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--stone)', marginTop: '6px' }}>
                        Parent\'s budget: Rs {parseInt(activeJobForApply.budget_amount).toLocaleString()} {activeJobForApply.budget_type === 'hourly' ? '/ hr' : '/ month'}
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                        Proposal message / Pitch
                      </label>
                      <textarea
                        required
                        placeholder="Describe your relevant teaching experience, credentials, and how you plan to help the student..."
                        rows={5}
                        style={{
                          width: '100%', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                          padding: '12px 16px', fontSize: '14px', outline: 'none', resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        value={proposalMessage}
                        onChange={(e) => setProposalMessage(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: proposalMessage.length < 20 ? '#EF4444' : 'var(--brand-green-dark)', fontWeight: 500 }}>
                          {proposalMessage.length < 20 ? 'Min 20 characters required' : 'Looks good!'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--stone)' }}>
                          {proposalMessage.length} chars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                        Demo Lecture Link <span style={{ color: 'var(--stone)', fontSize: '11px', fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <Input
                        placeholder="e.g. Google Drive, Loom, or YouTube video link"
                        value={demoLink}
                        onChange={(e) => setDemoLink(e.target.value)}
                        style={{ height: '44px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                        Calendar Scheduling / Booking Link <span style={{ color: 'var(--stone)', fontSize: '11px', fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <Input
                        placeholder="e.g. Calendly, Cal.com or WhatsApp Chat Link"
                        value={bookDemoLink}
                        onChange={(e) => setBookDemoLink(e.target.value)}
                        style={{ height: '44px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                      <Button
                        type="button"
                        onClick={() => setActiveJobForApply(null)}
                        variant="secondary"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || proposalMessage.length < 20 || !bidAmount}
                        variant="primary"
                        style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', fontWeight: 700 }}
                      >
                        {isSubmitting ? 'Sending...' : 'Submit Proposal'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const tutorFaqs = [
  {
    q: "How much commission does TutorOnline charge?",
    a: "TutorOnline operates on a 0% commission model. You keep 100% of your hourly or monthly milestone billing rate. Tutors purchase cheap Connect bundles to bid on tuition posts."
  },
  {
    q: "When and how do I receive my tutoring payments?",
    a: "Payments are held securely in escrow when the parent hires you. Once you deliver the classes and log hours, the parent releases the weekly or monthly milestone directly to your linked JazzCash, NayaPay, or Bank Account."
  },
  {
    q: "How do trial lessons and milestones work?",
    a: "When a family shortlists your proposal, you can connect directly via chat and schedule a trial lesson. Once both parties agree on milestones, a contract is initiated and payments are released upon completing each agreed milestone."
  }
];
