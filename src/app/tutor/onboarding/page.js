'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Camera, Upload, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2,
  MapPin, Clock, DollarSign, BookOpen, FileText, Video, AlertCircle, Check
} from 'lucide-react';

// ============================================================
// TEACHING CATEGORIES DATA
// ============================================================
const TEACHING_CATEGORIES = [
  {
    level: 'primary',
    label: 'Primary Level',
    desc: 'Class 1 – Class 8',
    categories: [
      { key: 'primary_general', label: 'General Primary (Class 1–5)' },
      { key: 'primary_middle', label: 'Middle School (Class 6–8)' },
    ]
  },
  {
    level: 'secondary',
    label: 'Secondary / Matric',
    desc: 'Class 9–10 (SSC)',
    categories: [
      { key: 'secondary_science', label: 'Science Group', sub: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'] },
      { key: 'secondary_arts', label: 'Arts Group', sub: ['Urdu', 'English', 'Islamiat', 'Pakistan Studies', 'History'] },
    ]
  },
  {
    level: 'inter',
    label: 'Intermediate / FSc / FA',
    desc: 'Class 11–12 (HSSC)',
    categories: [
      { key: 'inter_pre_eng', label: 'Pre-Engineering (Maths, Physics, Chemistry)' },
      { key: 'inter_pre_med', label: 'Pre-Medical (Biology, Physics, Chemistry)' },
      { key: 'inter_ics', label: 'ICS – Computer Science' },
      { key: 'inter_arts', label: 'FA – Arts' },
      { key: 'inter_commerce', label: 'I.Com – Commerce' },
    ]
  },
  {
    level: 'cambridge',
    label: 'Cambridge (O / A Levels)',
    desc: 'CAIE Curriculum',
    categories: [
      { key: 'cambridge_o_level', label: 'O Levels', sub: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Economics'] },
      { key: 'cambridge_a_level', label: 'A Levels', sub: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Accounting', 'Psychology'] },
    ]
  },
  {
    level: 'bs_ms',
    label: 'BS / MS University',
    desc: 'Undergraduate & Postgraduate',
    categories: [
      { key: 'bs_engineering', label: 'Engineering (EE, CS, ME, Civil)' },
      { key: 'bs_medical', label: 'Medical / MBBS Sciences' },
      { key: 'bs_cs_it', label: 'CS & IT' },
      { key: 'bs_business', label: 'Business & Commerce' },
      { key: 'bs_social', label: 'Social Sciences & Arts' },
    ]
  },
  {
    level: 'entry_test',
    label: 'Entry Tests',
    desc: 'Competitive exam preparation',
    categories: [
      { key: 'mdcat', label: 'MDCAT (Medical)' },
      { key: 'ecat', label: 'ECAT (Engineering)' },
      { key: 'net', label: 'NET (NUST)' },
      { key: 'nat', label: 'NAT (NTS)' },
      { key: 'gat', label: 'GAT (NTS Graduate)' },
      { key: 'hat', label: 'HAT (HEC)' },
      { key: 'gre', label: 'GRE / GMAT' },
      { key: 'issb', label: 'ISSB (Armed Forces)' },
      { key: 'sat', label: 'SAT / ACT' },
    ]
  },
  {
    level: 'consultancy',
    label: 'General Consultancy',
    desc: 'Counselling & guidance',
    categories: [
      { key: 'career_counselling', label: 'Career & Study Abroad Counselling' },
      { key: 'university_apps', label: 'University Application Guidance' },
      { key: 'language_english', label: 'English Language (IELTS / TOEFL / Spoken)' },
      { key: 'quran_islamic', label: 'Quran / Islamic Studies' },
    ]
  },
];

const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Saraiki', 'Arabic', 'French'];
const PAKISTANI_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha'];
const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];
const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', sub: '7am – 12pm' },
  { key: 'afternoon', label: 'Afternoon', sub: '12pm – 5pm' },
  { key: 'evening', label: 'Evening', sub: '5pm – 9pm' },
  { key: 'night', label: 'Night', sub: '9pm – 12am' },
];

const TOTAL_STEPS = 8;

// ============================================================
// HELPER COMPONENTS
// ============================================================
function StepHeader({ step, title, desc }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{step}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
      </div>
      {desc && <p style={{ margin: '0 0 0 42px', color: 'var(--steel)', fontSize: '14px' }}>{desc}</p>}
    </div>
  );
}

