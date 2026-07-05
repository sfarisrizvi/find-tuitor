'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Star, 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  Award,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function Home() {
  // Auto-sliding live deck state
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  
  // Accordion state for FAQs
  const [openFaq, setOpenFaq] = useState(null);

  const mockTutors = [
    {
      name: 'Sir Hamza R.',
      subject: 'O/A Level Physics Specialist',
      institution: 'FAST-NU Alum',
      rating: '4.9',
      reviews: '98 reviews',
      status: 'Active Now',
      checkIn: 'DHA Phase 5, Lahore — 45 mins ago',
      avatar: 'https://ui-avatars.com/api/?name=Hamza+R&background=00684A&color=fff&size=100',
      badge: 'ID & Academic Verified'
    },
    {
      name: 'Miss Sana K.',
      subject: 'A-Level Biology & MDCAT',
      institution: 'NUST Graduate',
      rating: '5.0',
      reviews: '142 reviews',
      status: 'Active Now',
      checkIn: 'F-8, Islamabad — 12 mins ago',
      avatar: 'https://ui-avatars.com/api/?name=Sana+K&background=B45CFF&color=fff&size=100',
      badge: 'Gold Medalist'
    },
    {
      name: 'Sir Ahmed Shah',
      subject: 'Matric & FSc Mathematics',
      institution: '8+ Years Exp',
      rating: '4.9',
      reviews: '76 reviews',
      status: 'In Session',
      checkIn: 'Gulberg, Lahore — 5 mins ago',
      avatar: 'https://ui-avatars.com/api/?name=Ahmed+Shah&background=FF6E42&color=fff&size=100',
      badge: 'Top Rated'
    }
  ];

  const parentReviews = [
    {
      name: 'Amna K.',
      role: 'Parent',
      area: 'Gulshan-e-Iqbal, Karachi',
      text: 'Secured an A* in Chemistry. Funds were safely held in escrow until the monthly syllabus was completed!'
    },
    {
      name: 'Kamran M.',
      role: 'Parent',
      area: 'DHA Phase 6, Lahore',
      text: 'Extremely professional geofenced tracking. I get check-in alerts when the tutor arrives at my home.'
    },
    {
      name: 'Dr. Yasmin R.',
      role: 'Parent',
      area: 'G-11, Islamabad',
      text: 'My daughter cleared her MDCAT prep. The 15-minute free demo session made it so easy to choose the tutor.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDeckIndex((prev) => (prev + 1) % mockTutors.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [mockTutors.length]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const usps = [
    {
      icon: <ShieldCheck size={28} color="var(--brand-green-dark)" />,
      title: "CNIC & Degree Vetted",
      desc: "Every single educator is verified through a NADRA-backed identity check and a manual academic transcript audit before placing their first bid. No fake credentials allowed."
    },
    {
      icon: <Lock size={28} color="var(--brand-green-dark)" />,
      title: "Secure Escrow Protection",
      desc: "Your money stays safe inside our system. Tutors are only paid after they log their sessions and you confirm completion. No more ghosting after receiving advance fees."
    },
    {
      icon: <MapPin size={28} color="var(--brand-green-dark)" />,
      title: "Tamper-Proof Tracking",
      desc: "Know exactly what you are paying for. Our platform utilizes GPS geofencing to verify home tuition attendance, while online sessions automatically log every minute on screen."
    }
  ];

  const featuredTutors = [
    {
      name: "Miss Sana K.",
      location: "Islamabad / Online",
      subject: "A-Level Biology & MDCAT Prep",
      tagline: "NUST Applied Biosciences Grad.",
      score: "96%",
      metrics: "142 Hours Logged",
      avatar: "https://ui-avatars.com/api/?name=Sana+K&background=00E676&color=001E2B&size=120"
    },
    {
      name: "Sir Ahmed Shah",
      location: "Lahore / Home Tuition",
      subject: "FSc & Matric Mathematics",
      tagline: "8+ Years Punjab Board Academy Exp.",
      score: "Top Rated Badge",
      metrics: "48 Active Monthly Milestones",
      avatar: "https://ui-avatars.com/api/?name=Ahmed+Shah&background=FF6E42&color=fff&size=120"
    },
    {
      name: "Zainab Rizvi",
      location: "Karachi / Online",
      subject: "O-Level Economics & Accounting",
      tagline: "IBA Karachi Graduate.",
      score: "5/5 Star Reviews",
      metrics: "89 Bids Won",
      avatar: "https://ui-avatars.com/api/?name=Zainab+Rizvi&background=B45CFF&color=fff&size=120"
    }
  ];

  const deepDives = [
    {
      title: "Skip the Hidden Academy Cuts",
      desc: "Traditional tuition academies charge massive up-front registration fees and take a silent chunk of the tutor's monthly salary. FindTutors operates on a transparent model, passing maximum value straight to families and educators."
    },
    {
      title: "The 15-Minute Free Demo",
      desc: "Don't commit blindly. Once you shortlist an educator's custom bid, initiate a built-in chat or schedule a free 15-minute live video demo directly inside our app to ensure a perfect fit."
    },
    {
      title: "Complete Curricular Coverage",
      desc: "Whether your child needs help navigating the tricky Federal Board physics syllabus, mastering entry-test shorthand tricks, or tackling Cambridge past papers, we match you with specialists who know the exact marking schemes."
    }
  ];

  const faqs = [
    {
      q: "How does the platform hold and release payments safely?",
      a: "When you officially hire an educator, you fund the upcoming milestone (weekly or monthly) using local wallets like JazzCash, Nayapay, or direct 1Link bank transfer. The platform securely holds these funds. Once the tutor delivers the classes and logs their hours, you click 'Release Funds' to pay them."
    },
    {
      q: "What happens if a tutor misses scheduled home classes?",
      a: "Our system tracks presence via GPS geofencing on the tutor's mobile phone. If an educator skips sessions or fails to log verified check-ins, you can instantly flag a dispute. Our local support team audits the access records and returns your funds directly back to your platform wallet."
    },
    {
      q: "Is posting a tutoring job post completely free?",
      a: "Yes. Parents and students can post specific subject and budget requirements completely free of charge. You only ever fund the contract when you find an educator you completely love."
    }
  ];

  return (
    <div style={{ overflowX: 'hidden' }}>
      
      {/* 2. Hero Section (Split Layout, Full Width) */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #001E2B 0%, #002e42 100%)',
        color: 'var(--on-dark)',
        padding: '100px 0 120px 0',
        borderBottom: '1px solid var(--hairline-dark)'
      }}>
        {/* Subtle grid pattern background */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(var(--hairline-dark) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          opacity: 0.15,
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid-2col" style={{
            gap: 'var(--spacing-xxl)',
            alignItems: 'center'
          }}>
            {/* Left Content Column */}
            <div>
              <span style={{ 
                color: 'var(--brand-green)', 
                fontWeight: 600, 
                letterSpacing: '1px', 
                textTransform: 'uppercase',
                fontSize: '13px',
                display: 'block',
                marginBottom: '16px'
              }}>
                Stop risking your child&apos;s grades on unverified academy references.
              </span>
              
              <h1 style={{ 
                fontSize: '56px', 
                lineHeight: '1.15', 
                color: 'var(--on-dark)', 
                marginBottom: '24px', 
                fontWeight: 700 
              }}>
                Hire Pakistan’s <span style={{ color: 'var(--brand-green)' }}>Top Vetted Tutors</span>. Home or Online.
              </h1>
              
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                color: 'var(--on-dark-muted)', 
                marginBottom: '32px' 
              }}>
                No more paying upfront for missed classes. Post your specific requirements for Matric, FSc, O/A Levels, or Entry Tests. Review custom bids from verified educators, schedule a free 15-minute demo, and only pay when the results are delivered.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
                <Link href="/client/search">
                  <Button variant="primary" style={{ padding: '16px 32px', fontSize: '16px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}>
                    Find a Tutor (Post Free Job)
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" style={{ padding: '16px 32px', fontSize: '16px', borderColor: 'var(--on-dark)', color: 'var(--on-dark)', backgroundColor: 'transparent', border: '1px solid' }}>
                    Become a Tutor
                  </Button>
                </Link>
              </div>

              {/* Star Rating snippet reminiscent of Upwork / reference image */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="var(--accent-orange)" color="var(--accent-orange)" />)}
                </div>
                <div style={{ fontSize: '15px' }}>
                  <strong>Rated 4.9/5 on avg.</strong> from 5,000+ local families
                </div>
              </div>
            </div>

            {/* Right Side: Interactive Live Deck Component */}
            <div style={{ position: 'relative' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--rounded-xxl)',
                padding: 'var(--spacing-xl)',
                backdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-mockup)',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '24px'
              }}>
                {/* Dynamic Sliding Tutor Card */}
                <div style={{
                  backgroundColor: 'var(--canvas)',
                  borderRadius: 'var(--rounded-xl)',
                  padding: '24px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  color: 'var(--ink)',
                  transform: 'translateY(-10px)',
                  transition: 'all 0.5s ease'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                      <img 
                        src={mockTutors[activeDeckIndex].avatar} 
                        alt={mockTutors[activeDeckIndex].name} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        backgroundColor: 'var(--brand-green-mid)',
                        borderRadius: '50%',
                        border: '2px solid white'
                      }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{mockTutors[activeDeckIndex].name}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--steel)' }}>{mockTutors[activeDeckIndex].subject} ({mockTutors[activeDeckIndex].institution})</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <span style={{
                      backgroundColor: 'var(--brand-green-soft)',
                      color: 'var(--brand-green-dark)',
                      padding: '4px 10px',
                      borderRadius: 'var(--rounded-xs)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Award size={13} /> {mockTutors[activeDeckIndex].badge}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="var(--accent-orange)" color="var(--accent-orange)" /> <strong>{mockTutors[activeDeckIndex].rating}</strong> ({mockTutors[activeDeckIndex].reviews})
                    </span>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    color: 'var(--steel)',
                    backgroundColor: 'var(--surface)',
                    padding: '8px 12px',
                    borderRadius: 'var(--rounded-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <MapPin size={14} color="var(--stone)" />
                    {mockTutors[activeDeckIndex].checkIn}
                  </div>
                </div>

                {/* Parent Feedback Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--rounded-xl)',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-green-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600
                    }}>
                      {parentReviews[activeDeckIndex].name.substring(0, 2)}
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{parentReviews[activeDeckIndex].name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--on-dark-muted)', marginLeft: '8px' }}>{parentReviews[activeDeckIndex].area}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--on-dark-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    &ldquo;{parentReviews[activeDeckIndex].text}&rdquo;
                  </p>
                </div>

                {/* Deck indicators */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                  {mockTutors.map((_, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveDeckIndex(idx)}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: idx === activeDeckIndex ? 'var(--brand-green)' : 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Core Advantage (USPs) */}
      <section id="verification" style={{ padding: '100px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px auto' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '16px' }}>Built for Trust. Engineered for Results.</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Pakistan&apos;s first geolocation-enabled and NADRA-vetted tuition engine.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {usps.map((usp, idx) => (
              <Card key={idx} style={{ padding: '32px', border: '1px solid var(--hairline-strong)' }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'var(--brand-green-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
                }}>
                  {usp.icon}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>{usp.title}</h3>
                <p style={{ color: 'var(--slate)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{usp.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Prominent Top-Rated Tutors */}
      <section style={{ padding: '100px 0', backgroundColor: 'var(--canvas)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px auto' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '16px' }}>Learn From Pakistan&apos;s Top 1% Educators</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Direct profiles focusing on verified competence and local regions.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {featuredTutors.map((t, idx) => (
              <Card key={idx} style={{ 
                padding: 'var(--spacing-lg)', 
                border: '1px solid var(--hairline)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s',
                hover: { transform: 'translateY(-5px)' }
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                    <img src={t.avatar} alt={t.name} style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 600 }}>{t.name}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--brand-green-dark)', fontWeight: 600 }}>{t.location}</span>
                    </div>
                  </div>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>{t.subject}</h5>
                  <p style={{ fontSize: '14px', color: 'var(--steel)', marginBottom: '20px' }}>{t.tagline}</p>
                </div>
                
                <div style={{ 
                  borderTop: '1px solid var(--hairline)', 
                  paddingTop: '16px',
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--stone)', display: 'block' }}>RATING / METRIC</span>
                    <strong style={{ fontSize: '14px', color: 'var(--charcoal)' }}>{t.score}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: 'var(--stone)', display: 'block' }}>EXPERIENCE</span>
                    <strong style={{ fontSize: '14px', color: 'var(--charcoal)' }}>{t.metrics}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us? (The Feature Deep Dive) */}
      <section id="how-it-works" style={{ padding: '100px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div className="grid-split" style={{ gap: 'var(--spacing-xxl)', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '24px', lineHeight: '1.2' }}>
                The Academy Model is Broken. <span style={{ color: 'var(--brand-green-dark)' }}>Here is How We Fixed It.</span>
              </h2>
              <p style={{ color: 'var(--steel)', fontSize: '16px', marginBottom: '32px' }}>
                Academies take up to 40% of what you pay while unverified classified sites offer zero safety. We created a transparent, verified bridge.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {deepDives.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)',
                      color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, flexShrink: 0, fontSize: '14px'
                    }}>{idx + 1}</div>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', marginTop: '2px' }}>{d.title}</h4>
                      <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Interactive Mockup Container */}
            <div style={{ 
              backgroundColor: 'var(--canvas)',
              borderRadius: 'var(--rounded-xxl)',
              border: '1px solid var(--hairline-strong)',
              boxShadow: 'var(--shadow-mockup)',
              padding: '24px',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
                <span style={{ fontSize: '12px', color: 'var(--stone)', marginLeft: '12px', fontWeight: 500 }}>FindTutors Workspace Engine v1.0</span>
              </div>
              
              {/* App Workspace Mockup */}
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--rounded-lg)', padding: '16px', border: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-green-mid)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Contract: O-Level Math</span>
                  </div>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>In Escrow</span>
                </div>
                
                {/* Chat window mock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '180px', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', maxWidth: '80%', fontSize: '13px' }}>
                    Assalam-o-Alaikum, I have logged today&apos;s physics class. Please check session stats.
                  </div>
                  <div style={{ alignSelf: 'flex-end', backgroundColor: 'var(--brand-green-dark)', color: 'white', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', maxWidth: '80%', fontSize: '13px' }}>
                    Walaikum Assalam. Checked. Perfect explanation on mechanics. I have released this week&apos;s milestone!
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hairline)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--steel)' }}>Milestone Amount: <strong>Rs 12,500</strong></span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ fontSize: '12px', backgroundColor: 'var(--hairline-strong)', color: 'var(--charcoal)', padding: '6px 12px', borderRadius: '4px', fontWeight: 500 }}>Demo Video</button>
                    <button style={{ fontSize: '12px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', padding: '6px 12px', borderRadius: '4px', fontWeight: 600 }}>Release Funds</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Real-Time Application Workspace Preview */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Workspace Preview</h2>
          <p style={{ color: 'var(--steel)', fontSize: '16px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            Check how we track online whiteboard usage and physical attendance securely from the parent dashboard.
          </p>
          <div style={{ 
            backgroundColor: 'var(--surface)', 
            border: '1px solid var(--hairline-strong)', 
            borderRadius: 'var(--rounded-xl)',
            padding: '40px',
            boxShadow: 'var(--shadow-subtle)',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={36} color="var(--brand-green-dark)" style={{ margin: '0 auto 12px auto' }} />
                <h5 style={{ margin: '0 0 4px 0' }}>Attendance Vetted</h5>
                <span style={{ fontSize: '13px', color: 'var(--steel)' }}>GPS Mobile Match Check</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Clock size={36} color="var(--brand-green-dark)" style={{ margin: '0 auto 12px auto' }} />
                <h5 style={{ margin: '0 0 4px 0' }}>Hourly Transparency</h5>
                <span style={{ fontSize: '13px', color: 'var(--steel)' }}>Auto Screen-Logs for Remote</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <DollarSign size={36} color="var(--brand-green-dark)" style={{ margin: '0 auto 12px auto' }} />
                <h5 style={{ margin: '0 0 4px 0' }}>Escrow Guarantee</h5>
                <span style={{ fontSize: '13px', color: 'var(--steel)' }}>Safe Release via JazzCash/1Link</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Frequently Asked Questions (FAQs) */}
      <section style={{ padding: '100px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 700 }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: 'var(--canvas)', 
                  borderRadius: 'var(--rounded-lg)', 
                  border: '1px solid var(--hairline-strong)',
                  overflow: 'hidden'
                }}
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: '16px',
                    textAlign: 'left',
                    color: 'var(--ink)'
                  }}
                >
                  {faq.q}
                  <ChevronDown 
                    size={20} 
                    style={{ 
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </button>
                {openFaq === idx && (
                  <div style={{ 
                    padding: '0 24px 24px 24px', 
                    fontSize: '15px', 
                    color: 'var(--slate)', 
                    lineHeight: '1.6',
                    borderTop: '1px solid var(--hairline-soft)'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final Conversion CTA */}
      <section style={{
        background: 'var(--brand-teal-deep)',
        color: 'var(--on-dark)',
        padding: '100px 0',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 700, color: 'white', marginBottom: '24px' }}>
            Ready to secure your child&apos;s academic future?
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--on-dark-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
            Take 2 minutes to post your specific tuition requirements. Let top-rated local specialists compete for your job with custom budget proposals.
          </p>
          <Link href="/client/search">
            <Button variant="primary" style={{ padding: '18px 36px', fontSize: '16px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', fontWeight: 600 }}>
              Post a Tuition Job for Free
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
