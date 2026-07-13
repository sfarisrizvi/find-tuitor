'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Camera, Upload, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2,
  MapPin, Clock, DollarSign, BookOpen, FileText, Video, AlertCircle, Check,
  X, Lock, Pencil, HelpCircle
} from 'lucide-react';

// ============================================================
// TEACHING CATEGORIES DATA
// ============================================================
const RANGE_LEVELS = ['Kindergarten', 'Primary', 'Secondary', 'Matric', 'Inter', 'BS/MS'];
const LEVEL_SUBJECTS = {
  'Matric': ['Arts', 'Biology', 'Computer'],
  'Inter': ['Arts', 'Pre-Engineering', 'Pre-Medical', 'Commerce', 'ICs', 'O Levels'],
  'BS/MS': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing', 'Other']
};

const STEP_LABELS = [
  'Profile info',
  'Verification',
  'Subjects',
  'Languages',
  'Experience',
  'Modes',
  'Schedule',
  'About'
];

// ============================================================
// CONTENT VALIDATION RULES FOR BIO / ABOUT
// ============================================================
const FORBIDDEN_RULES = [
  {
    id: 'email',
    label: 'Email Address',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    message: 'Email addresses are not allowed in the profile description.'
  },
  {
    id: 'url',
    label: 'Website Link',
    regex: /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|org|net|edu|pk|gov|mil|biz|info|me|io|co|us|uk|ca)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
    message: 'External website links or URLs are not allowed in the profile description.'
  },
  {
    id: 'phone',
    regex: /(\+?92[-\s]?|0)3\d{2}[-\s]?\d{7}\b|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b\d{10,13}\b/g,
    message: 'Phone numbers or contact digits are not allowed in the profile description.'
  }
];

const escapeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const COMBINED_FORBIDDEN_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|org|net|edu|pk|gov|mil|biz|info|me|io|co|us|uk|ca)\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))|((\+?92[-\s]?|0)3\d{2}[-\s]?\d{7}\b|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b\d{10,13}\b)/gi;

const LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Saraiki', 'Arabic', 'French'];
const PAKISTANI_CITIES = ['Islamabad', 'Rawalpindi', 'Attock', 'Lahore', 'Karachi'];
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
      {desc && <p style={{ margin: '0 0 0 42px', color: 'var(--slate)', fontSize: '14px', lineHeight: '1.5' }}>{desc}</p>}
    </div>
  );
}