function UploadBox({ label, hint, accept, onChange, value, icon: Icon = Upload }) {
  const ref = useRef();
  return (
    <div>
      {label && <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>{label}</label>}
      <div
        onClick={() => ref.current.click()}
        style={{
          border: value ? '2px solid var(--brand-green-dark)' : '2px dashed var(--hairline-strong)',
          borderRadius: 'var(--rounded-md)',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: value ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
          transition: 'all 0.15s ease',
        }}
      >
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--brand-green-dark)' }}>
            <CheckCircle2 size={22} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{typeof value === 'string' ? value : value.name}</span>
          </div>
        ) : (
          <>
            <Icon size={28} color="var(--stone)" style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--slate)', marginBottom: '4px' }}>Click to upload</div>
            {hint && <div style={{ fontSize: '12px', color: 'var(--stone)' }}>{hint}</div>}
          </>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => onChange && onChange(e.target.files[0])} />
    </div>
  );
}

function CategorySection({ group, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', marginBottom: '8px' }}>
      {/* Group Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', backgroundColor: expanded ? 'var(--brand-green-soft)' : 'var(--canvas)' }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>{group.label}</span>
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--stone)' }}>{group.desc}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {group.categories.some(c => selected[c.key]) && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '2px 8px', borderRadius: '999px' }}>
              {group.categories.filter(c => selected[c.key]).length} selected
            </span>
          )}
          <span style={{ fontSize: '18px', color: 'var(--steel)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
        </div>
      </div>
      {/* Nested Categories */}
      {expanded && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--hairline)', backgroundColor: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {group.categories.map(cat => (
            <div key={cat.key}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <div
                  onClick={() => onToggle(cat.key)}
                  style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                    border: selected[cat.key] ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)',
                    backgroundColor: selected[cat.key] ? 'var(--brand-green-dark)' : 'var(--canvas)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  {selected[cat.key] && <Check size={11} color="#fff" />}
                </div>
                <div onClick={() => onToggle(cat.key)}>
                  <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--charcoal)' }}>{cat.label}</span>
                  {cat.sub && (
                    <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '2px' }}>
                      Subjects: {cat.sub.join(' · ')}
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TutorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Step 1: Photo & Cover
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [bio, setBio] = useState('');

  // Step 2: KYC docs
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [degree, setDegree] = useState(null);
  const [certificates, setCertificates] = useState([]);

  // Step 3: Teaching Categories
  const [selectedCategories, setSelectedCategories] = useState({});

  // Step 4: Languages
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Step 5: Experience
  const [experiences, setExperiences] = useState([
    { institution: '', role: '', year_from: '', year_to: '', description: '', current: false }
  ]);

  // Step 6: Availability
  const [teachingModes, setTeachingModes] = useState({ own_place: false, home_visit: false, online: false });
  const [ownPlaceAddress, setOwnPlaceAddress] = useState('');
  const [ownPlaceImages, setOwnPlaceImages] = useState([]);
  const [serviceRadius, setServiceRadius] = useState(10);
  const [serviceCities, setServiceCities] = useState([]);

  // Step 7: Schedule & Rate
  const [availDays, setAvailDays] = useState({});
  const [availSlots, setAvailSlots] = useState({});
  const [hourlyRate, setHourlyRate] = useState('');

  // Step 8: About
  const [about, setAbout] = useState('');
  const [introVideo, setIntroVideo] = useState(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push('/login'); return; }
      setUser(u);
      // Load existing progress
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
      if (profile) {
        setBio(profile.bio || '');
        setAbout(profile.about || '');
        setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
        setOwnPlaceAddress(profile.own_place_address || '');
        setServiceRadius(profile.service_radius_km || 10);
        setServiceCities(profile.service_cities || []);
        setSelectedLanguages(profile.languages || []);
        if (profile.availability_days) {
          const d = {};
          (profile.availability_days || []).forEach(day => { d[day] = true; });
          setAvailDays(d);
        }
        if (profile.availability_slots) setAvailSlots(profile.availability_slots);
        if (profile.teaching_modes) {
          const m = {};
          (profile.teaching_modes || []).forEach(mode => { m[mode] = true; });
          setTeachingModes(m);
        }
        if (profile.onboarding_step) setStep(Math.max(1, profile.onboarding_step));
      }
    };
    init();
  }, [router]);

  const uploadFile = async (file, folder) => {
    if (!file || !user) return null;
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${user.email}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('teacher-files').upload(path, file, { upsert: true });
    if (error) { console.error('Upload error:', error); return null; }
    return path;
  };

  const saveStep = async (nextStep) => {
    if (!user) return;
    setSaving(true);
    setSaveMsg('');
    const supabase = createClient();

    try {
      let updates = { onboarding_step: nextStep || step };

      if (step === 1) {
        let avatar_url = null, cover_url = null;
        if (avatarFile) avatar_url = await uploadFile(avatarFile, 'profile');
        if (coverFile) cover_url = await uploadFile(coverFile, 'profile');
        updates = { ...updates, bio, ...(avatar_url && { avatar_url }), ...(cover_url && { cover_url }) };
      }

      if (step === 2) {
        const kyc_docs = {};
        if (cnicFront) kyc_docs.cnic_front = await uploadFile(cnicFront, 'kyc');
        if (cnicBack) kyc_docs.cnic_back = await uploadFile(cnicBack, 'kyc');
        if (degree) kyc_docs.degree = await uploadFile(degree, 'kyc');
        const certPaths = [];
        for (const cert of certificates) {
          const p = await uploadFile(cert, 'kyc');
          if (p) certPaths.push(p);
        }
        if (certPaths.length > 0) kyc_docs.certificates = certPaths;
        if (Object.keys(kyc_docs).length > 0) updates.kyc_docs = kyc_docs;
      }

      if (step === 3) {
        // Save selected categories to tutor_categories table
        const selectedKeys = Object.entries(selectedCategories).filter(([, v]) => v).map(([k]) => k);
        if (selectedKeys.length > 0) {
          await supabase.from('tutor_categories').delete().eq('tutor_id', user.id);
          const rows = selectedKeys.map(key => {
            const group = TEACHING_CATEGORIES.find(g => g.categories.some(c => c.key === key));
            const cat = group?.categories.find(c => c.key === key);
            return { tutor_id: user.id, level: group?.level || key, category: cat?.label || key };
          });
          await supabase.from('tutor_categories').insert(rows);
        }
      }

      if (step === 4) {
        updates.languages = selectedLanguages;
      }

      if (step === 5) {
        // Save experience timeline
        const validExp = experiences.filter(e => e.institution && e.role && e.year_from);
        if (validExp.length > 0) {
          await supabase.from('tutor_experience').delete().eq('tutor_id', user.id);
          const rows = validExp.map((e, i) => ({
            tutor_id: user.id,
            institution: e.institution,
            role: e.role,
            year_from: parseInt(e.year_from),
            year_to: e.current ? null : (e.year_to ? parseInt(e.year_to) : null),
            description: e.description,
            sort_order: i,
          }));
          await supabase.from('tutor_experience').insert(rows);
        }
      }

      if (step === 6) {
        const modesArr = Object.entries(teachingModes).filter(([, v]) => v).map(([k]) => k);
        const ownPlaceImgPaths = [];
        for (const img of ownPlaceImages) {
          const p = await uploadFile(img, 'profile');
          if (p) ownPlaceImgPaths.push(p);
        }
        updates = {
          ...updates,
          teaching_modes: modesArr,
          own_place_address: ownPlaceAddress,
          ...(ownPlaceImgPaths.length > 0 && { own_place_images: ownPlaceImgPaths }),
          service_radius_km: serviceRadius,
          service_cities: serviceCities,
        };
      }

      if (step === 7) {
        const daysArr = Object.entries(availDays).filter(([, v]) => v).map(([k]) => k);
        updates = { ...updates, hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null, availability_days: daysArr, availability_slots: availSlots };
      }

      if (step === 8) {
        let intro_video_url = null;
        if (introVideo) intro_video_url = await uploadFile(introVideo, 'profile');
        updates = { ...updates, about, ...(intro_video_url && { intro_video_url }) };
        // Mark onboarding complete on last step
        if (nextStep > TOTAL_STEPS) updates.onboarding_complete = true;
      }

      const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateErr) throw updateErr;

      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg('Error saving. Try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    const ns = step + 1;
    await saveStep(ns);
    if (ns > TOTAL_STEPS) {
      router.push(`/tutors/${user?.id}`);
    } else {
      setStep(ns);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skip = () => {
    const ns = step + 1;
    if (ns > TOTAL_STEPS) router.push('/tutor/dashboard');
    else { setStep(ns); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const toggleCategory = (key) => {
    setSelectedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const addExperience = () => {
    setExperiences(prev => [...prev, { institution: '', role: '', year_from: '', year_to: '', description: '', current: false }]);
  };

  const updateExp = (idx, field, val) => {
    setExperiences(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };

  const removeExp = (idx) => {
    setExperiences(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleMode = (mode) => {
    setTeachingModes(prev => ({ ...prev, [mode]: !prev[mode] }));
  };

  const toggleServiceCity = (city) => {
    setServiceCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  };

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  // ============================================================
  // RENDER STEPS
  // ============================================================
  const renderStep = () => {
    switch (step) {
      // ------- STEP 1: Profile Photo & Cover -------
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={1} title="Profile Photo & Cover" desc="A great photo makes a strong first impression on parents and students." />
            <div className="grid-2col" style={{ gap: '20px' }}>
              <UploadBox label="Profile Photo *" hint="JPG or PNG, min 200×200px" accept="image/*" icon={Camera} value={avatarFile} onChange={setAvatarFile} />
              <UploadBox label="Cover Banner" hint="Wide image, 1200×400px ideal" accept="image/*" value={coverFile} onChange={setCoverFile} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Short Bio <span style={{ color: 'var(--stone)', fontWeight: 400 }}>(displayed under your name)</span></label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="e.g. PhD Physics · 12+ years teaching A-Levels · 200+ students mentored"
                maxLength={160}
                rows={3}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>{bio.length}/160</div>
            </div>
          </div>
        );

      // ------- STEP 2: KYC Docs -------
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={2} title="Identity & Documents" desc="Uploaded documents are securely stored and only reviewed by our admin team. They are never publicly visible." />
            <div style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFD566', borderRadius: 'var(--rounded-md)', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#B8860B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#7A5C00' }}>All documents are stored in an encrypted, private folder and are never shared or deleted even upon account closure.</p>
            </div>
            <div className="grid-2col" style={{ gap: '16px' }}>
              <UploadBox label="CNIC / Passport – Front" hint="JPG, PNG or PDF, max 5MB" accept="image/*,.pdf" icon={FileText} value={cnicFront} onChange={setCnicFront} />
              <UploadBox label="CNIC / Passport – Back" hint="JPG, PNG or PDF, max 5MB" accept="image/*,.pdf" icon={FileText} value={cnicBack} onChange={setCnicBack} />
            </div>
            <UploadBox label="Latest Degree / Transcript" hint="Required for Academic Verified badge" accept="image/*,.pdf" icon={BookOpen} value={degree} onChange={setDegree} />
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Additional Certificates <span style={{ color: 'var(--stone)', fontWeight: 400 }}>(optional)</span></label>
              {certificates.map((cert, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', borderRadius: 'var(--rounded-md)', padding: '8px 12px', fontSize: '13px', color: 'var(--brand-green-dark)', fontWeight: 500 }}>
                    ✓ {cert.name}
                  </div>
                  <button onClick={() => setCertificates(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-orange)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', border: '1px dashed var(--hairline-strong)', borderRadius: 'var(--rounded-md)', color: 'var(--steel)', fontSize: '14px' }}>
                <Plus size={16} /> Add Certificate
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => e.target.files[0] && setCertificates(prev => [...prev, e.target.files[0]])} />
              </label>
            </div>
          </div>
        );

      // ------- STEP 3: Teaching Categories -------
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <StepHeader step={3} title="Teaching Categories" desc="Select all the levels and programs you can teach. This is used to match you with the right parents and students." />
            <div style={{ backgroundColor: 'var(--surface-soft)', borderRadius: 'var(--rounded-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--steel)' }}>
              Click a category to expand it and check which programs you teach.
            </div>
            {TEACHING_CATEGORIES.map(group => (
              <CategorySection key={group.level} group={group} selected={selectedCategories} onToggle={toggleCategory} />
            ))}
            <div style={{ fontSize: '13px', color: 'var(--stone)', textAlign: 'center', marginTop: '4px' }}>
              {Object.values(selectedCategories).filter(Boolean).length} categories selected
            </div>
          </div>
        );

      // ------- STEP 4: Languages -------
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={4} title="Languages" desc="Select all the languages you are comfortable teaching in." />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {LANGUAGES.map(lang => {
                const active = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--rounded-full)',
                      border: active ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)',
                      backgroundColor: active ? 'var(--brand-green-dark)' : 'var(--canvas)',
                      color: active ? '#fff' : 'var(--slate)',
                      fontWeight: active ? 600 : 400,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            {selectedLanguages.length > 0 && (
              <div style={{ color: 'var(--brand-green-dark)', fontWeight: 500, fontSize: '13px' }}>
                ✓ Teaching in: {selectedLanguages.join(', ')}
              </div>
            )}
          </div>
        );

      // ------- STEP 5: Experience Timeline -------
      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <StepHeader step={5} title="Teaching Experience" desc="Add your teaching and professional history. This is displayed as a timeline on your public profile." />
            {experiences.map((exp, idx) => (
              <div key={idx} style={{ position: 'relative', borderLeft: '3px solid var(--brand-green-dark)', paddingLeft: '20px', paddingBottom: '8px' }}>
                <div style={{ position: 'absolute', left: '-8px', top: '0', width: '13px', height: '13px', borderRadius: '50%', backgroundColor: 'var(--brand-green-dark)' }} />
                <div className="grid-2col" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--stone)' }}>INSTITUTION / SCHOOL *</label>
                    <Input placeholder="e.g. City Grammar School" value={exp.institution} onChange={e => updateExp(idx, 'institution', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--stone)' }}>ROLE *</label>
                    <Input placeholder="e.g. Senior Physics Teacher" value={exp.role} onChange={e => updateExp(idx, 'role', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--stone)' }}>FROM YEAR *</label>
                    <Input type="number" placeholder="2018" min="1970" max="2026" value={exp.year_from} onChange={e => updateExp(idx, 'year_from', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--stone)' }}>TO YEAR</label>
                    <Input type="number" placeholder={exp.current ? 'Present' : '2024'} min="1970" max="2026" value={exp.year_to} onChange={e => updateExp(idx, 'year_to', e.target.value)} disabled={exp.current} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--steel)' }}>
                      <input type="checkbox" checked={exp.current} onChange={e => updateExp(idx, 'current', e.target.checked)} /> Currently working here
                    </label>
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--stone)' }}>DESCRIPTION (optional)</label>
                  <textarea value={exp.description} onChange={e => updateExp(idx, 'description', e.target.value)} placeholder="Brief description of your role and achievements..." rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                {experiences.length > 1 && (
                  <button onClick={() => removeExp(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            ))}
            <button onClick={addExperience} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '2px dashed var(--hairline-strong)', borderRadius: 'var(--rounded-md)', background: 'none', color: 'var(--steel)', fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start' }}>
              <Plus size={16} /> Add Another Position
            </button>
          </div>
        );

      // ------- STEP 6: Teaching Availability -------
      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={6} title="Teaching Availability" desc="How do you want to teach? Select all that apply." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'own_place', label: 'At My Own Place', desc: 'Students come to your home or classroom', icon: '🏠' },
                { key: 'home_visit', label: 'Home Visits', desc: "You travel to the student's location", icon: '🚗' },
                { key: 'online', label: 'Online / Remote', desc: 'Via Zoom, Google Meet, or WhatsApp Video', icon: '💻' },
              ].map(({ key, label, desc, icon }) => {
                const active = teachingModes[key];
                return (
                  <button key={key} onClick={() => toggleMode(key)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: 'var(--rounded-md)', border: active ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)', backgroundColor: active ? 'var(--brand-green-soft)' : 'var(--canvas)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <span style={{ fontSize: '28px' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--steel)', marginTop: '2px' }}>{desc}</div>
                    </div>
                    {active && <CheckCircle2 size={22} color="var(--brand-green-dark)" />}
                  </button>
                );
              })}
            </div>

            {teachingModes.own_place && (
              <div style={{ border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-md)', padding: '20px', backgroundColor: 'var(--surface-soft)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>🏠 Your Teaching Space</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Address / Area</label>
                  <Input placeholder="e.g. DHA Phase 5, Lahore (exact address is not shown publicly)" value={ownPlaceAddress} onChange={e => setOwnPlaceAddress(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Class / Space Photos (up to 4)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {ownPlaceImages.map((img, i) => (
                      <div key={i} style={{ padding: '6px 12px', backgroundColor: 'var(--brand-green-soft)', borderRadius: '999px', fontSize: '12px', color: 'var(--brand-green-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ✓ {img.name}
                        <button onClick={() => setOwnPlaceImages(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-orange)', padding: 0, fontSize: '14px' }}>×</button>
                      </div>
                    ))}
                    {ownPlaceImages.length < 4 && (
                      <label style={{ padding: '6px 16px', border: '1px dashed var(--hairline-strong)', borderRadius: '999px', cursor: 'pointer', fontSize: '12px', color: 'var(--steel)' }}>
                        + Add Photo
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && setOwnPlaceImages(prev => [...prev, e.target.files[0]])} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {teachingModes.home_visit && (
              <div style={{ border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-md)', padding: '20px', backgroundColor: 'var(--surface-soft)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600 }}>🚗 Home Visit Coverage</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Service Radius: <strong style={{ color: 'var(--brand-green-dark)' }}>{serviceRadius} km</strong></label>
                  <input type="range" min={1} max={50} value={serviceRadius} onChange={e => setServiceRadius(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-green-dark)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--stone)' }}>
                    <span>1 km</span><span>50 km</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Cities You Serve</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {PAKISTANI_CITIES.map(c => {
                      const active = serviceCities.includes(c);
                      return (
                        <button key={c} onClick={() => toggleServiceCity(c)} style={{ padding: '4px 14px', borderRadius: '999px', border: active ? '2px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)', backgroundColor: active ? 'var(--brand-green-dark)' : 'var(--canvas)', color: active ? '#fff' : 'var(--slate)', fontSize: '13px', cursor: 'pointer' }}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ------- STEP 7: Schedule & Rate -------
      case 7:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={7} title="Schedule & Hourly Rate" desc="Let parents know when you are available and what you charge." />
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Available Days</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DAYS.map(({ key, label }) => {
                  const active = availDays[key];
                  return (
                    <button key={key} onClick={() => setAvailDays(prev => ({ ...prev, [key]: !prev[key] }))} style={{ width: '56px', height: '56px', borderRadius: '50%', border: active ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)', backgroundColor: active ? 'var(--brand-green-dark)' : 'var(--canvas)', color: active ? '#fff' : 'var(--slate)', fontWeight: active ? 700 : 400, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Available Time Slots</label>
              <div className="grid-2col" style={{ gap: '10px' }}>
                {TIME_SLOTS.map(({ key, label, sub }) => {
                  const active = availSlots[key];
                  return (
                    <button key={key} onClick={() => setAvailSlots(prev => ({ ...prev, [key]: !prev[key] }))} style={{ padding: '16px', borderRadius: 'var(--rounded-md)', border: active ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)', backgroundColor: active ? 'var(--brand-green-soft)' : 'var(--canvas)', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--stone)' }}>{sub}</div>
                      {active && <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--brand-green-dark)' }}>✓ Available</div>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Hourly Rate (PKR)</label>
              <div style={{ position: 'relative', maxWidth: '260px' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input type="number" placeholder="e.g. 3500" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} style={{ paddingLeft: '40px' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '6px' }}>This will be shown as &quot;Rs {hourlyRate || '0'}/hr&quot; on your profile. You can always negotiate with clients.</p>
            </div>
          </div>
        );

      // ------- STEP 8: About -------
      case 8:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={8} title="About You" desc="Write a detailed description of your teaching philosophy, methods, and what makes you unique." />
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>About Me <span style={{ color: 'var(--stone)', fontWeight: 400 }}>(shown in full on your profile)</span></label>
              <textarea
                value={about}
                onChange={e => setAbout(e.target.value)}
                placeholder="Tell parents and students about yourself, your teaching approach, your achievements, and why they should choose you. Be genuine and specific — tutors with detailed profiles get 3x more contact requests."
                rows={10}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', fontSize: '15px', lineHeight: '1.7', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: about.length > 50 ? 'var(--brand-green-dark)' : 'var(--stone)', marginTop: '4px' }}>
                {about.length > 50 ? '✓ Great length!' : `${about.length} characters — aim for 200+`}
              </div>
            </div>
            <UploadBox label="Short Intro Video (optional)" hint="Max 60 seconds · MP4 or MOV · Max 50MB" accept="video/*" icon={Video} value={introVideo} onChange={setIntroVideo} />
            <div style={{ backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', borderRadius: 'var(--rounded-md)', padding: '16px', fontSize: '14px', color: 'var(--brand-green-dark)', fontWeight: 500 }}>
              🎉 You&apos;re almost done! After submitting, your profile will be reviewed by our admin team. You&apos;ll be notified when you are approved.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Top progress bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--stone)' }}>Step {step} of {TOTAL_STEPS}</span>
              <span style={{ fontSize: '11px', color: 'var(--stone)', marginLeft: '12px' }}>Tutor Profile Setup</span>
            </div>
            <button onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--steel)', fontSize: '13px', cursor: 'pointer', padding: '4px 8px' }}>
              Skip for now →
            </button>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--hairline)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--brand-green-dark), var(--brand-green))', borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const done = step > i + 1;
              const current = step === i + 1;
              return (
                <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: done ? 'var(--brand-green-dark)' : current ? 'var(--brand-green)' : 'var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                  {done && <Check size={11} color="#fff" />}
                  {!done && current && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-teal-deep)' }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px 120px' }}>
        <div style={{ backgroundColor: 'var(--canvas)', borderRadius: 'var(--rounded-xl)', border: '1px solid var(--hairline)', padding: '40px' }}>
          {renderStep()}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={back} disabled={step === 1} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-full)', background: 'none', color: step === 1 ? 'var(--muted)' : 'var(--slate)', cursor: step === 1 ? 'default' : 'pointer', fontSize: '14px', fontWeight: 500 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div style={{ fontSize: '13px', color: saveMsg === 'Saved!' ? 'var(--brand-green-dark)' : 'var(--accent-orange)', fontWeight: 500, minWidth: '80px', textAlign: 'center' }}>
            {saving ? 'Saving…' : saveMsg}
          </div>
          <Button onClick={next} variant="primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {step === TOTAL_STEPS ? '🎉 Complete Profile' : <>Save & Continue <ChevronRight size={16} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
