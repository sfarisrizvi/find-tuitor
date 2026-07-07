'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Star, MapPin, ShieldCheck, Lock, Phone, Mail, Award,
  CheckCircle2, BookOpen, Globe, Clock, Briefcase, GraduationCap,
  ChevronRight, Users, Calendar, Pencil, Camera, X
} from 'lucide-react';
import Link from 'next/link';
import { ImageCropModal } from '../../../components/ui/ImageCropModal';
import { CategoryEditModal } from '../../../components/ui/CategoryEditModal';
import { ExperienceEditModal } from '../../../components/ui/ExperienceEditModal';

const PAKISTANI_CITIES = ['Islamabad', 'Rawalpindi', 'Attock', 'Lahore', 'Karachi'];

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

// ─── Verification Row ─────────────────────────────────────────
// status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
function VerifyRow({ label, status, docKey, helpText, isOwner, onUpload, rejectionNote }) {
  const isApproved = status === 'approved';
  const isPending  = status === 'pending';
  const isRejected = status === 'rejected';
  const hasDoc     = isPending || isApproved || isRejected;

  const icon = isApproved
    ? <CheckCircle2 size={18} color="var(--brand-green-dark)" style={{ flexShrink: 0 }} />
    : isPending
      ? <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #F59E0B', backgroundColor: '#FEF3C7', flexShrink: 0 }} />
      : isRejected
        ? <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #EF4444', backgroundColor: '#FEE2E2', flexShrink: 0 }} />
        : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--hairline-strong)', flexShrink: 0 }} />;

  const statusBadge = isApproved
    ? <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '2px 8px', borderRadius: '999px' }}>VERIFIED</span>
    : isPending
      ? <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '999px' }}>PENDING REVIEW</span>
      : isRejected
        ? <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '999px' }}>ACTION REQUIRED</span>
        : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <span style={{ fontSize: '14px', color: hasDoc ? 'var(--ink)' : 'var(--stone)', fontWeight: hasDoc ? 500 : 400 }}>{label}</span>
        {statusBadge}
      </div>
      {/* Rejection note from admin */}
      {isRejected && rejectionNote && (
        <div style={{ marginLeft: '28px', fontSize: '12px', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FECACA' }}>
          {rejectionNote}
        </div>
      )}
      {/* Owner upload prompt when not yet submitted */}
      {isOwner && !hasDoc && docKey && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '28px', cursor: 'pointer', fontSize: '12px', color: 'var(--brand-green-dark)', fontWeight: 600 }}>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={(e) => onUpload(e, docKey)} />
          ↑ Upload {helpText || label}
        </label>
      )}
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
  const [selectedDay, setSelectedDay] = useState('mon');
  const [editingSlots, setEditingSlots] = useState(null); // { day, slots: [{start, end}] }
  
  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [cropConfig, setCropConfig] = useState(null); // { imageSrc, type, aspect }
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isEditingExperience, setIsEditingExperience] = useState(false);

  const loadData = async () => {
    try {
      console.log('[DEBUG] loadData started, id:', id);
      const supabase = createClient();
      console.log('[DEBUG] Supabase client created');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const u = authUser || null;
      console.log('[DEBUG] User fetched:', u?.id);
      setUser(u);

      if (id.startsWith('mock-')) {
        await Promise.resolve();
        console.log('[DEBUG] Loading mock tutor');
        const found = MOCK_TUTORS.find(t => t.id === id) || MOCK_TUTORS[0];
        setTutor(found);
        setExperience(found.experience || []);
        setCategories(found.categories || []);
      } else {
        console.log('[DEBUG] Fetching tutor profile from database');
        const { data: profile, error: pErr } = await supabase.from('tutor_profiles').select('*').eq('id', id).single();
        if (pErr) {
          console.error('[DEBUG] Error fetching tutor profile:', pErr);
        }
        console.log('[DEBUG] Tutor profile fetched:', profile?.id);
        if (profile) {
          if (!u) {
            if (profile.about) {
              profile.about = profile.about.substring(0, 150) + '...';
            }
            profile.phone = '+92 **********';
            profile.email = '******@******.***';
            profile.kyc_status = null;
            profile.kyc_docs = null;
          }
          setTutor(profile);
        }
        console.log('[DEBUG] Fetching experience from database');
        const { data: exp, error: eErr } = await supabase.from('tutor_experience').select('*').eq('tutor_id', id).order('sort_order');
        if (eErr) {
          console.error('[DEBUG] Error fetching tutor experience:', eErr);
        }
        console.log('[DEBUG] Experience fetched:', exp?.length);
        setExperience(exp || []);

        console.log('[DEBUG] Fetching categories from database');
        const { data: cats, error: cErr } = await supabase.from('tutor_categories').select('*').eq('tutor_id', id);
        if (cErr) {
          console.error('[DEBUG] Error fetching tutor categories:', cErr);
        }
        console.log('[DEBUG] Categories fetched:', cats?.length);
        setCategories(cats || []);
      }
    } catch (err) {
      console.error('[DEBUG] Error loading data:', err);
    } finally {
      console.log('[DEBUG] loadData finished, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const avgRating = tutor.rating ?? null;
  const reviewsCount = tutor.reviews_count ?? 0;
  const displayRate = tutor.hourly_rate ? `Rs ${tutor.hourly_rate.toLocaleString()}/hr` : 'Negotiable';
  const isOwner = user && user.id === tutor.id;

  // Media is served through /api/media/[tutorId]/[type] proxy — storage paths never exposed to browser
  const getMediaUrl = (type) => `/api/media/${tutor.id}/${type}`;
  // Fallback for external URLs already stored (e.g. during early dev)
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/api/media/${tutor.id}/${path.includes('avatar') ? 'avatar' : 'cover'}`;
  };

  const getDaySlotsArray = (dayKey) => {
    const slots = tutor.availability_slots || {};
    const dayConfig = slots[dayKey];
    if (!dayConfig || !dayConfig.active) return [];
    if (dayConfig.slots && Array.isArray(dayConfig.slots)) return dayConfig.slots;
    if (dayConfig.start && dayConfig.end) return [{ start: dayConfig.start, end: dayConfig.end }];
    return [];
  };

  const saveAvailability = async (newSlots) => {
    const supabase = createClient();
    const daysArr = Object.entries(newSlots)
      .filter(([, config]) => config && config.active)
      .map(([day]) => day);
    const { error } = await supabase
      .from('tutor_profiles')
      .update({ availability_slots: newSlots, availability_days: daysArr })
      .eq('id', tutor.id);
    if (!error) {
      setTutor(prev => ({ ...prev, availability_slots: newSlots, availability_days: daysArr }));
      setEditingSlots(null);
    }
  };

  const handleKycUpload = async (e, docKey) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const path = `${user.id}/kyc/${docKey}_${timestamp}.${ext}`;
    const { error: upErr } = await supabase.storage.from('teacher-files').upload(path, file, { upsert: true });
    if (upErr) { alert('Upload failed. Try again.'); return; }
    const newDocs = { ...(tutor.kyc_docs || {}), [docKey]: path };
    await supabase.from('tutor_profiles').update({ kyc_docs: newDocs }).eq('id', user.id);
    setTutor(prev => ({ ...prev, kyc_docs: newDocs }));
  };

  const handleSaveField = async (field) => {
    const supabase = createClient();
    const updatePayload = { [field]: editValues[field] };
    // If editing location, update both city and area
    if (field === 'location') {
      updatePayload.city = editValues.city;
      updatePayload.area = editValues.area;
    }
    const { error } = await supabase.from('tutor_profiles').update(updatePayload).eq('id', tutor.id);
    if (!error) {
      setTutor(prev => ({ ...prev, ...updatePayload }));
      setEditingField(null);
    } else {
      alert('Error updating field');
    }
  };

  const handleImageSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropConfig({
        imageSrc: reader.result,
        type,
        aspect: type === 'cover' ? 4 / 1 : 1
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset input
  };

  const handleCropComplete = async (croppedBlob) => {
    if (!cropConfig || !user) return;
    const supabase = createClient();
    const { type } = cropConfig;
    const timestamp = new Date().getTime();
    const path = `${user.id}/${type}/${timestamp}.jpg`;
    const bucket = 'teacher-media';

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, croppedBlob, { upsert: true });
    if (upErr) { alert('Upload failed'); return; }
    
    const { error: dbErr } = await supabase.from('tutor_profiles').update({ [`${type}_url`]: path }).eq('id', user.id);
    if (!dbErr) {
      setTutor(prev => ({ ...prev, [`${type}_url`]: path }));
    }
    setCropConfig(null);
  };

  const handleSaveCategories = async (newCategories) => {
    const supabase = createClient();
    // Delete existing categories
    await supabase.from('tutor_categories').delete().eq('tutor_id', tutor.id);
    // Insert new
    if (newCategories.length > 0) {
      const rows = newCategories.map(c => ({
        tutor_id: tutor.id,
        level: c.level,
        category: 'Academic',
        subject: c.subject
      }));
      const { error } = await supabase.from('tutor_categories').insert(rows);
      if (error) {
        alert('Failed to save categories: ' + error.message);
      }
    }
    setCategories(newCategories);
    setIsEditingCategories(false);
  };

  const handleSaveExperience = async (newExp) => {
    const supabase = createClient();
    await supabase.from('tutor_experience').delete().eq('tutor_id', tutor.id);
    if (newExp.length > 0) {
      const rows = newExp.map(e => ({
        tutor_id: tutor.id,
        institution: e.institution,
        role: e.role,
        year_from: parseInt(e.year_from),
        year_to: e.year_to && !e.current ? parseInt(e.year_to) : null,
        description: e.description || ''
      }));
      await supabase.from('tutor_experience').insert(rows);
    }
    setExperience(newExp);
    setIsEditingExperience(false);
  };


  const coverUrl = tutor.cover_url ? getMediaUrl('cover') : null;
  const avatarUrl = tutor.avatar_url ? getMediaUrl('avatar') : null;

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    let hour = parseInt(hourStr);
    const min = minStr || '00';
    const ampm = hour >= 12 ? 'pm' : 'am';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${min} ${ampm}`;
  };

  const getActiveSlots = () => {
    const slots = tutor.availability_slots || {};
    if (slots.morning !== undefined || slots.afternoon !== undefined || slots.evening !== undefined) {
      return Object.entries(slots).filter(([, v]) => v).map(([slot]) => slot);
    }
    const activeSlots = [];
    Object.entries(slots).forEach(([day, config]) => {
      if (config && config.active && config.start && config.end) {
        const startHr = parseInt(config.start.split(':')[0]);
        const endHr = parseInt(config.end.split(':')[0]);
        if (startHr < 12) {
          if (!activeSlots.includes('morning')) activeSlots.push('morning');
        }
        if (startHr < 17 && endHr >= 12) {
          if (!activeSlots.includes('afternoon')) activeSlots.push('afternoon');
        }
        if (endHr >= 17) {
          if (!activeSlots.includes('evening')) activeSlots.push('evening');
        }
      }
    });
    return activeSlots;
  };

  const getExperienceText = () => {
    if (!experience || experience.length === 0) return 'N/A';
    let earliestYear = new Date().getFullYear();
    let hasAny = false;
    experience.forEach(e => {
      if (e.year_from) {
        hasAny = true;
        if (e.year_from < earliestYear) earliestYear = e.year_from;
      }
    });
    if (!hasAny) return 'N/A';
    const diff = new Date().getFullYear() - earliestYear;
    return diff > 0 ? `${diff}+ Years` : '1 Year';
  };

  const getLocationText = () => {
    const city = tutor.city || '';
    const area = tutor.area || '';
    if (city && area) return `${city}, ${area}`;
    return city || area || 'Pakistan';
  };

  const renderModeBadges = () => {
    const modes = tutor.teaching_modes || [];
    if (modes.length === 0) return <span style={{ fontSize: '15px', color: 'var(--stone)', fontWeight: 600 }}>Online 🌐</span>;
    return (
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
        {modes.map(m => {
          const label = { online: 'Online', home_visit: 'Home Visit', own_place: 'Own Place' }[m] || m;
          const icon = { online: '🌐', home_visit: '🏠', own_place: '🏫' }[m] || '✓';
          return (
            <span key={m} style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              padding: '3px 8px', 
              borderRadius: '6px', 
              backgroundColor: 'var(--surface-soft)', 
              border: '1px solid var(--hairline)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--slate)'
            }}>
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          );
        })}
      </div>
    );
  };

  // Group categories by level
  const catByLevel = categories.reduce((acc, cat) => {
    if (!acc[cat.level]) acc[cat.level] = [];
    const displayName = cat.subject || 'General Curriculum';
    if (!acc[cat.level].includes(displayName)) {
      acc[cat.level].push(displayName);
    }
    return acc;
  }, {});

  const levelLabels = {
    'Kindergarten': 'Kindergarten',
    'Primary': 'Primary Grade',
    'Secondary': 'Secondary Grade',
    'Matric': 'Matric Grade',
    'Inter': 'Intermediate / Inter',
    'BS/MS': 'BS / MS University',
    primary: 'Primary', secondary: 'Secondary / Matric', inter: 'Intermediate',
    cambridge: 'Cambridge O/A Levels', bs_ms: 'BS / MS University',
    entry_test: 'Entry Tests', consultancy: 'General Consultancy',
  };

  const levelColors = {
    'Kindergarten': '#3B82F6',
    'Primary': '#10B981',
    'Secondary': '#6366F1',
    'Matric': '#8B5CF6',
    'Inter': '#F59E0B',
    'BS/MS': '#EF4444',
    primary: '#3B82F6', secondary: '#8B5CF6', inter: '#F59E0B',
    cambridge: '#10B981', bs_ms: '#EF4444', entry_test: '#EC4899', consultancy: '#6366F1',
  };



  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', padding: '32px 0 60px' }}>
      <style>{`
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .profile-header-row {
          display: flex;
          gap: 28px;
          align-items: flex-start;
          position: relative;
          margin-bottom: 32px;
          padding-left: 4px;
        }
        .profile-avatar-wrap {
    width: 250px;
    height: 250px;
    border-radius: 50%;
    border: 4px solid #f3f3f3;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    margin-top: -120px;
    z-index: 10;
        }
        .profile-header-text {
          flex: 1;
          padding-top: 12px;
        }
        @media (max-width: 768px) {
          .profile-header-row {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 16px !important;
          }
        
          .profile-header-text {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
      
      {cropConfig && (
        <ImageCropModal 
          imageSrc={cropConfig.imageSrc} 
          aspect={cropConfig.aspect} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropConfig(null)} 
        />
      )}
      {isEditingCategories && (
        <CategoryEditModal 
          initialCategories={categories}
          onSave={handleSaveCategories}
          onCancel={() => setIsEditingCategories(false)}
        />
      )}
      {isEditingExperience && (
        <ExperienceEditModal
          initialExperience={experience}
          onSave={handleSaveExperience}
          onCancel={() => setIsEditingExperience(false)}
        />
      )}

      <div className="profile-container">

        <div style={{
          height: '280px',
          background: coverUrl
            ? `url("${coverUrl}") center/cover no-repeat`
            : 'linear-gradient(135deg, var(--brand-teal-deep) 0%, var(--brand-teal-mid) 50%, var(--brand-green-dark) 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '24px'
        }}>
          {isOwner && (
            <label style={{
              position: 'absolute', top: 16, right: 16,
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '8px 12px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ink)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Camera size={16} /> Edit Cover
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageSelect(e, 'cover')} />
            </label>
          )}
        </div>

        {/* ── Profile Header ── */}
        <div className="profile-header-row">
          {/* Avatar Container */}
          <div style={{ position: 'relative', flexShrink: 0, zIndex: 10, marginTop: '-120px' }}>
            <div
              className="profile-avatar-wrap"
              style={{
                backgroundColor: 'var(--brand-green-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: avatarUrl ? `url("${avatarUrl}") center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))',
                marginTop: 0,
              }}
            >
              {!avatarUrl && <span style={{ color: '#fff', fontSize: '54px', fontWeight: 700 }}>{tutor.full_name?.charAt(0)}</span>}
            </div>
            {isOwner && (
              <label style={{
                position: 'absolute', bottom: 12, right: 12,
                backgroundColor: 'var(--brand-green-dark)',
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 11
              }} title="Edit Profile Picture">
                <Camera size={18} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageSelect(e, 'avatar')} />
              </label>
            )}
          </div>

          {/* Name & Bio Container (fully in the white space) */}
          <div className="profile-header-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {editingField === 'full_name' ? (
                <>
                  <Input value={editValues.full_name || ''} onChange={e => setEditValues(p => ({ ...p, full_name: e.target.value }))} style={{ fontSize: '24px', fontWeight: 800 }} />
                  <button onClick={() => handleSaveField('full_name')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)' }}><CheckCircle2 size={24} /></button>
                  <button onClick={() => setEditingField(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}><X size={24} /></button>
                </>
              ) : (
                <>
                  <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: 'var(--ink)' }}>{tutor.full_name}</h1>
                  {tutor.verified && (
                    <img 
                      src="/shield.svg" 
                      alt="Verified Profile" 
                      style={{ width: '22px', height: '22px', display: 'block', flexShrink: 0 }} 
                    />
                  )}
                  {isOwner && (
                    <button onClick={() => { setEditValues({ full_name: tutor.full_name }); setEditingField('full_name'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }} title="Edit Name">
                      <Pencil size={18} />
                    </button>
                  )}
                </>
              )}
            </div>

            {editingField === 'bio' ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '8px 0 12px', width: '100%', maxWidth: '600px' }}>
                <textarea 
                  value={editValues.bio || ''} 
                  onChange={e => setEditValues(p => ({ ...p, bio: e.target.value }))} 
                  style={{ flex: 1, minHeight: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={() => handleSaveField('bio')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)' }}><CheckCircle2 size={20} /></button>
                  <button onClick={() => setEditingField(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}><X size={20} /></button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px' }}>
                <p style={{ margin: 0, fontSize: '16px', color: 'var(--slate)', fontWeight: 500, lineHeight: '1.5' }}>{tutor.bio}</p>
                {isOwner && (
                  <button onClick={() => { setEditValues({ bio: tutor.bio }); setEditingField('bio'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}>
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {editingField === 'location' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Select 
                    value={editValues.city || ''} 
                    onChange={e => setEditValues(p => ({ ...p, city: e.target.value }))} 
                    style={{ width: '140px', height: '36px', fontSize: '14px' }}
                    options={PAKISTANI_CITIES.map(c => ({ label: c, value: c }))}
                    placeholder="Select City"
                  />
                  <Input placeholder="Area" value={editValues.area || ''} onChange={e => setEditValues(p => ({ ...p, area: e.target.value }))} style={{ width: '120px', height: '36px', fontSize: '14px' }} />
                  <button onClick={() => handleSaveField('location')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)' }}><CheckCircle2 size={18} /></button>
                  <button onClick={() => setEditingField(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}><X size={18} /></button>
                </div>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--stone)', fontWeight: 500 }}>
                  <MapPin size={14} /> {getLocationText()}
                  {isOwner && (
                    <button onClick={() => { setEditValues({ city: tutor.city, area: tutor.area }); setEditingField('location'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', marginLeft: '4px' }}>
                      <Pencil size={14} />
                    </button>
                  )}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#D97706', fontWeight: 600 }}>
                {avgRating !== null ? (
                  <>
                    {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}{' '}
                    <span style={{ color: 'var(--stone)' }}>{avgRating.toFixed(1)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 400 }}>({reviewsCount})</span>
                  </>
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--stone)', fontWeight: 400 }}>No reviews yet</span>
                )}
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
            { icon: Star, label: 'Rating', value: avgRating !== null
              ? <span style={{ color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>★ <span style={{ color: 'var(--ink)' }}>{avgRating.toFixed(1)}</span><span style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 400 }}>({reviewsCount})</span></span>
              : <span style={{ color: 'var(--stone)', fontSize: '13px' }}>No reviews</span> },
            { icon: Briefcase, label: 'Experience', value: getExperienceText() },
            { icon: MapPin, label: 'Location', value: getLocationText() },
            { icon: Users, label: 'Teaching Mode', value: renderModeBadges() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
              <Icon size={18} color="var(--brand-green-dark)" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid-profile" style={{ gap: '32px', alignItems: 'flex-start' }}>
          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Teaching Categories */}
            {(Object.keys(catByLevel).length > 0 || isOwner) && (
              <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Teaching Categories</h2>
                  {isOwner && (
                    <button onClick={() => setIsEditingCategories(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                </div>
                {Object.keys(catByLevel).length === 0 ? (
                  <p style={{ margin: 0, fontSize: '15px', color: 'var(--stone)' }}>No categories added yet.</p>
                ) : (
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
                )}
              </section>
            )}

            {/* About */}
            {(tutor.about || isOwner) && (
              <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>About Me</h2>
                  {isOwner && editingField !== 'about' && (
                    <button onClick={() => { setEditValues({ about: tutor.about || '' }); setEditingField('about'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                </div>
                
                {editingField === 'about' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea 
                      value={editValues.about || ''} 
                      onChange={e => setEditValues(p => ({ ...p, about: e.target.value }))} 
                      style={{ width: '100%', minHeight: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--hairline-strong)', fontSize: '15px', lineHeight: '1.6', fontFamily: 'inherit' }} 
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" onClick={() => setEditingField(null)} style={{ padding: '6px 12px', height: '32px', fontSize: '13px' }}>Cancel</Button>
                      <Button variant="primary" onClick={() => handleSaveField('about')} style={{ padding: '6px 12px', height: '32px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      fontSize: '15px', lineHeight: '1.8', color: 'var(--slate)', margin: 0,
                      position: 'relative',
                      ...(!isUnlocked && {
                        maxHeight: '90px',
                        overflow: 'hidden',
                        maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
                        paddingBottom: '20px'
                      }),
                      whiteSpace: 'pre-wrap'
                    }}>
                      {tutor.about || 'No description provided.'}
                    </div>
                    {!isUnlocked && tutor.about && (
                      <div style={{ position: 'absolute', bottom: '-10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, paddingTop: '10px' }}>
                        <Link href="/login" style={{ textDecoration: 'none' }}>
                          <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', height: '36px', padding: '0 16px', boxShadow: 'var(--shadow-subtle)' }}>
                            <Lock size={12} /> Log in to read full bio
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Experience Timeline */}
            {(experience.length > 0 || isOwner) && (
              <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Experience</h2>
                  {isOwner && (
                    <button onClick={() => setIsEditingExperience(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                </div>
                
                {experience.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '15px', color: 'var(--stone)' }}>No experience added yet.</p>
                ) : (
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
                )}
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
              {/* Teaching Availability - Days */}
              {(() => {
                const allDays = [
                  { key: 'mon', label: 'Monday' },
                  { key: 'tue', label: 'Tuesday' },
                  { key: 'wed', label: 'Wednesday' },
                  { key: 'thu', label: 'Thursday' },
                  { key: 'fri', label: 'Friday' },
                  { key: 'sat', label: 'Saturday' },
                  { key: 'sun', label: 'Sunday' },
                ];
                const slots = tutor.availability_slots || {};

                if (isOwner) {
                  /* === OWNER INLINE EDITOR === */
                  const selCfg = slots[selectedDay] || { active: false, start: '07:00', end: '19:00' };
                  const selSlots = getDaySlotsArray(selectedDay);

                  return (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)', marginBottom: '10px' }}>AVAILABILITY</div>

                      {/* Day selector pills */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {allDays.map(({ key, label }) => {
                          const cfg = slots[key] || { active: false };
                          const active = !!cfg.active;
                          const isSelected = selectedDay === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedDay(key)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: isSelected ? '2px solid var(--brand-green-dark)' : active ? '1.5px solid var(--brand-green-dark)' : '1.5px solid var(--hairline-strong)',
                                backgroundColor: active ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
                                color: active ? 'var(--brand-green-dark)' : 'var(--stone)',
                                outline: isSelected ? '2px solid var(--brand-green-dark)' : 'none',
                                outlineOffset: '1px',
                                transition: 'all 0.15s',
                              }}
                            >
                              {label.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected day config */}
                      <div style={{ backgroundColor: 'var(--surface-soft)', borderRadius: '10px', padding: '14px', border: '1px solid var(--hairline)' }}>
                        {/* Active toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: selCfg.active ? '12px' : 0 }}>
                          <input
                            type="checkbox"
                            checked={!!selCfg.active}
                            onChange={e => {
                              const updated = { ...slots, [selectedDay]: { ...selCfg, active: e.target.checked } };
                              saveAvailability(updated);
                            }}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '14px', color: selCfg.active ? 'var(--ink)' : 'var(--stone)' }}>
                            {allDays.find(d => d.key === selectedDay)?.label} — {selCfg.active ? 'Available' : 'Not Available'}
                          </span>
                        </label>

                        {selCfg.active && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Time slots */}
                            {(editingSlots && editingSlots.day === selectedDay ? editingSlots.slots : selSlots).map((slot, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="time"
                                  value={slot.start || '07:00'}
                                  onChange={e => {
                                    const newSlotList = [...(editingSlots?.slots || selSlots)];
                                    newSlotList[i] = { ...newSlotList[i], start: e.target.value };
                                    setEditingSlots({ day: selectedDay, slots: newSlotList });
                                  }}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '13px', fontWeight: 600 }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--stone)' }}>to</span>
                                <input
                                  type="time"
                                  value={slot.end || '19:00'}
                                  onChange={e => {
                                    const newSlotList = [...(editingSlots?.slots || selSlots)];
                                    newSlotList[i] = { ...newSlotList[i], end: e.target.value };
                                    setEditingSlots({ day: selectedDay, slots: newSlotList });
                                  }}
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '13px', fontWeight: 600 }}
                                />
                                {(editingSlots?.slots || selSlots).length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newSlotList = [...(editingSlots?.slots || selSlots)];
                                      newSlotList.splice(i, 1);
                                      setEditingSlots({ day: selectedDay, slots: newSlotList });
                                    }}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                                    title="Remove slot"
                                  >✕</button>
                                )}
                              </div>
                            ))}

                            {/* Add slot + Save buttons */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button
                                onClick={() => {
                                  const currentSlots = editingSlots?.slots || selSlots;
                                  setEditingSlots({ day: selectedDay, slots: [...currentSlots, { start: '07:00', end: '19:00' }] });
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '6px', border: '1px dashed var(--brand-green-dark)', background: 'transparent', color: 'var(--brand-green-dark)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                + Add slot
                              </button>

                              {editingSlots && editingSlots.day === selectedDay && (
                                <>
                                  <button
                                    onClick={() => {
                                      const updated = {
                                        ...slots,
                                        [selectedDay]: {
                                          ...selCfg,
                                          slots: editingSlots.slots,
                                          start: editingSlots.slots[0]?.start || selCfg.start,
                                          end: editingSlots.slots[editingSlots.slots.length - 1]?.end || selCfg.end,
                                        }
                                      };
                                      saveAvailability(updated);
                                      setEditingSlots(null);
                                    }}
                                    style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: 'var(--brand-green-dark)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingSlots(null)}
                                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--hairline-strong)', background: 'transparent', fontSize: '12px', cursor: 'pointer', color: 'var(--stone)' }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );

                } else {
                  /* === PUBLIC VIEW === */
                  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                  const activeDays = (tutor.availability_days || []).slice().sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
                  
                  if (activeDays.length === 0) {
                    return <div style={{ fontSize: '14px', color: 'var(--stone)', marginTop: '12px' }}>No availability specified.</div>;
                  }

                  const getDaySlotsStr = (dayKey) => {
                    const cfg = slots[dayKey];
                    // New format
                    if (cfg && typeof cfg === 'object' && cfg.active) {
                      if (cfg.slots && Array.isArray(cfg.slots) && cfg.slots.length > 0) {
                        return cfg.slots.map(s => `${formatTime12h(s.start)} – ${formatTime12h(s.end)}`);
                      }
                      if (cfg.start && cfg.end) {
                        return [`${formatTime12h(cfg.start)} – ${formatTime12h(cfg.end)}`];
                      }
                    }
                    // Fallback to old format if this day is in activeDays but no new-format cfg exists
                    if (activeDays.includes(dayKey)) {
                      const oldSlots = [];
                      if (slots.morning) oldSlots.push('7:00 am – 12:00 pm');
                      if (slots.afternoon) oldSlots.push('12:00 pm – 5:00 pm');
                      if (slots.evening) oldSlots.push('5:00 pm – 9:00 pm');
                      if (oldSlots.length > 0) return oldSlots;
                      return ['Available'];
                    }
                    return [];
                  };

                  return (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {activeDays.map(dayKey => {
                          const daySlots = getDaySlotsStr(dayKey);
                          const dayLabel = allDays.find(d => d.key === dayKey)?.label || dayKey;
                          
                          return (
                            <div key={dayKey} style={{ 
                              backgroundColor: 'var(--canvas)', 
                              padding: '16px', 
                              borderRadius: '12px', 
                              border: '1px solid var(--hairline)',
                              boxShadow: 'var(--shadow-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <div style={{ 
                                fontSize: '15px', 
                                fontWeight: 600, 
                                color: 'var(--ink)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px' 
                              }}>
                                <Calendar size={15} style={{ color: 'var(--brand-green-dark)', flexShrink: 0 }} />
                                {dayLabel}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {daySlots.map((timeRange, idx) => (
                                  <div key={idx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    fontSize: '13px', 
                                    color: 'var(--charcoal)', 
                                    backgroundColor: 'var(--surface)', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontWeight: 500,
                                    border: '1px solid var(--hairline)',
                                  }}>
                                    <Clock size={12} style={{ color: 'var(--brand-green-dark)', flexShrink: 0 }} />
                                    <span>{timeRange}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              })()}
            </section>

            {/* Verified Documents */}
            <section style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px', position: 'relative' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Verification Status</h2>
              <div style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  filter: isUnlocked ? 'none' : 'blur(4px)',
                  pointerEvents: isUnlocked ? 'auto' : 'none',
                  userSelect: isUnlocked ? 'auto' : 'none'
                }}>
                  {(() => {
                    const docs   = tutor.kyc_docs || {};
                    const verif  = tutor.kyc_verifications || {};

                    // Derive per-doc status from kyc_verifications (new),
                    // with backward compat for old single kyc_status string.
                    const oldApproved = tutor.kyc_status === 'approved';

                    const getDocStatus = (docKey, hasDoc) => {
                      const v = verif[docKey];
                      if (v && v.status) return v.status;
                      // Backward compat
                      if (oldApproved) return 'approved';
                      if (hasDoc) return 'pending';
                      return 'not_submitted';
                    };

                    const hasCnic   = !!(docs.cnic_front || docs.cnic_back);
                    const hasDegree = !!docs.degree;

                    const cnicStatus   = getDocStatus('cnic', hasCnic);
                    const degreeStatus = getDocStatus('degree', hasDegree);
                    const bgStatus     = verif.background?.status
                      || (oldApproved ? 'approved'
                        : (hasCnic || hasDegree) ? 'pending'
                        : 'not_submitted');
                    const bgNote = verif.background?.note || '';

                    // Background icon/badge
                    const bgIcon = bgStatus === 'approved'
                      ? <CheckCircle2 size={18} color="var(--brand-green-dark)" style={{ flexShrink: 0 }} />
                      : bgStatus === 'rejected'
                        ? <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #EF4444', backgroundColor: '#FEE2E2', flexShrink: 0 }} />
                        : bgStatus === 'pending'
                          ? <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #F59E0B', backgroundColor: '#FEF3C7', flexShrink: 0 }} />
                          : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--hairline-strong)', flexShrink: 0 }} />;

                    const bgBadge = bgStatus === 'approved'
                      ? <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '2px 8px', borderRadius: '999px' }}>VERIFIED</span>
                      : bgStatus === 'rejected'
                        ? <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '999px' }}>ACTION REQUIRED</span>
                        : bgStatus === 'pending'
                          ? <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '999px' }}>PENDING</span>
                          : null;

                    return (
                      <>
                        <VerifyRow
                          label="CNIC / Identity Verified"
                          status={cnicStatus}
                          docKey="cnic_front"
                          helpText="CNIC (front)"
                          isOwner={isOwner}
                          onUpload={handleKycUpload}
                        />
                        <VerifyRow
                          label="Degree / Academic Credentials"
                          status={degreeStatus}
                          docKey="degree"
                          helpText="degree certificate"
                          isOwner={isOwner}
                          onUpload={handleKycUpload}
                        />

                        {/* Background Check — driven by kyc_verifications.background */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {bgIcon}
                            <span style={{ fontSize: '14px', color: bgStatus !== 'not_submitted' ? 'var(--ink)' : 'var(--stone)', fontWeight: bgStatus !== 'not_submitted' ? 500 : 400 }}>Background Check</span>
                            {bgBadge}
                          </div>
                          {/* Admin rejection note */}
                          {bgStatus === 'rejected' && bgNote && (
                            <div style={{ marginLeft: '28px', fontSize: '12px', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FECACA' }}>
                              {bgNote}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}

                </div>
                {!isUnlocked && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px' }}>
                    <Link href="/login" style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', height: '36px', padding: '0 16px' }}>
                        <Lock size={12} /> Log in to view status
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contact Card */}
            <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '24px', position: 'relative' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>{displayRate}</h3>
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
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)' }}>
                      <Phone size={16} color="var(--stone)" />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--stone)' }}>+92 **********</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)' }}>
                      <Mail size={16} color="var(--stone)" />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--stone)' }}>******@******.***</span>
                    </div>
                  </div>
                  
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" style={{ width: '100%', height: '44px', marginBottom: '8px' }}>
                      Log in to see contact info
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Signals */}
            <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--hairline)', padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700 }}>Why FindTutors.pk?</h4>
              {[
                { icon: '💰', text: 'Transparent direct-pay model' },
                { icon: '🎓', text: '15-minute free video demos' },
                { icon: '✅', text: 'Credential-vetted educator profiles' },
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
    </div>
  );
}
