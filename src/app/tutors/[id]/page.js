'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Star, MapPin, ShieldCheck, Lock, Phone, Mail, Award,
  CheckCircle2, BookOpen, Globe, Clock, Briefcase, GraduationCap,
  ChevronRight, Users, Calendar
} from 'lucide-react';
import Link from 'next/link';

// ─── Mock data for demo ───────────────────────────────────────
const MOCK_TUTORS = [
  {
    id: 'mock-1', full_name: 'Dr. Usman Tariq', city: 'Lahore', kyc_status: 'approved',
    jss_score: 100, bio: 'PhD Physics · 15+ yrs A-Level & O-Level · 300+ students mentored',
    about: 'I am an ex-professor at FAST NUCES with 15+ years of teaching Physics and Mathematics. My approach focuses on building deep conceptual understanding rather than rote memorization. I use real-world analogies, structured problem-solving techniques, and past-paper walkthroughs to ensure my students excel. All my A-Level students have scored A or A* in the past 5 exam sessions.',
    hourly_rate: 4500, experience_years: 15,
    languages: ['English', 'Urdu'],
    teaching_modes: ['home_visit', 'online'],
    service_radius_km: 25, service_cities: ['Lahore', 'Islamabad'],
    availability_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    availability_slots: { morning: false, afternoon: true, evening: true },
    phone: '+92 300 9876543', email: 'usman.tariq@example.com',
    categories: [
      { level: 'cambridge', category: 'A Levels' }, { level: 'cambridge', category: 'O Levels' },
      { level: 'entry_test', category: 'ECAT (Engineering)' },
    ],
    experience: [
      { institution: 'FAST-NUCES Lahore', role: 'Assistant Professor', year_from: 2009, year_to: 2018, description: 'Taught Engineering Physics and Mechanics to 1st year students.' },
      { institution: 'City Grammar School', role: 'Senior A-Level Physics Teacher', year_from: 2018, year_to: null, description: 'Preparing A-Level students for CAIE examinations.' },
    ]
  },
  {
    id: 'mock-2', full_name: 'Miss Sana Khan', city: 'Islamabad', kyc_status: 'approved',
    jss_score: 98, bio: 'MSc Biosciences (NUST) · MDCAT Specialist · 140+ hours logged',
    about: 'I specialize in A-Level Biology and MDCAT preparation. My mnemonics-based approach for biochemistry has helped hundreds of students achieve top scores. I have a structured 90-day MDCAT crash course that I offer to serious students targeting top medical universities.',
    hourly_rate: 3500, experience_years: 5,
    languages: ['English', 'Urdu', 'Punjabi'],
    teaching_modes: ['online', 'own_place'],
    own_place_address: 'G-11/3, Islamabad',
    service_radius_km: 15, service_cities: ['Islamabad', 'Rawalpindi'],
    availability_days: ['mon', 'wed', 'fri', 'sat', 'sun'],
    availability_slots: { morning: true, afternoon: true, evening: false },
    phone: '+92 321 1234567', email: 'sana.khan@example.com',
    categories: [
      { level: 'entry_test', category: 'MDCAT (Medical)' }, { level: 'cambridge', category: 'A Levels' },
      { level: 'inter', category: 'Inter Pre-Medical (Biology, Physics, Chemistry)' },
    ],
    experience: [
      { institution: 'Roots IVY International School', role: 'Biology Teacher', year_from: 2020, year_to: 2023 },
      { institution: 'Freelance Tutor', role: 'MDCAT Specialist', year_from: 2023, year_to: null, description: 'Full-time MDCAT crash courses and A-Level Biology.' },
    ]
  },
];

const DAYS_LABEL = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const SLOT_LABEL = { morning: '7am–12pm', afternoon: '12pm–5pm', evening: '5pm–9pm', night: '9pm–12am' };