function UploadBox({ label, hint, accept, onChange, value, icon: Icon = Upload }) {
  const ref = useRef();

  const getPreview = () => {
    if (!value) return null;
    if (typeof value === 'string') {
      const isPdf = value.toLowerCase().endsWith('.pdf');
      const url = value.startsWith('http')
        ? value
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/teacher-files/${value}`;
      return { isPdf, url, name: value.split('/').pop() };
    } else {
      const isPdf = value.type === 'application/pdf' || value.name.toLowerCase().endsWith('.pdf');
      const url = URL.createObjectURL(value);
      return { isPdf, url, name: value.name };
    }
  };

  const preview = getPreview();

  return (
    <div>
      {label && <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>{label}</label>}
      <div
        onClick={() => ref.current.click()}
        style={{
          border: value ? '2px solid var(--brand-green-dark)' : '2px dashed var(--hairline-strong)',
          borderRadius: 'var(--rounded-md)',
          padding: value ? '16px' : '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: value ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '140px'
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {preview.isPdf ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--brand-green-dark)' }}>
                <FileText size={40} strokeWidth={1.5} />
                <span style={{ fontWeight: 600, fontSize: '13px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--stone)' }}>PDF Document · Click to replace</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <img
                  src={preview.url}
                  alt="Preview"
                  style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain', border: '1px solid var(--hairline-strong)' }}
                />
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--brand-green-dark)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--stone)' }}>Click to replace</span>
              </div>
            )}
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
// PROFILE CHECKLIST SIDEBAR
// ============================================================
const ProfileChecklist = ({ totalPercent, checklistItems }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalPercent / 100) * circumference;

  return (
    <div style={{
      backgroundColor: 'var(--canvas)',
      borderRadius: '16px',
      border: '1px solid var(--hairline-strong)',
      padding: '24px',
      boxShadow: 'var(--shadow-subtle)'
    }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 20px 0', textAlign: 'center' }}>
        Complete your profile
      </h3>

      {/* Circular Progress Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '90px', height: '90px' }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="var(--surface)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="var(--brand-green-dark)"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--ink)'
          }}>
            {totalPercent}%
          </div>
        </div>
      </div>

      {/* Checklist List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {checklistItems.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: item.active ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.active ? (
                  <Check size={12} color="var(--brand-green-dark)" strokeWidth={3} />
                ) : (
                  <X size={12} color="var(--stone)" strokeWidth={3} />
                )}
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: item.active ? 'var(--slate)' : 'var(--stone)',
                textDecoration: item.active ? 'line-through' : 'none'
              }}>
                {item.label}
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: item.active ? 'var(--stone)' : 'var(--brand-green-dark)'
            }}>
              {item.active ? item.weight : `+${item.weight}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const backdropRef = useRef(null);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Step 1: Photo & Cover
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [avatarDeleted, setAvatarDeleted] = useState(false);
  const [coverDeleted, setCoverDeleted] = useState(false);
  const [bio, setBio] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Step 2: KYC docs
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [degree, setDegree] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [hasKycDocs, setHasKycDocs] = useState(false);

  // Step 3: Teaching Categories (Accordion checkboxes & checked subjects)
  const [activeLevels, setActiveLevels] = useState({
    'Kindergarten': false,
    'Primary': false,
    'Secondary': false,
    'Matric': false,
    'Inter': false,
    'BS/MS': false
  });
  const [expandedAccordions, setExpandedAccordions] = useState({
    'Kindergarten': false,
    'Primary': false,
    'Secondary': false,
    'Matric': false,
    'Inter': false,
    'BS/MS': false
  });
  const [selectedSubjectsByLevel, setSelectedSubjectsByLevel] = useState({});

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
  const [availSlots, setAvailSlots] = useState({
    mon: { active: true, start: '07:00', end: '19:00' },
    tue: { active: true, start: '07:00', end: '19:00' },
    wed: { active: true, start: '07:00', end: '19:00' },
    thu: { active: true, start: '07:00', end: '19:00' },
    fri: { active: true, start: '07:00', end: '19:00' },
    sat: { active: false, start: '07:00', end: '19:00' },
    sun: { active: false, start: '07:00', end: '19:00' }
  });
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
      const { data: profile } = await supabase.from('tutor_profiles').select('*').eq('id', u.id).single();
      if (profile) {
        // If onboarding already completed and no specific step requested, redirect to profile
        if (profile.onboarding_complete && !stepParam) {
          router.push('/tutor/dashboard');
          return;
        }
        setBio(profile.bio || '');
        setAbout(profile.about || '');
        setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
        setOwnPlaceAddress(profile.own_place_address || '');
        setServiceRadius(profile.service_radius_km || 10);
        setServiceCities(profile.service_cities || []);
        setSelectedLanguages(profile.languages || []);
        setAvatarUrl(profile.avatar_url || '');
        setCoverUrl(profile.cover_url || '');
        setProfileName(profile.full_name || u.user_metadata?.full_name || '');
        setProfileEmail(profile.email || u.email || '');

        if (profile.kyc_docs && Object.keys(profile.kyc_docs).length > 0) {
          setHasKycDocs(true);
          if (profile.kyc_docs.cnic_front) setCnicFront(profile.kyc_docs.cnic_front);
          if (profile.kyc_docs.cnic_back) setCnicBack(profile.kyc_docs.cnic_back);
          if (profile.kyc_docs.degree) setDegree(profile.kyc_docs.degree);
          if (profile.kyc_docs.certificates) setCertificates(profile.kyc_docs.certificates);
        }

        if (profile.availability_slots && Object.keys(profile.availability_slots).length > 0) {
          const loaded = profile.availability_slots;
          const merged = {
            mon: { active: true, start: '07:00', end: '19:00' },
            tue: { active: true, start: '07:00', end: '19:00' },
            wed: { active: true, start: '07:00', end: '19:00' },
            thu: { active: true, start: '07:00', end: '19:00' },
            fri: { active: true, start: '07:00', end: '19:00' },
            sat: { active: false, start: '07:00', end: '19:00' },
            sun: { active: false, start: '07:00', end: '19:00' }
          };
          Object.keys(merged).forEach(day => {
            if (loaded[day] && typeof loaded[day] === 'object') {
              merged[day] = { ...merged[day], ...loaded[day] };
            } else if (loaded[day] === true || loaded[day] === false) {
              merged[day].active = loaded[day];
            } else if (profile.availability_days && !profile.availability_days.includes(day)) {
              merged[day].active = false;
            }
          });
          setAvailSlots(merged);
        } else if (profile.availability_days) {
          const merged = {
            mon: { active: false, start: '07:00', end: '19:00' },
            tue: { active: false, start: '07:00', end: '19:00' },
            wed: { active: false, start: '07:00', end: '19:00' },
            thu: { active: false, start: '07:00', end: '19:00' },
            fri: { active: false, start: '07:00', end: '19:00' },
            sat: { active: false, start: '07:00', end: '19:00' },
            sun: { active: false, start: '07:00', end: '19:00' }
          };
          (profile.availability_days || []).forEach(day => {
            if (merged[day]) merged[day].active = true;
          });
          setAvailSlots(merged);
        }
        if (profile.teaching_modes) {
          const m = {};
          (profile.teaching_modes || []).forEach(mode => { m[mode] = true; });
          setTeachingModes(m);
        }
        if (stepParam) {
          const parsedStep = parseInt(stepParam);
          if (parsedStep >= 1 && parsedStep <= 9) {
            setStep(parsedStep);
          } else if (profile.onboarding_step) {
            setStep(Math.max(1, profile.onboarding_step));
          }
        } else if (profile.onboarding_step) {
          setStep(Math.max(1, profile.onboarding_step));
        }
      }

      // Load existing tutor categories
      const { data: dbCats } = await supabase.from('tutor_categories').select('*').eq('tutor_id', u.id);
      if (dbCats && dbCats.length > 0) {
        const activeMap = {
          'Kindergarten': false,
          'Primary': false,
          'Secondary': false,
          'Matric': false,
          'Inter': false,
          'BS/MS': false
        };
        const subMap = {};
        dbCats.forEach(row => {
          activeMap[row.level] = true;
          if (row.subject) {
            if (!subMap[row.level]) subMap[row.level] = [];
            subMap[row.level].push(row.subject);
          }
        });
        setActiveLevels(activeMap);
        setSelectedSubjectsByLevel(subMap);
      }
    };
    init();
  }, [router, stepParam]);

  const uploadFile = async (file, folder) => {
    if (!file || !user) return null;
    if (typeof file === 'string') return file; // Already uploaded path
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
    
    // Choose bucket: KYC docs go to private 'teacher-files', public profile media goes to public 'teacher-media'
    const bucket = folder === 'kyc' ? 'teacher-files' : 'teacher-media';

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
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
        let avatar_path = avatarUrl;
        let cover_path = coverUrl;

        // Handle Avatar Upload & Deletion
        if (avatarDeleted) {
          if (avatarUrl) {
            await supabase.storage.from('teacher-media').remove([avatarUrl]);
          }
          avatar_path = null;
          setAvatarUrl('');
          setAvatarDeleted(false);
        } else if (avatarFile) {
          if (avatarUrl) {
            await supabase.storage.from('teacher-media').remove([avatarUrl]);
          }
          const path = await uploadFile(avatarFile, 'profile');
          if (path) {
            avatar_path = path;
            setAvatarUrl(path);
            setAvatarFile(null);
          }
        }

        // Handle Cover Upload & Deletion
        if (coverDeleted) {
          if (coverUrl) {
            await supabase.storage.from('teacher-media').remove([coverUrl]);
          }
          cover_path = null;
          setCoverUrl('');
          setCoverDeleted(false);
        } else if (coverFile) {
          if (coverUrl) {
            await supabase.storage.from('teacher-media').remove([coverUrl]);
          }
          const path = await uploadFile(coverFile, 'profile');
          if (path) {
            cover_path = path;
            setCoverUrl(path);
            setCoverFile(null);
          }
        }

        updates = { ...updates, bio, full_name: profileName, avatar_url: avatar_path, cover_url: cover_path };
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
        setHasKycDocs(true);
      }

      if (step === 3) {
        // Clear all previous categories for the tutor
        await supabase.from('tutor_categories').delete().eq('tutor_id', user.id);

        const rows = [];
        RANGE_LEVELS.forEach(levelName => {
          if (activeLevels[levelName]) {
            const hasSubjects = ['Matric', 'Inter', 'BS/MS'].includes(levelName);
            if (hasSubjects) {
              const subs = selectedSubjectsByLevel[levelName] || [];
              if (subs.length > 0) {
                subs.forEach(subj => {
                  rows.push({
                    tutor_id: user.id,
                    level: levelName,
                    category: 'Academic',
                    subject: subj
                  });
                });
              } else {
                // Level selected but no subjects checked
                rows.push({
                  tutor_id: user.id,
                  level: levelName,
                  category: 'Academic',
                  subject: null
                });
              }
            } else {
              // For levels without subjects (KG, Primary, Secondary)
              rows.push({
                tutor_id: user.id,
                level: levelName,
                category: 'Academic',
                subject: null
              });
            }
          }
        });

        if (rows.length > 0) {
          const { error: insertErr } = await supabase.from('tutor_categories').insert(rows);
          if (insertErr) throw insertErr;
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
        const daysArr = Object.entries(availSlots)
          .filter(([, config]) => config && config.active)
          .map(([day]) => day);
        updates = { ...updates, hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null, availability_days: daysArr, availability_slots: availSlots };
      }

      if (step === 8) {
        let intro_video_url = null;
        if (introVideo) intro_video_url = await uploadFile(introVideo, 'profile');
        updates = { ...updates, about, ...(intro_video_url && { intro_video_url }) };
        // Mark onboarding complete on last step
        if (nextStep > TOTAL_STEPS) updates.onboarding_complete = true;
      }

      const { error: updateErr } = await supabase.from('tutor_profiles').update(updates).eq('id', user.id);
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
      router.push('/tutor/dashboard');
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

  const toggleLevelActive = (levelName) => {
    setActiveLevels(prev => {
      const nextActive = !prev[levelName];
      // If unchecking, clear selected subjects for that level too
      if (!nextActive) {
        setSelectedSubjectsByLevel(subs => ({ ...subs, [levelName]: [] }));
      }
      return { ...prev, [levelName]: nextActive };
    });
  };

  const toggleLevelSubject = (levelName, subj) => {
    setSelectedSubjectsByLevel(prev => {
      const currentList = prev[levelName] || [];
      const newList = currentList.includes(subj)
        ? currentList.filter(s => s !== subj)
        : [...currentList, subj];

      // Auto-check parent level if any subject is checked
      if (newList.length > 0) {
        setActiveLevels(l => ({ ...l, [levelName]: true }));
      }
      return { ...prev, [levelName]: newList };
    });
  };

  const toggleAccordion = (levelName) => {
    setExpandedAccordions(prev => ({ ...prev, [levelName]: !prev[levelName] }));
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
  // PREVIEW DYNAMIC HELPERS
  // ============================================================
  const getAvatarPreview = () => {
    if (avatarDeleted) return null;
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (avatarUrl) {
      return avatarUrl.startsWith('http')
        ? avatarUrl
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/teacher-media/${avatarUrl}`;
    }
    return null;
  };

  const getCoverPreview = () => {
    if (coverDeleted) return null;
    if (coverFile) return URL.createObjectURL(coverFile);
    if (coverUrl) {
      return coverUrl.startsWith('http')
        ? coverUrl
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/teacher-media/${coverUrl}`;
    }
    return null;
  };

  // ============================================================
  // PROGRESS WIDGET CALCULATOR
  // ============================================================
  const checkSetupAccount = true;
  const checkProfilePhoto = !!avatarFile || (!!avatarUrl && !avatarDeleted);
  const checkBio = bio.trim().length > 10;
  const checkKyc = !!cnicFront || !!cnicBack || !!degree || hasKycDocs;
  const checkCategories = Object.values(activeLevels).some(v => v);
  const checkExperience = experiences.some(e => e.institution && e.role && e.year_from);
  const checkRates = !!hourlyRate && Object.values(availSlots).some(v => v && v.active);

  let totalPercent = 10; // Account setup
  if (checkProfilePhoto) totalPercent += 10;
  if (checkBio) totalPercent += 10;
  if (checkKyc) totalPercent += 15;
  if (checkCategories) totalPercent += 15;
  if (checkExperience) totalPercent += 15;
  if (checkRates) totalPercent += 25;

  const checklistItems = [
    { label: 'Setup account', weight: '10%', active: checkSetupAccount },
    { label: 'Upload profile photo', weight: '10%', active: checkProfilePhoto },
    { label: 'Personal Info & Bio', weight: '10%', active: checkBio },
    { label: 'ID & Degree Upload', weight: '15%', active: checkKyc },
    { label: 'Teaching Categories', weight: '15%', active: checkCategories },
    { label: 'Work Experience', weight: '15%', active: checkExperience },
    { label: 'Rates & Availability', weight: '25%', active: checkRates },
  ];



  const getForbiddenMatches = (text) => {
    if (!text) return [];
    const matches = [];
    FORBIDDEN_RULES.forEach(rule => {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(text)) !== null) {
        matches.push({
          ruleId: rule.id,
          ruleLabel: rule.label,
          ruleMessage: rule.message,
          value: match[0],
          index: match.index
        });
      }
    });
    return matches;
  };

  const forbiddenMatches = getForbiddenMatches(about);
  const hasForbiddenContent = forbiddenMatches.length > 0;

  const getHighlightedHtml = (text) => {
    if (!text) return '';
    let escaped = escapeHtml(text);
    escaped = escaped + '\n';
    return escaped.replace(COMBINED_FORBIDDEN_REGEX, (match) => {
      return `<mark style="background-color: rgba(239, 68, 68, 0.15); color: transparent; border-bottom: 2px solid rgba(239, 68, 68, 0.55); margin: 0; padding: 0; border-radius: 2px; font-family: inherit; font-size: inherit; line-height: inherit; display: inline;">${match}</mark>`;
    });
  };

  const handleScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop;
      backdropRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

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

            {/* Cover Banner Card */}
            <div style={{
              height: '180px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-soft)',
              border: '1px solid var(--hairline-strong)',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: getCoverPreview() ? `url(${getCoverPreview()})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}>
              {!getCoverPreview() && (
                <div style={{ textAlign: 'center', color: 'var(--stone)' }}>
                  <Upload size={24} style={{ marginBottom: '6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>No cover banner uploaded</div>
                  <div style={{ fontSize: '11px', color: 'var(--stone)', marginTop: '2px' }}>At least 1200×400 px recommended</div>
                </div>
              )}

              {/* Cover Upload / Delete overlay */}
              <div style={{
                position: 'absolute',
                right: '16px',
                bottom: '16px',
                display: 'flex',
                gap: '8px'
              }}>
                <label style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-subtle)'
                }}>
                  {getCoverPreview() ? 'Change Cover' : 'Upload Cover'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files[0]) {
                      setCoverFile(e.target.files[0]);
                      setCoverDeleted(false);
                    }
                  }} />
                </label>
                {getCoverPreview() && (
                  <button
                    onClick={() => {
                      setCoverFile(null);
                      setCoverDeleted(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid var(--hairline-strong)',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--accent-orange)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-subtle)'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Profile Avatar Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '4px', padding: '0 8px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-soft)',
                border: '3px solid #fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundImage: getAvatarPreview() ? `url(${getAvatarPreview()})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
                {!getAvatarPreview() && <Camera size={36} color="var(--stone)" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                  <label style={{
                    padding: '8px 18px',
                    backgroundColor: 'var(--brand-green-dark)',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}>
                    Upload new photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      if (e.target.files[0]) {
                        setAvatarFile(e.target.files[0]);
                        setAvatarDeleted(false);
                      }
                    }} />
                  </label>
                  {getAvatarPreview() && (
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarDeleted(true);
                      }}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: 'transparent',
                        color: 'var(--accent-orange)',
                        border: '1px solid var(--hairline-strong)',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--stone)', lineHeight: '1.4' }}>
                  At least 800×800 px recommended. JPG or PNG is allowed.
                </div>
              </div>
            </div>

            {/* Personal Info Box */}
            <div style={{
              backgroundColor: 'var(--surface-soft)',
              borderRadius: '12px',
              border: '1px solid var(--hairline-strong)',
              padding: '20px',
              marginTop: '4px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Full Name</div>
                {isEditingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={e => { if (e.key === 'Enter') setIsEditingName(false); }}
                      autoFocus
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--hairline-strong)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        width: '100%',
                        maxWidth: '160px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      onClick={() => setIsEditingName(false)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--brand-green-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{profileName || '—'}</div>
                    <Pencil
                      size={13}
                      style={{ cursor: 'pointer', color: 'var(--stone)', transition: 'color 0.15s ease' }}
                      onMouseEnter={e => e.target.style.color = 'var(--ink)'}
                      onMouseLeave={e => e.target.style.color = 'var(--stone)'}
                      onClick={() => setIsEditingName(true)}
                    />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Email Address</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--stone)' }}>{profileEmail || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Account Type</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-orange)' }}>⚠️ Unverified</div>
                  <Pencil
                    size={13}
                    style={{ cursor: 'pointer', color: 'var(--stone)', transition: 'color 0.15s ease' }}
                    onMouseEnter={e => e.target.style.color = 'var(--ink)'}
                    onMouseLeave={e => e.target.style.color = 'var(--stone)'}
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <StepHeader step={3} title="Teaching Categories" desc="Check the categories you want to teach. Expand each category to check specific subjects." />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {RANGE_LEVELS.map(levelName => {
                const isActive = activeLevels[levelName];
                const isExpanded = expandedAccordions[levelName];
                const hasSubjects = ['Matric', 'Inter', 'BS/MS'].includes(levelName);
                const subjects = LEVEL_SUBJECTS[levelName] || [];
                const selectedSubs = selectedSubjectsByLevel[levelName] || [];

                // Format the preview of checked subjects: e.g. " (Maths, Physics)"
                let previewText = '';
                if (isActive) {
                  if (hasSubjects) {
                    previewText = selectedSubs.length > 0
                      ? `(${selectedSubs.join(', ')})`
                      : '(No subjects selected)';
                  } else {
                    previewText = '(Selected)';
                  }
                }

                return (
                  <div key={levelName} style={{
                    border: '1px solid var(--hairline-strong)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--canvas)',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid var(--hairline)' : 'none',
                      backgroundColor: isActive ? 'var(--brand-green-soft)' : '#fff',
                      transition: 'background-color 0.2s ease'
                    }} onClick={() => toggleAccordion(levelName)}>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
                        {/* Parent checkbox */}
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleLevelActive(levelName)}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: 'var(--brand-green-dark)',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }} onClick={() => toggleAccordion(levelName)}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                            {levelName} Grade
                          </span>
                          {previewText && (
                            <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 500 }}>
                              {previewText}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Caret */}
                      <span style={{
                        fontSize: '18px',
                        color: 'var(--steel)',
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        pointerEvents: 'none'
                      }}>
                        ›
                      </span>
                    </div>

                    {/* Content */}
                    {isExpanded && (
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#fff',
                        borderTop: '1px solid var(--hairline)'
                      }}>
                        {hasSubjects ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '12px'
                          }}>
                            {subjects.map(subj => {
                              const isChecked = selectedSubs.includes(subj);
                              return (
                                <label key={subj} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: 'var(--ink)',
                                  padding: '6px 0'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleLevelSubject(levelName, subj)}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      accentColor: 'var(--brand-green-dark)',
                                      cursor: 'pointer'
                                    }}
                                  />
                                  {subj}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'var(--stone)', fontStyle: 'italic' }}>
                            General grade curriculum (no specific subject selection required).
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
        const DAYS_FULL = [
          { key: 'mon', label: 'Monday' },
          { key: 'tue', label: 'Tuesday' },
          { key: 'wed', label: 'Wednesday' },
          { key: 'thu', label: 'Thursday' },
          { key: 'fri', label: 'Friday' },
          { key: 'sat', label: 'Saturday' },
          { key: 'sun', label: 'Sunday' }
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader step={7} title="Schedule & Hourly Rate" desc="Let parents know when you are available and what you charge." />
            
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '16px', fontSize: '15px', color: 'var(--ink)' }}>Teaching Availability</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-lg)', padding: '20px' }}>
                {DAYS_FULL.map(({ key, label }) => {
                  const dayConfig = availSlots[key] || { active: false, start: '07:00', end: '19:00' };
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingBottom: '12px', borderBottom: key !== 'sun' ? '1px solid var(--hairline-soft)' : 'none' }}>
                      
                      {/* Checkbox and Day Label */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={!!dayConfig.active}
                          onChange={(e) => {
                            const active = e.target.checked;
                            setAvailSlots(prev => ({
                              ...prev,
                              [key]: { ...prev[key], active }
                            }));
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--brand-green-dark)' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: dayConfig.active ? 'var(--ink)' : 'var(--stone)' }}>{label}</span>
                      </label>

                      {/* Time Selectors or Closed Label */}
                      {dayConfig.active ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="time"
                            value={dayConfig.start || '07:00'}
                            onChange={(e) => {
                              const start = e.target.value;
                              setAvailSlots(prev => ({
                                ...prev,
                                [key]: { ...prev[key], start }
                              }));
                            }}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', outline: 'none' }}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--stone)' }}>to</span>
                          <input
                            type="time"
                            value={dayConfig.end || '19:00'}
                            onChange={(e) => {
                              const end = e.target.value;
                              setAvailSlots(prev => ({
                                ...prev,
                                [key]: { ...prev[key], end }
                              }));
                            }}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', outline: 'none' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)', fontStyle: 'italic', paddingRight: '8px' }}>Closed</span>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Per Hour Rate a Month (PKR)</label>
              <div style={{ position: 'relative', maxWidth: '260px' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--stone)',
                  fontSize: '13px',
                  fontWeight: 600
                }}>Rs</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>About Me</label>
                <span style={{ color: 'var(--stone)', fontSize: '14px', fontWeight: 400 }}>(shown in full on your profile)</span>
                
                {/* Tooltip Help Icon */}
                <div className="tooltip-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                  <HelpCircle size={14} style={{ color: 'var(--stone)', transition: 'color 0.15s ease' }} onMouseEnter={e => e.target.style.color = 'var(--ink)'} onMouseLeave={e => e.target.style.color = 'var(--stone)'} />
                  <div className="tooltip-text" style={{
                    visibility: 'hidden',
                    width: '260px',
                    backgroundColor: 'var(--ink)',
                    color: '#fff',
                    textAlign: 'left',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    position: 'absolute',
                    zIndex: 100,
                    bottom: '130%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    opacity: 0,
                    transition: 'opacity 0.2s, visibility 0.2s',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    fontWeight: 500,
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    It is not allowed to share contact numbers, emails, or links in your profile description. Please read our <a href="/terms" target="_blank" style={{ color: 'var(--brand-green)', textDecoration: 'underline', fontWeight: 600 }}>Terms and Conditions</a>.
                  </div>
                </div>
              </div>
              <div style={{ position: 'relative', width: '100%', height: '220px', fontFamily: 'inherit' }}>
                {/* Backdrop highlight layer */}
                <div 
                  ref={backdropRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 0,
                    padding: '14px 16px',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '15px',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowY: 'hidden',
                    color: 'transparent',
                    border: '1px solid transparent',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                    scrollbarGutter: 'stable',
                    zIndex: 1,
                    backgroundColor: 'var(--surface-soft)'
                  }}
                  dangerouslySetInnerHTML={{ __html: getHighlightedHtml(about) }}
                />
                
                {/* Visual input textarea */}
                <textarea
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  onScroll={handleScroll}
                  placeholder="Tell parents and students about yourself, your teaching approach, your achievements, and why they should choose you. Be genuine and specific — tutors with detailed profiles get 3x more contact requests."
                  style={{
                    position: 'absolute',
                    inset: 0,
                    margin: 0,
                    padding: '14px 16px',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '15px',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowY: 'auto',
                    backgroundColor: 'transparent',
                    color: 'var(--ink)',
                    border: '1px solid var(--hairline-strong)',
                    borderRadius: 'var(--rounded-md)',
                    boxSizing: 'border-box',
                    resize: 'none',
                    outline: 'none',
                    scrollbarGutter: 'stable',
                    zIndex: 2,
                    caretColor: 'var(--ink)'
                  }}
                />
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: about.length > 50 ? 'var(--brand-green-dark)' : 'var(--stone)', marginTop: '4px' }}>
                {about.length > 50 ? '✓ Great length!' : `${about.length} characters — aim for 200+`}
              </div>

              {hasForbiddenContent && (
                <div style={{
                  backgroundColor: 'rgba(254, 242, 242, 0.95)',
                  border: '1px solid #F8B4B4',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9B1C1C', fontWeight: 600, fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>Contact details or website links are not allowed here:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {forbiddenMatches.map((match, idx) => (
                      <span 
                        key={idx} 
                        title={`${match.ruleMessage} Please remove "${match.value}" to continue.`}
                        style={{
                          backgroundColor: '#FDE8E8',
                          color: '#C81E1E',
                          border: '1px solid #F8B4B4',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'help',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {match.value}
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>ℹ️</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '20px 24px 24px 24px' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate)' }}>Tutor Profile Setup</span>
            <button onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--steel)', fontSize: '13px', cursor: 'pointer', padding: '4px 8px' }}>
              Skip for now →
            </button>
          </div>

          {/* Timeline Stepper */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 10px'
          }}>
            {/* Background connecting line */}
            <div style={{
              position: 'absolute',
              left: '30px',
              right: '30px',
              top: '18px',
              height: '3px',
              backgroundColor: 'var(--hairline-strong)',
              zIndex: 1
            }} />

            {/* Active connecting line fill */}
            <div style={{
              position: 'absolute',
              left: '30px',
              width: `calc(${((step - 1) / (TOTAL_STEPS - 1)) * 100}% - ${((step - 1) / (TOTAL_STEPS - 1)) * 100 > 0 ? '10px' : '0px'})`,
              top: '18px',
              height: '3px',
              backgroundColor: '#41B01B',
              zIndex: 2,
              transition: 'width 0.4s ease'
            }} />

            {/* Stepper Steps */}
            {STEP_LABELS.map((labelText, i) => {
              const done = step > i + 1;
              const current = step === i + 1;
              const isUpcoming = step < i + 1;

              return (
                <div key={i} className="step-container" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 3,
                  width: '90px'
                }}>
                  {/* Circle */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: done ? '#41B01B' : '#fff',
                    border: done ? 'none' : current ? '2px solid #41B01B' : '2px solid var(--hairline-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: current ? '0 0 0 4px rgba(65, 176, 27, 0.1)' : 'none'
                  }}>
                    {done ? (
                      <Check size={16} color="#fff" strokeWidth={3} />
                    ) : (
                      <span style={{
                        color: current ? '#41B01B' : 'var(--stone)',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {/* Label */}
                  <span className="step-label" style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isUpcoming ? 'var(--stone)' : current ? '#41B01B' : 'var(--ink)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {labelText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .onboarding-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
        }
        @media (max-width: 991px) {
          .onboarding-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .onboarding-sidebar {
            position: static !important;
          }
        }
        @media (max-width: 768px) {
          .step-label {
            display: none !important;
          }
          .step-container {
            width: auto !important;
          }
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible !important;
          opacity: 1 !important;
        }
        .tooltip-text::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: var(--ink) transparent transparent transparent;
        }
      `}</style>

      {/* Content */}
      <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '40px 24px 120px' }}>
        <div className="onboarding-grid">

          {/* Left Column: Form Card */}
          <div style={{
            backgroundColor: 'var(--canvas)',
            borderRadius: 'var(--rounded-xl)',
            border: '1px solid var(--hairline)',
            padding: '40px',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            {renderStep()}
          </div>

          {/* Right Column: Checklist Widget */}
          <div style={{
            position: 'sticky',
            top: '120px',
            alignSelf: 'flex-start'
          }} className="onboarding-sidebar">
            <ProfileChecklist totalPercent={totalPercent} checklistItems={checklistItems} />
          </div>

        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)', padding: '16px 24px', zIndex: 90 }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={back} disabled={step === 1} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-full)', background: 'none', color: step === 1 ? 'var(--muted)' : 'var(--slate)', cursor: step === 1 ? 'default' : 'pointer', fontSize: '14px', fontWeight: 500 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div style={{ fontSize: '13px', color: saveMsg === 'Saved!' ? 'var(--brand-green-dark)' : 'var(--accent-orange)', fontWeight: 500, minWidth: '80px', textAlign: 'center' }}>
            {saving ? 'Saving…' : saveMsg}
          </div>
          <Button onClick={next} variant="primary" disabled={saving || (step === 8 && hasForbiddenContent)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {step === TOTAL_STEPS ? '🎉 Complete Profile' : <>Save & Continue <ChevronRight size={16} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TutorOnboarding() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)' }}>
        Loading onboarding...
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
