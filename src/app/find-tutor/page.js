'use client';
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Star, ShieldCheck, Lock, ChevronDown
} from 'lucide-react';

export default function FindTutorLanding() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const mockTutors = [
    { id: 'mock-1', full_name: 'Dr. Usman Tariq', city: 'Lahore', qualification: 'Ph.D. Physics', bio: 'Ex-Professor at FAST NUCES, 15+ years teaching Physics.', featured: true, rate: 'Rs 4,500/hr' },
    { id: 'mock-2', full_name: 'Miss Sana Khan', city: 'Islamabad', qualification: 'MSc Applied Biosciences', bio: 'Specialist in A-Level Biology & MDCAT prep.', featured: true, rate: 'Rs 3,500/hr' },
    { id: 'mock-3', full_name: 'Sir Ahmed Shah', city: 'Lahore', qualification: 'MSc Mathematics', bio: 'FSc & Matric Math expert.', featured: true, rate: 'Rs 3,000/hr' }
  ];

  const faqs = [
    { q: "How do I choose the best verified tutor for my child?", a: "You can post a free job describing your subjects, boards, and budget. Our vetted educators will submit custom bids. You can check their qualifications, credentials, rating, and schedule a free 15-minute demo lesson to assess chemistry." },
    { q: "How does the JazzCash/NayaPay secure escrow work?", a: "When you hire a tutor, you fund the milestone. These funds are held securely by TutorOnline. Once lessons are logged and you confirm completion, funds are released directly to the tutor." },
    { q: "What if the tutor doesn't check in or misses classes?", a: "Tutors must check in using our mobile app, which verifies their location using GPS geofencing. If they miss classes or log incorrect hours, you can raise a dispute, and our team will refund your escrow wallet." }
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    router.push(`/find-tutor/search?${params.toString()}`);
  };

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
            Find Pakistan&apos;s Best Verified Tutors
          </h1>
          <p style={{ color: 'var(--on-dark-muted)', fontSize: '18px', marginBottom: '40px' }}>
            Search from our top vetted academic elite tutors for Matric, FSc, O/A Levels, and Entry Tests.
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
                placeholder="Search by name, subject, keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '48px', border: '1px solid var(--hairline-strong)', color: 'var(--ink)' }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div style={{ width: '160px', minWidth: '140px' }}>
              <select
                className="input-field"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                style={{
                  width: '100%', height: '44px', padding: '0 12px', borderRadius: 'var(--rounded-md)',
                  border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '15px', color: 'var(--ink)'
                }}
              >
                <option value="">All Cities</option>
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Attock">Attock</option>
              </select>
            </div>

            <Button variant="primary" onClick={handleSearch} style={{ height: '44px', padding: '0 24px', fontWeight: 600 }}>
              Search Tutors
            </Button>
          </div>
        </div>
      </section>

      {/* Grid Section: 3 Prominent Tutors */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Prominent Verified Tutors</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Top vetted experts available for home and online sessions.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-lg)'
          }}>
            {mockTutors.map((tutor) => (
              <Card
                key={tutor.id}
                style={{
                  border: tutor.featured ? '2px solid var(--brand-green)' : '1px solid var(--hairline-strong)',
                  position: 'relative',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--canvas)',
                  boxShadow: tutor.featured ? '0 8px 24px rgba(0,237,100,0.1)' : 'var(--shadow-subtle)'
                }}
              >
                {tutor.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'var(--brand-green-soft)',
                    color: 'var(--brand-green-dark)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Featured
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${tutor.full_name}&background=001E2B&color=00ED64&size=100`}
                        alt={tutor.full_name}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>{tutor.full_name}</h4>
                      <span style={{ fontSize: '13px', color: 'var(--brand-green-dark)', fontWeight: 500 }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> {tutor.city}
                      </span>
                    </div>
                  </div>

                  <h5 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '8px' }}>
                    {tutor.qualification}
                  </h5>
                  <p style={{ fontSize: '14px', color: 'var(--steel)', marginBottom: '24px', lineHeight: '1.5' }}>
                    {tutor.bio}
                  </p>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--hairline-soft)',
                    paddingTop: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600 }}>
                        <Star size={14} fill="var(--accent-orange)" color="var(--accent-orange)" /> 5.0 (Vetted)
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--steel)' }}>95% Job Success</span>
                  </div>

                  <Button variant="outline" onClick={handleSearch} style={{ width: '100%', padding: '10px' }}>
                    View Profiles
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Button variant="primary" onClick={handleSearch} style={{ padding: '16px 32px', fontSize: '16px' }}>
              Browse All Tutors
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px auto' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Why Choose Us</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Built for Trust. Engineered for Results.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <ShieldCheck size={24} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>CNIC & Degree Verified</h3>
              <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Every single educator is verified through a NADRA-backed identity check and a manual academic transcript audit before placing their first bid.
              </p>
            </Card>

            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Lock size={24} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Secure Escrow Protection</h3>
              <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Your money stays safe inside our system. Tutors are only paid after they log their sessions and you confirm completion. No advance fee risks.
              </p>
            </Card>

            <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <MapPin size={24} color="var(--brand-green-dark)" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Tamper-Proof Tracking</h3>
              <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Know exactly what you are paying for. Our platform utilizes GPS geofencing to verify home tuition attendance, while online sessions automatically log minutes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <div className="grid-split" style={{ gap: 'var(--spacing-xxl)', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>
                The Academy Model is Broken. <span style={{ color: 'var(--brand-green-dark)' }}>Here is How We Fixed It.</span>
              </h2>
              <p style={{ color: 'var(--steel)', fontSize: '16px', marginBottom: '32px' }}>
                Traditional academies take up to 40% of what you pay while unverified classified sites offer zero safety. We created a transparent, verified bridge.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Skip the Hidden Academy Cuts</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>TutorOnline operates on a transparent model, passing maximum value straight to families and educators.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>The 15-Minute Free Demo</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>Once you shortlist an educator, schedule a free 15-minute live video demo directly inside our app.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Complete Curricular Coverage</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>We match you with board specialists who know the exact marking schemes for Federal and Cambridge board.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side mockup */}
            <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-xxl)', border: '1px solid var(--hairline-strong)', boxShadow: 'var(--shadow-mockup)', padding: '24px' }}>
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--rounded-lg)', padding: '16px', border: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Contract: O-Level Math</span>
                  <span style={{ fontSize: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>In Escrow</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', maxWidth: '85%', fontSize: '13px' }}>
                    Assalam-o-Alaikum, today&apos;s O-level math hours are logged. Check statistics.
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hairline)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--steel)' }}>Milestone: <strong>Rs 12,500</strong></span>
                  <button style={{ fontSize: '12px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', padding: '6px 12px', borderRadius: '4px', fontWeight: 600 }}>Release Funds</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Client FAQ</h2>
            <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Answers to your questions about matching, tuition monitoring, and payments.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => (
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
            Ready to secure your child&apos;s academic future?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--on-dark-muted)', marginBottom: '32px' }}>
            Post your tuition requirements for free and receive custom bids from verified educators.
          </p>
          <Link href="/client/jobs/new">
            <Button variant="primary" style={{ padding: '16px 32px', fontSize: '16px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}>
              Post a Tuition Job for Free
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