// ─── Gating Overlay (auth modal) ────────────────────────────
function AuthGate({ tutorName, onSuccess }) {
  const [mode, setMode] = useState('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role: 'client', client_type: role } }
      });
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.5) 100%)' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-xl)', padding: '32px', boxShadow: 'var(--shadow-modal)', margin: '0 16px' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--surface-soft)', borderRadius: 'var(--rounded-md)', padding: '4px', marginBottom: '24px' }}>
          {['signup', 'login'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: mode === m ? 'var(--canvas)' : 'transparent', fontWeight: mode === m ? 600 : 400, color: 'var(--ink)', cursor: 'pointer', fontSize: '14px', boxShadow: mode === m ? 'var(--shadow-subtle)' : 'none' }}>
              {m === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Lock size={28} color="var(--brand-green-dark)" style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
            {mode === 'signup' ? 'Sign up to view full profile' : 'Log in to continue'}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--steel)' }}>
            See {tutorName}&apos;s contact details, hourly rate, and verified credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <>
              <Input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
              <select value={role} onChange={e => setRole(e.target.value)} style={{ height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', fontSize: '14px', backgroundColor: 'var(--canvas)' }}>
                <option value="parent">I am a Parent</option>
                <option value="student">I am a Student</option>
              </select>
            </>
          )}
          <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div style={{ color: '#C00', fontSize: '13px', backgroundColor: '#FFF0F0', padding: '8px 12px', borderRadius: '6px' }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', height: '44px' }}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create Free Account →' : 'Log In →'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────
export default function TutorProfile() {
  const { id } = useParams();
  const [tutor, setTutor] = useState(null);
  const [experience, setExperience] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      if (id.startsWith('mock-')) {
        const found = MOCK_TUTORS.find(t => t.id === id) || MOCK_TUTORS[0];
        setTutor(found);
        setExperience(found.experience || []);
        setCategories(found.categories || []);
      } else {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profile) setTutor(profile);
        const { data: exp } = await supabase.from('tutor_experience').select('*').eq('tutor_id', id).order('sort_order');
        setExperience(exp || []);
        const { data: cats } = await supabase.from('tutor_categories').select('*').eq('tutor_id', id);
        setCategories(cats || []);
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const isUnlocked = !!user;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--steel)' }}>Loading profile…</div>
    </div>
  );

  if (!tutor) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--steel)' }}>Tutor not found.</div>
  );

  const avgRating = 4.8 + (tutor.jss_score || 0) * 0.002;
  const displayRate = tutor.hourly_rate ? `Rs ${tutor.hourly_rate.toLocaleString()}/hr` : 'Negotiable';

  // Group categories by level
  const catByLevel = categories.reduce((acc, cat) => {
    if (!acc[cat.level]) acc[cat.level] = [];
    acc[cat.level].push(cat.category);
    return acc;
  }, {});

  const levelLabels = {
    primary: 'Primary', secondary: 'Secondary / Matric', inter: 'Intermediate',
    cambridge: 'Cambridge O/A Levels', bs_ms: 'BS / MS University',
    entry_test: 'Entry Tests', consultancy: 'General Consultancy',
  };

  const levelColors = {
    primary: '#3B82F6', secondary: '#8B5CF6', inter: '#F59E0B',
    cambridge: '#10B981', bs_ms: '#EF4444', entry_test: '#EC4899', consultancy: '#6366F1',
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      {/* ── Cover Banner ── */}
      <div style={{
        height: '280px',
        background: tutor.cover_url
          ? `url(${tutor.cover_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, var(--brand-teal-deep) 0%, var(--brand-teal-mid) 50%, var(--brand-green-dark) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', backgroundColor: 'rgba(0,237,100,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', backgroundColor: 'rgba(0,237,100,0.07)' }} />
      </div>

      {/* ── Profile Header ── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ position: 'relative', marginTop: '-70px', marginBottom: '24px', display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
          {/* Avatar */}
          <div style={{
            width: '130px', height: '130px', borderRadius: '50%',
            backgroundColor: 'var(--brand-green-dark)',
            border: '4px solid var(--canvas)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
            background: tutor.avatar_url ? `url(${tutor.avatar_url}) center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))',
          }}>
            {!tutor.avatar_url && <span style={{ color: '#fff', fontSize: '48px', fontWeight: 700 }}>{tutor.full_name?.charAt(0)}</span>}
          </div>

          <div style={{ paddingBottom: '12px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{tutor.full_name}</h1>
              {tutor.kyc_status === 'approved' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', border: '1px solid var(--brand-green-dark)' }}>
                  <ShieldCheck size={13} /> CNIC Verified
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 8px', fontSize: '15px', color: 'var(--steel)' }}>{tutor.bio}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {tutor.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--stone)' }}>
                  <MapPin size={14} /> {tutor.city}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#D97706' }}>
                {'★'.repeat(5)} <span style={{ color: 'var(--stone)' }}>{avgRating.toFixed(1)}</span>
              </span>
              {tutor.jss_score > 0 && (
                <span style={{ fontSize: '13px', color: 'var(--stone)' }}>JSS Score: <strong style={{ color: 'var(--ink)' }}>{tutor.jss_score}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid-4col" style={{ gap: '12px', marginBottom: '32px' }}>
          {[
            { icon: Clock, label: 'Hourly Rate', value: isUnlocked ? displayRate : <span style={{ color: 'var(--stone)', fontStyle: 'italic', fontSize: '13px' }}>Sign in to view</span> },
            { icon: Briefcase, label: 'Experience', value: tutor.experience_years ? `${tutor.experience_years}+ Years` : 'N/A' },
            { icon: Globe, label: 'Languages', value: (tutor.languages || []).length > 0 ? tutor.languages.join(', ') : 'Urdu, English' },
            { icon: Users, label: 'Teaching Mode', value: (tutor.teaching_modes || []).map(m => ({ own_place: 'Own Place', home_visit: 'Home Visit', online: 'Online' }[m] || m)).join(', ') || 'Online' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', padding: '16px', textAlign: 'center' }}>
              <Icon size={18} color="var(--brand-green-dark)" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid-profile" style={{ gap: '32px', alignItems: 'flex-start' }}>
          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Teaching Categories */}
            {Object.keys(catByLevel).length > 0 && (
              <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px' }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Teaching Categories</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(catByLevel).map(([level, cats]) => (
                    <div key={level}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        {levelLabels[level] || level}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {cats.map(cat => (
                          <span key={cat} style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, backgroundColor: `${levelColors[level]}15`, color: levelColors[level], border: `1px solid ${levelColors[level]}40` }}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* About */}
            {tutor.about && (
              <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px', position: 'relative' }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>About Me</h2>
                <div style={{ position: 'relative' }}>
                  <p style={{
                    fontSize: '15px', lineHeight: '1.8', color: 'var(--slate)', margin: 0,
                    filter: isUnlocked ? 'none' : 'blur(5px)',
                    userSelect: isUnlocked ? 'auto' : 'none',
                    transition: 'filter 0.3s ease',
                    maxHeight: isUnlocked ? 'none' : '120px', overflow: 'hidden',
                  }}>
                    {tutor.about}
                  </p>
                  {!isUnlocked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', color: 'var(--steel)', border: '1px solid var(--hairline-strong)' }}>
                        <Lock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Sign in to read full bio
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Experience Timeline */}
            {experience.length > 0 && (
              <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px' }}>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700 }}>Experience</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {experience.map((exp, i) => (
                    <div key={i} style={{ position: 'relative', paddingLeft: '28px', paddingBottom: i < experience.length - 1 ? '24px' : 0 }}>
                      {/* Line */}
                      {i < experience.length - 1 && <div style={{ position: 'absolute', left: '6px', top: '14px', bottom: 0, width: '2px', backgroundColor: 'var(--hairline)' }} />}
                      {/* Dot */}
                      <div style={{ position: 'absolute', left: 0, top: '4px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--brand-green-dark)', border: '2px solid var(--canvas)', boxShadow: '0 0 0 2px var(--brand-green-dark)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{exp.role}</div>
                          <div style={{ fontSize: '14px', color: 'var(--brand-green-dark)', fontWeight: 600 }}>{exp.institution}</div>
                          {exp.description && <div style={{ fontSize: '13px', color: 'var(--steel)', marginTop: '4px', lineHeight: '1.6' }}>{exp.description}</div>}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--stone)', flexShrink: 0, backgroundColor: 'var(--surface-soft)', padding: '3px 10px', borderRadius: '999px' }}>
                          {exp.year_from} – {exp.year_to ? exp.year_to : 'Present'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Teaching Availability */}
            <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Teaching Availability</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {(tutor.teaching_modes || ['online']).map(mode => {
                  const modeInfo = { own_place: { label: 'Own Place 🏠', color: '#3B82F6' }, home_visit: { label: 'Home Visits 🚗', color: '#F59E0B' }, online: { label: 'Online 💻', color: '#10B981' } };
                  const info = modeInfo[mode] || { label: mode, color: '#6366F1' };
                  return (
                    <span key={mode} style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, backgroundColor: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30` }}>
                      {info.label}
                    </span>
                  );
                })}
              </div>
              {tutor.service_cities?.length > 0 && (
                <div style={{ fontSize: '13px', color: 'var(--steel)', marginBottom: '12px' }}>
                  <MapPin size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Serves: {tutor.service_cities.join(' · ')} within {tutor.service_radius_km}km
                </div>
              )}
              {/* Availability days */}
              {(tutor.availability_days || []).length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)', marginBottom: '8px' }}>AVAILABLE DAYS</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['mon','tue','wed','thu','fri','sat','sun'].map(d => {
                      const active = (tutor.availability_days || []).includes(d);
                      return (
                        <span key={d} style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, backgroundColor: active ? 'var(--brand-green-dark)' : 'var(--surface-soft)', color: active ? '#fff' : 'var(--stone)' }}>
                          {DAYS_LABEL[d]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Time slots */}
              {tutor.availability_slots && Object.keys(tutor.availability_slots).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)', marginBottom: '8px' }}>AVAILABLE TIMES</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(tutor.availability_slots).filter(([, v]) => v).map(([slot]) => (
                      <span key={slot} style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', fontWeight: 600 }}>
                        {slot.charAt(0).toUpperCase() + slot.slice(1)} · {SLOT_LABEL[slot]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Verified Documents */}
            <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Verification Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'CNIC / Identity Verified', done: tutor.kyc_status === 'approved' },
                  { label: 'Degree / Academic Credentials', done: !!(tutor.kyc_docs?.degree) },
                  { label: 'Background Check', done: tutor.kyc_status === 'approved' },
                ].map(({ label, done }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {done ? <CheckCircle2 size={18} color="var(--brand-green-dark)" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--hairline-strong)' }} />}
                    <span style={{ fontSize: '14px', color: done ? 'var(--ink)' : 'var(--stone)' }}>{label}</span>
                    {done && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '2px 8px', borderRadius: '999px' }}>VERIFIED</span>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contact Card */}
            <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px', position: 'relative' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>{isUnlocked ? displayRate : 'Rs ···/hr'}</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--stone)' }}>Hourly rate · Negotiable</p>

              {isUnlocked ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)' }}>
                      <Phone size={16} color="var(--brand-green-dark)" />
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{tutor.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)' }}>
                      <Mail size={16} color="var(--brand-green-dark)" />
                      <span style={{ fontSize: '14px', fontWeight: 500, wordBreak: 'break-all' }}>{tutor.email}</span>
                    </div>
                  </div>
                  <Button variant="primary" style={{ width: '100%', height: '44px', marginBottom: '8px' }}>
                    Send Message
                  </Button>
                  <Button variant="secondary" style={{ width: '100%', height: '40px', fontSize: '13px' }}>
                    Request a Trial Class
                  </Button>
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: 'blur(4px)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)', fontSize: '14px' }}>+92 ••• •••••••</div>
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)', fontSize: '14px' }}>••••••@example.com</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', borderRadius: 'var(--rounded-md)', padding: '12px', textAlign: 'center', border: '1px solid var(--hairline)' }}>
                    <Lock size={18} color="var(--stone)" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '13px', color: 'var(--steel)', fontWeight: 500 }}>Sign up to view contact details</div>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Signals */}
            <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700 }}>Why FindTutors.pk?</h4>
              {[
                { icon: '🔒', text: 'All payments via secure escrow' },
                { icon: '📍', text: 'GPS-verified tuition check-ins' },
                { icon: '✅', text: 'CNIC-verified tutors only' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--slate)' }}>
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom padding */}
        <div style={{ height: '64px' }} />
      </div>

      {/* ── Auth Gate Overlay ── */}
      {!isUnlocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-xl)', padding: '32px', boxShadow: 'var(--shadow-modal)', margin: '0 16px' }}>
            <AuthGate tutorName={tutor.full_name} onSuccess={loadData} />
          </div>
        </div>
      )}
    </div>
  );
}
