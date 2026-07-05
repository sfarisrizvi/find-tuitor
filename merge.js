const fs = require('fs');

const oldCode = fs.readFileSync('landing_temp.jsx', 'utf8');
const newCode = fs.readFileSync('src/app/client/search/page.js', 'utf8');

const combined = `
'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import { 
  Search, MapPin, Star, ShieldCheck, Clock, ChevronDown, 
  Award, BookOpen, Zap, Filter, SlidersHorizontal, Map, Users, User, Lock
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

export default function SearchTutors() {
  const [isSearching, setIsSearching] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Landing page specific states
  const [landingSearchQuery, setLandingSearchQuery] = useState('');
  const [landingCity, setLandingCity] = useState('');
  const [landingRoute, setLandingRoute] = useState('');

  // Filters State for advanced search
  const [filters, setFilters] = useState({
    city: '',
    subject: '',
    level: '',
    min_price: '',
    max_price: '',
    gender: '',
    min_experience: '',
    verified: false,
    immediate_hiring: false,
    modes: []
  });

  const CITIES = ['Islamabad', 'Rawalpindi', 'Attock', 'Lahore', 'Karachi'];
  const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing'];
  const LEVELS = ['Class 9', 'Class 10', 'O Levels', 'A Levels', 'MDCAT', 'ECAT'];
  const MODES = [
    { id: 'online', label: 'Online' },
    { id: 'home_tuition', label: 'Home Tuition' },
    { id: 'tutor_home', label: 'Tutor Home' }
  ];

  const fetchTutors = async (currentFilters) => {
    setLoading(true);
    const supabase = createClient();
    
    const rpcParams = {
      p_city: currentFilters.city || null,
      p_subjects: currentFilters.subject ? [currentFilters.subject] : null,
      p_levels: currentFilters.level ? [currentFilters.level] : null,
      p_gender: currentFilters.gender || null,
      p_verified: currentFilters.verified || null,
      p_immediate_hiring: currentFilters.immediate_hiring || null,
      p_min_price: currentFilters.min_price ? parseFloat(currentFilters.min_price) : null,
      p_max_price: currentFilters.max_price ? parseFloat(currentFilters.max_price) : null,
      p_min_experience: currentFilters.min_experience ? parseInt(currentFilters.min_experience) : null,
      p_modes: currentFilters.modes.length > 0 ? currentFilters.modes : null
    };

    const { data, error } = await supabase.rpc('search_tutors', rpcParams);
    
    if (error) {
      console.error("Error fetching tutors:", error);
      setTutors([]);
    } else {
      setTutors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      fetchTutors(filters);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTutors(newFilters);
  };

  const toggleMode = (modeId) => {
    let newModes = [...filters.modes];
    if (newModes.includes(modeId)) {
      newModes = newModes.filter(m => m !== modeId);
    } else {
      newModes.push(modeId);
    }
    handleFilterChange('modes', newModes);
  };

  const triggerSearch = () => {
    const newFilters = { ...filters };
    if (landingCity) newFilters.city = landingCity;
    // We can map route to level/subject later if needed, for now just copy city
    setFilters(newFilters);
    fetchTutors(newFilters);
    setIsSearching(true);
  };

  const mockTutors = [
    { id: 'mock-1', full_name: 'Dr. Usman Tariq', city: 'Lahore', qualification: 'Ph.D. Physics', bio: 'Ex-Professor at FAST NUCES, 15+ years teaching Physics.', featured: true, rate: 'Rs 4,500/hr' },
    { id: 'mock-2', full_name: 'Miss Sana Khan', city: 'Islamabad', qualification: 'MSc Applied Biosciences', bio: 'Specialist in A-Level Biology & MDCAT prep.', featured: true, rate: 'Rs 3,500/hr' },
    { id: 'mock-3', full_name: 'Sir Ahmed Shah', city: 'Lahore', qualification: 'MSc Mathematics', bio: 'FSc & Matric Math expert.', featured: true, rate: 'Rs 3,000/hr' }
  ];

  const faqs = [
    { q: "How do I choose the best verified tutor for my child?", a: "You can post a free job describing your subjects, boards, and budget. Our vetted educators will submit custom bids. You can check their qualifications, credentials, rating, and schedule a free 15-minute demo lesson to assess chemistry." },
    { q: "How does the JazzCash/NayaPay secure escrow work?", a: "When you hire a tutor, you fund the milestone. These funds are held securely by FindTutors. Once lessons are logged and you confirm completion, funds are released directly to the tutor." },
    { q: "What if the tutor doesn't check in or misses classes?", a: "Tutors must check in using our mobile app, which verifies their location using GPS geofencing. If they miss classes or log incorrect hours, you can raise a dispute, and our team will refund your escrow wallet." }
  ];

  const displayedTutors = session ? tutors : tutors.slice(0, 3);
  const showAuthOverlay = !session && tutors.length > 3;

  if (!isSearching) {
    return (
      <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', overflowX: 'hidden' }}>
        <section style={{ background: 'linear-gradient(135deg, #001E2B 0%, #002e42 100%)', color: 'var(--on-dark)', padding: '80px 0 100px 0', textAlign: 'center', position: 'relative' }}>
          <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '48px', color: 'white', fontWeight: 700, marginBottom: '24px' }}>Find Pakistan&apos;s Best Verified Tutors</h1>
            <p style={{ color: 'var(--on-dark-muted)', fontSize: '18px', marginBottom: '40px' }}>Search from our top vetted academic elite tutors for Matric, FSc, O/A Levels, and Entry Tests.</p>
            <div style={{ backgroundColor: 'var(--canvas)', padding: '16px', borderRadius: 'var(--rounded-xl)', boxShadow: 'var(--shadow-card)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--stone)' }} />
                <Input placeholder="Search by name, subject, keywords..." value={landingSearchQuery} onChange={e => setLandingSearchQuery(e.target.value)} style={{ paddingLeft: '48px', border: '1px solid var(--hairline-strong)', color: 'var(--ink)' }} />
              </div>
              <div style={{ width: '160px', minWidth: '140px' }}>
                <select className="input-field" value={landingCity} onChange={e => setLandingCity(e.target.value)} style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '15px', color: 'var(--ink)' }}>
                  <option value="">All Cities</option>
                  <option value="karachi">Karachi</option>
                  <option value="lahore">Lahore</option>
                  <option value="islamabad">Islamabad</option>
                  <option value="rawalpindi">Rawalpindi</option>
                  <option value="attock">Attock</option>
                </select>
              </div>
              <Button variant="primary" onClick={triggerSearch} style={{ height: '44px', padding: '0 24px', fontWeight: 600 }}>Search Tutors</Button>
            </div>
          </div>
        </section>

        <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Prominent Verified Tutors</h2>
              <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Top vetted experts available for home and online sessions.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {mockTutors.map((tutor) => (
                <Card key={tutor.id} style={{ border: tutor.featured ? '2px solid var(--brand-green)' : '1px solid var(--hairline-strong)', position: 'relative', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--canvas)', boxShadow: tutor.featured ? '0 8px 24px rgba(0,237,100,0.1)' : 'var(--shadow-subtle)' }}>
                  {tutor.featured && (<span style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Featured</span>)}
                  <div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden' }}><img src={\`https://ui-avatars.com/api/?name=\${tutor.full_name}&background=001E2B&color=00ED64&size=100\`} alt={tutor.full_name} style={{ width: '100%', height: '100%' }} /></div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>{tutor.full_name}</h4>
                        <span style={{ fontSize: '13px', color: 'var(--brand-green-dark)', fontWeight: 500 }}><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> {tutor.city || 'Pakistan'}</span>
                      </div>
                    </div>
                    <h5 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '8px' }}>{tutor.qualification || 'Educator & Subject Specialist'}</h5>
                    <p style={{ fontSize: '14px', color: 'var(--steel)', marginBottom: '24px', lineHeight: '1.5' }}>{tutor.bio || 'Qualified tutor matching federal and Cambridge criteria.'}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--hairline-soft)', paddingTop: '16px', marginBottom: '16px' }}>
                      <div><span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600 }}><Star size={14} fill="var(--accent-orange)" color="var(--accent-orange)" /> 5.0 (Vetted)</span></div>
                      <span style={{ fontSize: '13px', color: 'var(--steel)' }}>95% Job Success</span>
                    </div>
                    <Button variant="outline" onClick={triggerSearch} style={{ width: '100%', padding: '10px' }}>View Profiles</Button>
                  </div>
                </Card>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
               <Button variant="primary" onClick={triggerSearch} style={{ padding: '16px 32px', fontSize: '16px' }}>Browse All Tutors</Button>
            </div>
          </div>
        </section>

        <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px auto' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Why Choose Us</h2>
              <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Built for Trust. Engineered for Results.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
              <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><ShieldCheck size={24} color="var(--brand-green-dark)" /></div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>CNIC & Degree Vetted</h3>
                <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Every single educator is verified through a NADRA-backed identity check and a manual academic transcript audit before placing their first bid.</p>
              </Card>
              <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Lock size={24} color="var(--brand-green-dark)" /></div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Secure Escrow Protection</h3>
                <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Your money stays safe inside our system. Tutors are only paid after they log their sessions and you confirm completion. No advance fee risks.</p>
              </Card>
              <Card style={{ padding: '24px', border: '1px solid var(--hairline-strong)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><MapPin size={24} color="var(--brand-green-dark)" /></div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Tamper-Proof Tracking</h3>
                <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>Know exactly what you are paying for. Our platform utilizes GPS geofencing to verify home tuition attendance, while online sessions automatically log minutes.</p>
              </Card>
            </div>
          </div>
        </section>

        <section style={{ padding: '80px 0', backgroundColor: 'var(--surface)' }}>
          <div className="container">
            <div className="grid-split" style={{ gap: 'var(--spacing-xxl)', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>The Academy Model is Broken. <span style={{ color: 'var(--brand-green-dark)' }}>Here is How We Fixed It.</span></h2>
                <p style={{ color: 'var(--steel)', fontSize: '16px', marginBottom: '32px' }}>Traditional academies take up to 40% of what you pay while unverified classified sites offer zero safety. We created a transparent, verified bridge.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>1</div>
                    <div>
                      <h4 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px' }}>Skip the Hidden Academy Cuts</h4>
                      <p style={{ color: 'var(--slate)', fontSize: '14px', margin: 0 }}>FindTutors operates on a transparent model, passing maximum value straight to families and educators.</p>
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
              <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-xxl)', border: '1px solid var(--hairline-strong)', boxShadow: 'var(--shadow-mockup)', padding: '24px' }}>
                <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--rounded-lg)', padding: '16px', border: '1px solid var(--hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Contract: O-Level Math</span>
                    <span style={{ fontSize: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>In Escrow</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', maxWidth: '85%', fontSize: '13px' }}>Assalam-o-Alaikum, today&apos;s O-level math hours are logged. Check statistics.</div>
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

        <section style={{ padding: '80px 0', backgroundColor: 'var(--canvas)' }}>
          <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 700 }}>Client FAQ</h2>
              <p style={{ color: 'var(--steel)', fontSize: '16px' }}>Answers to your questions about matching, tuition monitoring, and payments.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline-strong)', overflow: 'hidden' }}>
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '16px', color: 'var(--ink)', textAlign: 'left' }}>
                    {faq.q}
                    <ChevronDown style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {openFaq === idx && (<div style={{ padding: '0 20px 20px 20px', fontSize: '14px', color: 'var(--slate)', lineHeight: '1.6', borderTop: '1px solid var(--hairline-soft)' }}>{faq.a}</div>)}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: 'var(--brand-teal-deep)', color: 'var(--on-dark)', padding: '80px 0', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '700px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Ready to secure your child&apos;s academic future?</h2>
            <p style={{ fontSize: '16px', color: 'var(--on-dark-muted)', marginBottom: '32px' }}>Post your tuition requirements for free and receive custom bids from verified educators.</p>
            <Link href="/client/jobs/new">
              <Button variant="primary" style={{ padding: '16px 32px', fontSize: '16px', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}>Post a Tuition Job for Free</Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // ADVANCED SEARCH VIEW
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      <div style={{ backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline-strong)', position: 'sticky', top: 0, zIndex: 40, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px', cursor: 'pointer' }} onClick={() => setIsSearching(false)}>
            <Search size={20} color="var(--brand-green-dark)" />
            Find Tutors
          </div>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} style={{ width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px', borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff', fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
              <option value="">Any City</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
          </div>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <BookOpen size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select value={filters.subject} onChange={(e) => handleFilterChange('subject', e.target.value)} style={{ width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px', borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff', fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
              <option value="">Any Subject</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
          </div>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Award size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)} style={{ width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px', borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff', fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
              <option value="">Any Level/Class</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
          </div>
          <Button className="mobile-filter-btn" variant="outline" onClick={() => setShowFilters(!showFilters)} style={{ display: 'none' }}>
            <SlidersHorizontal size={16} style={{ marginRight: '8px' }} /> Filters
          </Button>
        </div>
      </div>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', padding: '24px', gap: '32px' }}>
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }} className={\`sidebar-filters \${showFilters ? 'open' : ''}\`}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range (Rs/hr)</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input type="number" placeholder="Min" value={filters.min_price} onChange={(e) => handleFilterChange('min_price', e.target.value)} style={{ height: '36px', fontSize: '14px' }} />
              <span style={{ color: 'var(--stone)' }}>-</span>
              <Input type="number" placeholder="Max" value={filters.max_price} onChange={(e) => handleFilterChange('max_price', e.target.value)} style={{ height: '36px', fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Any', 'Male', 'Female'].map(g => {
                const val = g === 'Any' ? '' : g;
                const active = filters.gender === val;
                return (
                  <button key={g} onClick={() => handleFilterChange('gender', val)} style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, border: active ? '1.5px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)', backgroundColor: active ? 'var(--brand-green-soft)' : '#fff', color: active ? 'var(--brand-green-dark)' : 'var(--stone)', cursor: 'pointer', transition: 'all 0.15s ease' }}>{g}</button>
                )
              })}
            </div>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Experience (Years)</h3>
            <select value={filters.min_experience} onChange={(e) => handleFilterChange('min_experience', e.target.value)} style={{ width: '100%', height: '36px', paddingLeft: '12px', paddingRight: '12px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff', fontSize: '14px', cursor: 'pointer', outline: 'none' }}>
              <option value="">Any Experience</option>
              <option value="1">1+ Years</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
              <option value="10">10+ Years</option>
            </select>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teaching Mode</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MODES.map(mode => (
                <label key={mode.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                  <input type="checkbox" checked={filters.modes.includes(mode.id)} onChange={() => toggleMode(mode.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }} />
                  {mode.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requirements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                <input type="checkbox" checked={filters.verified} onChange={(e) => handleFilterChange('verified', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }} />
                <ShieldCheck size={16} color="var(--brand-teal)" /> Verified Only
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                <input type="checkbox" checked={filters.immediate_hiring} onChange={(e) => handleFilterChange('immediate_hiring', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }} />
                <Zap size={16} color="#f59e0b" /> Immediate Hiring
              </label>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {loading ? 'Searching...' : \`\${tutors.length} Tutors Found\`}
            </h2>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--stone)' }}>Loading results...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', paddingBottom: showAuthOverlay ? '140px' : '40px' }}>
              {displayedTutors.map((tutor) => (
                <Card key={tutor.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  {tutor.immediate_hiring && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} fill="#D97706" /> IMMEDIATE
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--surface)', flexShrink: 0, backgroundImage: tutor.avatar_url ? \`url(\${tutor.avatar_url})\` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--hairline)' }}>
                      {!tutor.avatar_url && <User size={28} color="var(--stone)" />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>{tutor.full_name}</h3>
                        {tutor.verified && <ShieldCheck size={16} color="var(--brand-teal)" />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--steel)', marginBottom: '4px' }}>
                        <MapPin size={14} /> {tutor.city} {tutor.area && \`- \${tutor.area}\`}
                      </div>
                      {tutor.rating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                          <Star size={14} fill="#f59e0b" /> {tutor.rating} <span style={{ color: 'var(--stone)', fontWeight: 400 }}>({tutor.reviews_count} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--ink)', marginBottom: '16px', lineHeight: '1.5', flex: 1 }}>{tutor.bio || 'Experienced tutor dedicated to student success.'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {tutor.categories?.slice(0, 3).map((cat, i) => (
                      <span key={i} style={{ backgroundColor: 'var(--surface)', color: 'var(--steel)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--hairline)' }}>{cat.subject || cat.level}</span>
                    ))}
                    {tutor.categories?.length > 3 && <span style={{ fontSize: '12px', color: 'var(--stone)', alignSelf: 'center' }}>+{tutor.categories.length - 3} more</span>}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hourly Rate</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>Rs {tutor.hourly_rate || 'N/A'}</div>
                    </div>
                    <Link href={\`/tutors/\${tutor.id}\`}>
                      <Button variant="outline" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>View Profile</Button>
                    </Link>
                  </div>
                </Card>
              ))}
              {tutors.length === 0 && !loading && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', color: 'var(--stone)' }}>
                  <Search size={48} color="var(--hairline-strong)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No tutors found</h3>
                  <p>Try adjusting your filters to see more results.</p>
                </div>
              )}
            </div>
          )}
          {showAuthOverlay && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '350px', background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.9) 40%, rgba(250,250,250,1) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '60px', zIndex: 10, pointerEvents: 'all' }}>
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <Lock size={32} color="var(--stone)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>{tutors.length - 3} more tutors available</h3>
                <p style={{ color: 'var(--steel)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>Create a free account or log in to view all matching tutors, see their full profiles, and start messaging.</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <Link href="/signup"><Button variant="primary" style={{ height: '48px', padding: '0 32px', borderRadius: '999px', fontSize: '15px' }}>Sign Up Free</Button></Link>
                  <Link href="/login"><Button variant="outline" style={{ height: '48px', padding: '0 32px', borderRadius: '999px', fontSize: '15px', backgroundColor: '#fff' }}>Log In</Button></Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/client/search/page.js', combined);
console.log('Successfully merged!');
