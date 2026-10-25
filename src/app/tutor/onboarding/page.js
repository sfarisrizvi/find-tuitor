'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Camera, Upload, CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2,
  MapPin, Clock, DollarSign, BookOpen, FileText, Video, AlertCircle, Check,
  X, Lock, Pencil, HelpCircle, Phone, Sparkles, User, GraduationCap, Award,
  Home, Car, Laptop, Settings, Info
} from 'lucide-react';
import { TehsilSelector } from '../../../components/ui/TehsilSelector';

// ============================================================
// EDUCATION LEVELS
// ============================================================
const EDUCATION_LEVELS = [
  'Matric',
  'Inter',
  'BA/BSc',
  'BS',
  'MS',
  'PhD'
];

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

function UploadBox({ label, hint, accept, onChange, value, icon: Icon = Upload, docKey, kycVerifications, onViewObjections }) {
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
      
      {/* Pinned area objections */}
      {kycVerifications?.[docKey]?.annotations?.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewObjections && onViewObjections(docKey);
          }}
          style={{
            marginTop: '8px',
            width: '100%',
            backgroundColor: '#FEE2E2',
            border: '1px solid #EF4444',
            borderRadius: 'var(--rounded-md)',
            color: '#B91C1C',
            fontSize: '12px',
            fontWeight: 600,
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={14} color="#EF4444" />
          View {kycVerifications[docKey].annotations.length} Objection Area{kycVerifications[docKey].annotations.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

function CertificateItemRow({ cert, index, onUpdateTitle, onUpdateFile, onRemove }) {
  const fileInputRef = useRef(null);

  const getFileName = () => {
    if (!cert.file) return null;
    if (typeof cert.file === 'string') {
      const parts = cert.file.split('/');
      return parts[parts.length - 1];
    }
    return cert.file.name;
  };

  const fileName = getFileName();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 14px',
      backgroundColor: 'var(--surface-soft)',
      border: '1px solid var(--hairline-strong)',
      borderRadius: 'var(--rounded-md)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          Certificate #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-orange)',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 500
          }}
          title="Remove certificate"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Certificate name (e.g. IELTS 8.0, TEFL, Cambridge TKT)"
          value={cert.title || ''}
          onChange={e => onUpdateTitle(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            height: '42px',
            padding: '0 12px',
            borderRadius: 'var(--rounded-md)',
            border: '1px solid var(--hairline-strong)',
            backgroundColor: 'var(--canvas)',
            fontSize: '14px',
            color: 'var(--ink)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ flexShrink: 0 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files?.[0]) {
                onUpdateFile(e.target.files[0]);
              }
            }}
          />

          {fileName ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 12px',
              backgroundColor: 'var(--brand-green-soft)',
              border: '1px solid var(--brand-green-dark)',
              borderRadius: 'var(--rounded-md)',
              color: 'var(--brand-green-dark)',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <CheckCircle2 size={15} color="var(--brand-green-dark)" style={{ flexShrink: 0 }} />
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileName}>
                {fileName}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-green-dark)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 4px'
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '42px',
                padding: '0 14px',
                backgroundColor: 'var(--canvas)',
                border: '1.5px dashed var(--brand-green-dark)',
                borderRadius: 'var(--rounded-md)',
                color: 'var(--brand-green-dark)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Upload size={14} /> Upload Document
            </button>
          )}
        </div>
      </div>
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
  const [profile, setProfile] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Step 0: Google Signup Contact & Location Info
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [step0FullName, setStep0FullName] = useState('');
  const [step0Phone, setStep0Phone] = useState('');
  const [step0City, setStep0City] = useState('');
  const [step0Area, setStep0Area] = useState('');
  const [step0Error, setStep0Error] = useState('');

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
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [qualification, setQualification] = useState('');

  // Step 2: KYC docs & Education
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [degree, setDegree] = useState(null);
  const [educationLevel, setEducationLevel] = useState('');
  const [educationField, setEducationField] = useState('');
  const [additionalDegrees, setAdditionalDegrees] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [hasKycDocs, setHasKycDocs] = useState(false);
  const [kycObjections, setKycObjections] = useState(null);

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
  const [customSubjectInputs, setCustomSubjectInputs] = useState({});

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [suspended, setSuspended] = useState(false);
  const [kycVerifications, setKycVerifications] = useState({});
  const [objectionsModal, setObjectionsModal] = useState({ isOpen: false, url: '', docKey: '' });

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push('/login'); return; }
      setUser(u);
      const isGoogle = u.app_metadata?.provider === 'google' ||
        u.identities?.some(id => id.provider === 'google') ||
        (typeof window !== 'undefined' && localStorage.getItem('last_login_method') === 'google');
      
      setIsGoogleSignup(isGoogle);

      // Load existing progress
      const { data: profile } = await supabase.from('tutor_profiles').select('*').eq('id', u.id).single();
      if (profile) {
        setProfile(profile);
        setOnboardingComplete(profile.onboarding_complete || false);
        setSuspended(profile.suspended || false);
        setKycVerifications(profile.kyc_verifications || {});

        const initialFullName = profile.full_name || u.user_metadata?.full_name || u.user_metadata?.name || '';
        setStep0FullName(initialFullName);
        setStep0Phone(profile.phone || '');
        setStep0City(profile.city || '');
        setStep0Area(profile.area || '');

        // Determine if Step 0 is needed: only if user signed up with Google and phone/city are not set yet
        const needsStep0 = isGoogle && (!profile.phone || !profile.city || profile.onboarding_step === 0);

        setBio(profile.bio || '');
        setAbout(profile.about || '');
        setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
        setOwnPlaceAddress(profile.own_place_address || '');
        setServiceRadius(profile.service_radius_km || 10);
        setServiceCities(profile.service_cities || []);
        setSelectedLanguages(profile.languages || []);
        setAvatarUrl(profile.avatar_url || '');
        setCoverUrl(profile.cover_url || '');
        setProfileName(initialFullName);
        setProfileEmail(profile.email || u.email || '');
        setCurrentRole(profile.current_role || '');
        setCurrentCompany(profile.current_company || '');
        setQualification(profile.qualification || '');

        // Initialize education qualification
        let initLevel = '';
        let initField = '';
        if (profile.kyc_docs?.education_level) {
          initLevel = profile.kyc_docs.education_level;
          initField = profile.kyc_docs.education_title || profile.kyc_docs.education_field || '';
        } else if (profile.qualification) {
          const parts = profile.qualification.split(' - ');
          if (parts.length >= 2 && EDUCATION_LEVELS.includes(parts[0].trim())) {
            initLevel = parts[0].trim();
            initField = parts.slice(1).join(' - ').trim();
          } else if (EDUCATION_LEVELS.includes(profile.qualification.trim())) {
            initLevel = profile.qualification.trim();
          } else {
            const match = EDUCATION_LEVELS.find(lvl => 
              profile.qualification.toLowerCase().startsWith(lvl.toLowerCase())
            );
            if (match) {
              initLevel = match;
              initField = profile.qualification.substring(match.length).replace(/^[\s\-–—:]+/, '').trim();
            } else {
              initField = profile.qualification;
            }
          }
        }
        setEducationLevel(initLevel);
        setEducationField(initField);

        if (profile.kyc_docs && Object.keys(profile.kyc_docs).length > 0) {
          setHasKycDocs(true);
          if (profile.kyc_docs.cnic_front) setCnicFront(profile.kyc_docs.cnic_front);
          if (profile.kyc_docs.cnic_back) setCnicBack(profile.kyc_docs.cnic_back);
          if (profile.kyc_docs.degree) setDegree(profile.kyc_docs.degree);
          
          if (profile.kyc_docs.additional_degrees && Array.isArray(profile.kyc_docs.additional_degrees)) {
            setAdditionalDegrees(profile.kyc_docs.additional_degrees.map((d, i) => ({
              id: d.id || `ad-${i}`,
              level: d.level || '',
              field: d.field || d.education_title || '',
              file: d.path || d.file || null,
              path: d.path || ''
            })));
          }

          if (profile.kyc_docs.certificates && Array.isArray(profile.kyc_docs.certificates)) {
            setCertificates(profile.kyc_docs.certificates.map((c, i) => {
              if (typeof c === 'string') {
                return { id: `cert-${i}`, title: `Certificate ${i + 1}`, file: c, path: c };
              }
              return {
                id: c.id || `cert-${i}`,
                title: c.title || c.name || `Certificate ${i + 1}`,
                file: c.path || c.file || null,
                path: c.path || ''
              };
            }));
          }
        }
        if (profile.kyc_objections) {
          setKycObjections(profile.kyc_objections);
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
        if (stepParam !== null && stepParam !== undefined) {
          const parsedStep = parseInt(stepParam);
          if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 8) {
            setStep(parsedStep);
          } else if (needsStep0) {
            setStep(0);
          } else if (profile.onboarding_step !== undefined) {
            setStep(Math.max(1, profile.onboarding_step));
          }
        } else if (needsStep0) {
          setStep(0);
        } else if (profile.onboarding_step !== undefined) {
          setStep(Math.max(1, profile.onboarding_step));
        } else {
          setStep(1);
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

            // Auto-check 'Other' if we load a custom subject not in LEVEL_SUBJECTS static list
            const staticList = LEVEL_SUBJECTS[row.level] || [];
            if (!staticList.includes(row.subject) && !subMap[row.level].includes('Other')) {
              subMap[row.level].push('Other');
            }
          }
        });
        setActiveLevels(activeMap);
        setSelectedSubjectsByLevel(subMap);
      }
    };
    init();
  }, [router, stepParam]);

  const showObjectionsModal = async (docKey) => {
    const path = docKey === 'cnic_front' ? cnicFront : docKey === 'cnic_back' ? cnicBack : docKey === 'degree' ? degree : '';
    if (!path) return;
    
    if (typeof path !== 'string') {
      const localUrl = URL.createObjectURL(path);
      setObjectionsModal({ isOpen: true, url: localUrl, docKey });
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage.from('teacher-files').createSignedUrl(path, 3600);
    if (!error && data) {
      setObjectionsModal({ isOpen: true, url: data.signedUrl, docKey });
    } else {
      alert("Could not load document preview.");
    }
  };

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

      if (step === 0) {
        updates = {
          ...updates,
          full_name: step0FullName.trim(),
          phone: step0Phone.trim(),
          city: step0City.trim(),
          area: step0Area ? step0Area.trim() : null
        };
      }

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

        updates = { 
          ...updates, 
          bio, 
          full_name: profileName, 
          avatar_url: avatar_path, 
          cover_url: cover_path,
          current_role: currentRole,
          current_company: currentCompany,
          qualification: qualification
        };
      }

      if (step === 2) {
        const { data: currentTutor } = await supabase.from('tutor_profiles').select('kyc_docs').eq('id', user.id).maybeSingle();
        const kyc_docs = { ...(currentTutor?.kyc_docs || {}) };
        
        if (cnicFront) kyc_docs.cnic_front = await uploadFile(cnicFront, 'kyc');
        if (cnicBack) kyc_docs.cnic_back = await uploadFile(cnicBack, 'kyc');
        if (degree) kyc_docs.degree = await uploadFile(degree, 'kyc');

        const fullDegreeName = [educationLevel, educationField.trim()].filter(Boolean).join(' - ');
        if (educationLevel) kyc_docs.education_level = educationLevel;
        if (educationField.trim()) kyc_docs.education_title = educationField.trim();
        if (fullDegreeName) {
          kyc_docs.degree_name = fullDegreeName;
          updates.qualification = fullDegreeName;
          setQualification(fullDegreeName);
        }

        if (additionalDegrees.length > 0) {
          const savedAdditional = [];
          for (const ad of additionalDegrees) {
            if (!ad.file && !ad.level && !ad.field) continue;
            let p = null;
            if (ad.file) {
              p = await uploadFile(ad.file, 'kyc');
            }
            savedAdditional.push({
              level: ad.level || '',
              field: ad.field?.trim() || '',
              degree_name: [ad.level, ad.field?.trim()].filter(Boolean).join(' - '),
              path: p || ad.path || ''
            });
          }
          if (savedAdditional.length > 0) {
            kyc_docs.additional_degrees = savedAdditional;
          }
        }

        if (certificates.length > 0) {
          const savedCerts = [];
          for (const cert of certificates) {
            if (!cert.file && !cert.title?.trim()) continue;
            let p = null;
            if (cert.file) {
              p = await uploadFile(cert.file, 'kyc');
            }
            savedCerts.push({
              title: cert.title?.trim() || 'Certificate',
              path: p || cert.path || '',
              name: typeof cert.file === 'object' && cert.file?.name ? cert.file.name : (cert.title || 'Certificate')
            });
          }
          if (savedCerts.length > 0) {
            kyc_docs.certificates = savedCerts;
          }
        }

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
              // Filter out the literal word 'Other' from database rows so it does not pollute the table
              const subs = (selectedSubjectsByLevel[levelName] || []).filter(s => s !== 'Other');
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
        // Mark onboarding complete on last step ONLY if all steps are valid
        if (nextStep > TOTAL_STEPS && isAllStepsCompleted) updates.onboarding_complete = true;
      }

      const { error: updateErr } = await supabase.from('tutor_profiles').update(updates).eq('id', user.id);
      if (updateErr) throw updateErr;

      if (updates.onboarding_complete) {
        setOnboardingComplete(true);
        setProfile(prev => prev ? { ...prev, onboarding_complete: true } : null);
        try {
          await supabase.rpc('claim_tutor_onboarding_bonus', { p_tutor_id: user.id });
        } catch (bonusErr) {
          console.error('Onboarding bonus claim error (non-fatal):', bonusErr);
        }
      }

      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      const errMsg = err?.message || err?.details || err?.hint || (typeof err === 'object' && Object.keys(err).length > 0 ? JSON.stringify(err) : String(err));
      console.error('Tutor Onboarding Save Error:', errMsg, err);
      setSaveMsg(errMsg ? `Error: ${errMsg}` : 'Error saving. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStep0Continue = async () => {
    setStep0Error('');
    if (!step0FullName.trim()) {
      setStep0Error('Please enter your full name.');
      return;
    }
    if (!step0Phone.trim() || step0Phone.trim().replace(/\D/g, '').length < 7) {
      setStep0Error('Please enter a valid phone number (at least 7 digits).');
      return;
    }
    if (!step0City.trim()) {
      setStep0Error('Please select your city or tehsil.');
      return;
    }

    setSaving(true);
    setSaveMsg('');
    const supabase = createClient();
    try {
      const updates = {
        full_name: step0FullName.trim(),
        phone: step0Phone.trim(),
        city: step0City.trim(),
        area: step0Area ? step0Area.trim() : null,
        onboarding_step: 1
      };
      const { error: dbErr } = await supabase
        .from('tutor_profiles')
        .update(updates)
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      setProfileName(step0FullName.trim());
      setStep(1);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saving step 0:', err);
      const errMsg = err?.message || 'Failed to save details. Please try again.';
      setStep0Error(errMsg);
      setSaveMsg(`Error: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const getStepDisplayName = (sNum) => {
    if (sNum === 0) return 'Step 0 (Contact & City)';
    return `Step ${sNum} (${STEP_LABELS[sNum - 1] || ''})`;
  };

  const next = async () => {
    if (step === 0) {
      await handleStep0Continue();
      return;
    }

    if (step === TOTAL_STEPS) {
      if (!isAllStepsCompleted) {
        alert(`Cannot complete onboarding. You have ${incompleteSteps.length} incomplete step(s): ${incompleteSteps.map(s => getStepDisplayName(s)).join(', ')}`);
        return;
      }
      await saveStep(TOTAL_STEPS + 1);
      router.push('/tutor/dashboard');
      return;
    }

    const ns = step + 1;
    await saveStep(ns);
    setStep(ns);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    const minStep = isGoogleSignup ? 0 : 1;
    setStep(s => Math.max(minStep, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skip = () => {
    if (step === 0) {
      setStep0Error('Please fill in your name, phone, and city before proceeding.');
      return;
    }
    const ns = step + 1;
    if (ns > TOTAL_STEPS) {
      if (!isAllStepsCompleted) {
        alert(`Cannot complete onboarding. You have ${incompleteSteps.length} incomplete step(s): ${incompleteSteps.map(s => getStepDisplayName(s)).join(', ')}`);
        return;
      }
      saveStep(TOTAL_STEPS + 1);
      router.push('/tutor/dashboard');
    } else {
      setStep(ns);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const addCustomSubject = (levelName) => {
    const text = (customSubjectInputs[levelName] || '').trim();
    if (!text) return;
    
    setSelectedSubjectsByLevel(prev => {
      const currentList = prev[levelName] || [];
      if (currentList.includes(text)) return prev;
      
      const newList = [...currentList, text];
      // Auto-check parent level
      setActiveLevels(l => ({ ...l, [levelName]: true }));
      return { ...prev, [levelName]: newList };
    });

    setCustomSubjectInputs(prev => ({ ...prev, [levelName]: '' }));
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
  const checkSetupAccount = isGoogleSignup
    ? (step0FullName.trim().length > 0 && step0Phone.trim().replace(/\D/g, '').length >= 7 && step0City.trim().length > 0)
    : (!!profileName && !!user);
  const checkProfilePhoto = !!avatarFile || (!!avatarUrl && !avatarDeleted);
  const checkBio = bio.trim().length > 10;
  const checkKyc = !!cnicFront || !!cnicBack || !!degree || hasKycDocs;
  const checkCategories = Object.values(activeLevels).some(v => v);
  const checkExperience = experiences.some(e => e.institution && e.role && e.year_from);
  const checkRates = !!hourlyRate && Object.values(availSlots).some(v => v && v.active);

  let totalPercent = checkSetupAccount ? 10 : 0;
  if (checkProfilePhoto) totalPercent += 10;
  if (checkBio) totalPercent += 10;
  if (checkKyc) totalPercent += 15;
  if (checkCategories) totalPercent += 15;
  if (checkExperience) totalPercent += 15;
  if (checkRates) totalPercent += 25;

  const checklistItems = [
    { label: isGoogleSignup ? 'Contact & City Info' : 'Setup account', weight: '10%', active: checkSetupAccount },
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

  const isStepValid = (s) => {
    switch (s) {
      case 0:
        return step0FullName.trim().length > 0 && step0Phone.trim().replace(/\D/g, '').length >= 7 && step0City.trim().length > 0;
      case 1:
        return (!!avatarFile || (!!avatarUrl && !avatarDeleted)) && profileName.trim().length > 0 && bio.trim().length >= 10;
      case 2:
        return !!cnicFront || !!cnicBack || !!degree || hasKycDocs;
      case 3:
        return Object.values(activeLevels).some(v => v);
      case 4:
        return selectedLanguages.length > 0;
      case 5:
        return experiences.some(e => e.institution?.trim() && e.role?.trim() && e.year_from);
      case 6:
        return Object.values(teachingModes).some(v => v);
      case 7:
        return !!hourlyRate && parseFloat(hourlyRate) > 0 && Object.values(availSlots).some(v => v && v.active);
      case 8:
        return about.trim().length >= 20 && !hasForbiddenContent;
      default:
        return false;
    }
  };

  const checkSteps = isGoogleSignup ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8];
  const incompleteSteps = checkSteps.filter(s => !isStepValid(s));
  const isAllStepsCompleted = incompleteSteps.length === 0;

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
      // ------- STEP 0: Contact & Location (Google Signup) -------
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepHeader 
              step={0} 
              title="Personal & Location Setup" 
              desc="Since you registered with Google, please provide your contact and city details before continuing." 
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              backgroundColor: 'var(--brand-green-soft)',
              border: '1px solid var(--brand-green-dark)',
              borderRadius: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-green-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand-green-dark)' }}>
                  Welcome to TutorOnline!
                </div>
                <div style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '2px', lineHeight: '1.4' }}>
                  We received your Google sign-in. Please confirm your full name, mobile/WhatsApp number, and primary city before proceeding.
                </div>
              </div>
            </div>

            {step0Error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #EF4444',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#B91C1C',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{step0Error}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: 'var(--ink)' }}>
                  Full Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={step0FullName}
                    onChange={e => setStep0FullName(e.target.value)}
                    required
                    style={{ paddingLeft: '44px', height: '48px', fontSize: '14px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: 'var(--ink)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type="email"
                    value={profileEmail || user?.email || ''}
                    disabled
                    style={{ height: '48px', fontSize: '14px', borderRadius: '8px', backgroundColor: 'var(--surface-soft)', color: 'var(--stone)', cursor: 'not-allowed' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
                  Linked with your Google account.
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: 'var(--ink)' }}>
                  Phone Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                  <Input
                    type="tel"
                    placeholder="e.g. 0300 1234567 or +92 300 1234567"
                    value={step0Phone}
                    onChange={e => setStep0Phone(e.target.value)}
                    required
                    style={{ paddingLeft: '44px', height: '48px', fontSize: '14px', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
                  Students and parents will use this number to contact you for tutoring assignments.
                </div>
              </div>

              {/* City / Tehsil Selector */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: 'var(--ink)' }}>
                  Primary City / Tehsil <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <TehsilSelector
                  mode="form"
                  value={{ tehsil: step0City, area: step0Area }}
                  onChange={(payload, formatted) => {
                    if (payload) {
                      setStep0City(payload.tehsil || formatted || '');
                      if (payload.area) setStep0Area(payload.area);
                    } else {
                      setStep0City('');
                    }
                  }}
                  placeholder="Select your Tehsil / City"
                  required
                  triggerStyle={{
                    height: '48px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--hairline-strong)',
                    fontSize: '14px'
                  }}
                />
                <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
                  Select your city/tehsil to receive matching home and online tuition requests.
                </div>
              </div>
            </div>
          </div>
        );

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
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Phone Number</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{step0Phone || '—'}</div>
                  {isGoogleSignup && (
                    <Pencil
                      size={13}
                      style={{ cursor: 'pointer', color: 'var(--stone)', transition: 'color 0.15s ease' }}
                      onMouseEnter={e => e.target.style.color = 'var(--ink)'}
                      onMouseLeave={e => e.target.style.color = 'var(--stone)'}
                      onClick={() => {
                        setStep(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title="Edit Phone in Step 0"
                    />
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>City / Location</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                    {step0City ? (step0Area ? `${step0Area}, ${step0City}` : step0City) : '—'}
                  </div>
                  {isGoogleSignup && (
                    <Pencil
                      size={13}
                      style={{ cursor: 'pointer', color: 'var(--stone)', transition: 'color 0.15s ease' }}
                      onMouseEnter={e => e.target.style.color = 'var(--ink)'}
                      onMouseLeave={e => e.target.style.color = 'var(--stone)'}
                      onClick={() => {
                        setStep(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title="Edit City / Location in Step 0"
                    />
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Account Type</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 600, color: 'var(--accent-orange)' }}>
                    <AlertCircle size={15} color="var(--accent-orange)" /> Unverified
                  </div>
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
            
            {kycObjections && Object.keys(kycObjections).length > 0 && (
              <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 'var(--rounded-md)', padding: '16px', color: '#B71C1C', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertCircle size={20} color="#B71C1C" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 600, color: '#B71C1C' }}>Rejection Objections from Administration</h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Flagged Documents:</strong> {kycObjections.flagged_documents?.join(', ')}</p>
                  <p style={{ margin: 0, fontSize: '13px' }}><strong>Correction Instructions:</strong> {kycObjections.comment}</p>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFD566', borderRadius: 'var(--rounded-md)', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#B8860B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#7A5C00' }}>All documents are stored in an encrypted, private folder and are never shared or deleted even upon account closure.</p>
            </div>

            {/* CNIC Upload Section */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: 'var(--ink)', marginBottom: '10px' }}>
                Government National Identity (CNIC / Passport)
              </label>
              <div className="grid-2col" style={{ gap: '16px' }}>
                <UploadBox label="CNIC / Passport – Front" hint="JPG, PNG or PDF, max 5MB" accept="image/*,.pdf" icon={FileText} value={cnicFront} onChange={setCnicFront} docKey="cnic_front" kycVerifications={kycVerifications} onViewObjections={showObjectionsModal} />
                <UploadBox label="CNIC / Passport – Back" hint="JPG, PNG or PDF, max 5MB" accept="image/*,.pdf" icon={FileText} value={cnicBack} onChange={setCnicBack} docKey="cnic_back" kycVerifications={kycVerifications} onViewObjections={showObjectionsModal} />
              </div>
            </div>

            {/* Education & Degree Document Section */}
            <div style={{
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--rounded-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={20} color="var(--brand-green-dark)" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                      Education & Degree Documents
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--stone)' }}>
                      Select your degree qualification and field of study, then upload your document.
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '3px 10px', borderRadius: 'var(--rounded-full)' }}>
                  Required for Academic Verified badge
                </span>
              </div>

              {/* Select education dropdown - text field row */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--slate)', marginBottom: '8px' }}>
                  Degree / Education Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={educationLevel}
                    onChange={e => setEducationLevel(e.target.value)}
                    style={{
                      minWidth: '150px',
                      height: '46px',
                      padding: '0 14px',
                      borderRadius: 'var(--rounded-md)',
                      border: '1.5px solid var(--hairline-strong)',
                      backgroundColor: 'var(--canvas)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: educationLevel ? 'var(--ink)' : 'var(--stone)',
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="" disabled>Select Level</option>
                    {EDUCATION_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>

                  <span style={{ color: 'var(--stone)', fontWeight: 700, fontSize: '18px', userSelect: 'none' }}>—</span>

                  <input
                    type="text"
                    placeholder="Which education (e.g. Biology, Maths, Science, Computer Science)"
                    value={educationField}
                    onChange={e => setEducationField(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      height: '46px',
                      padding: '0 14px',
                      borderRadius: 'var(--rounded-md)',
                      border: '1.5px solid var(--hairline-strong)',
                      backgroundColor: 'var(--canvas)',
                      fontSize: '14px',
                      color: 'var(--ink)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Live formatted display */}
                {(educationLevel || educationField.trim()) && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--stone)' }}>Appears on profile as:</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', color: 'var(--brand-green-dark)', padding: '2px 10px', borderRadius: 'var(--rounded-full)', fontSize: '12px', fontWeight: 700 }}>
                      <GraduationCap size={13} />
                      {[educationLevel, educationField.trim()].filter(Boolean).join(' - ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Document */}
              <UploadBox
                label="Upload Degree / Transcript Document"
                hint="Scanned copy or photo · JPG, PNG or PDF, max 5MB"
                accept="image/*,.pdf"
                icon={BookOpen}
                value={degree}
                onChange={setDegree}
                docKey="degree"
                kycVerifications={kycVerifications}
                onViewObjections={showObjectionsModal}
              />

              {/* Additional degrees if tutor holds multiple qualifications */}
              {additionalDegrees.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate)' }}>
                    Additional Education Qualifications
                  </label>
                  {additionalDegrees.map((ad, idx) => (
                    <div key={ad.id || idx} style={{ padding: '14px', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase' }}>
                          Degree #{idx + 2}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdditionalDegrees(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', padding: '2px 4px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <select
                          value={ad.level}
                          onChange={e => {
                            const val = e.target.value;
                            setAdditionalDegrees(prev => prev.map((item, i) => i === idx ? { ...item, level: val } : item));
                          }}
                          style={{
                            minWidth: '130px',
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: 'var(--rounded-md)',
                            border: '1px solid var(--hairline-strong)',
                            backgroundColor: 'var(--canvas)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="" disabled>Select Level</option>
                          {EDUCATION_LEVELS.map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                        <span style={{ color: 'var(--stone)', fontWeight: 700 }}>—</span>
                        <input
                          type="text"
                          placeholder="Which education (e.g. Maths, Pre-Medical)"
                          value={ad.field}
                          onChange={e => {
                            const val = e.target.value;
                            setAdditionalDegrees(prev => prev.map((item, i) => i === idx ? { ...item, field: val } : item));
                          }}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: 'var(--rounded-md)',
                            border: '1px solid var(--hairline-strong)',
                            backgroundColor: 'var(--canvas)',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px dashed var(--brand-green-dark)', borderRadius: 'var(--rounded-md)', backgroundColor: 'var(--canvas)', color: 'var(--brand-green-dark)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <Upload size={14} />
                          {ad.file ? (typeof ad.file === 'string' ? ad.file.split('/').pop() : ad.file.name) : 'Upload Document'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: 'none' }}
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                const f = e.target.files[0];
                                setAdditionalDegrees(prev => prev.map((item, i) => i === idx ? { ...item, file: f, path: '' } : item));
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setAdditionalDegrees(prev => [...prev, { id: Date.now(), level: '', field: '', file: null, path: '' }])}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    border: '1px dashed var(--hairline-strong)',
                    borderRadius: 'var(--rounded-md)',
                    backgroundColor: 'transparent',
                    color: 'var(--brand-green-dark)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Another Degree (optional)
                </button>
              </div>
            </div>

            {/* Additional Certificates Section */}
            <div style={{
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--rounded-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="var(--brand-green-dark)" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                      Additional Certificates <span style={{ color: 'var(--stone)', fontWeight: 400, fontSize: '13px' }}>(optional)</span>
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--stone)' }}>
                      Add professional teaching certifications, diplomas, language test scores (e.g. IELTS), or courses.
                    </p>
                  </div>
                </div>
              </div>

              {certificates.length === 0 ? (
                <div style={{ padding: '16px', backgroundColor: 'var(--surface-soft)', border: '1px dashed var(--hairline-strong)', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--stone)' }}>
                    No additional certificates added yet. Adding certifications boosts client trust.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCertificates(prev => [...prev, { id: Date.now(), title: '', file: null, path: '' }])}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--canvas)',
                      border: '1.5px solid var(--brand-green-dark)',
                      borderRadius: 'var(--rounded-md)',
                      color: 'var(--brand-green-dark)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} /> Add Certificate
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {certificates.map((cert, index) => (
                    <CertificateItemRow
                      key={cert.id || index}
                      cert={cert}
                      index={index}
                      onUpdateTitle={(newTitle) => {
                        setCertificates(prev => prev.map((c, i) => i === index ? { ...c, title: newTitle } : c));
                      }}
                      onUpdateFile={(newFile) => {
                        setCertificates(prev => prev.map((c, i) => i === index ? { ...c, file: newFile, path: typeof newFile === 'string' ? newFile : '' } : c));
                      }}
                      onRemove={() => {
                        setCertificates(prev => prev.filter((_, i) => i !== index));
                      }}
                    />
                  ))}

                  <div>
                    <button
                      type="button"
                      onClick={() => setCertificates(prev => [...prev, { id: Date.now(), title: '', file: null, path: '' }])}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        border: '1px dashed var(--hairline-strong)',
                        borderRadius: 'var(--rounded-md)',
                        backgroundColor: 'transparent',
                        color: 'var(--brand-green-dark)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} /> Add Another Certificate
                    </button>
                  </div>
                </div>
              )}
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
                const baseSubjects = LEVEL_SUBJECTS[levelName] || [];
                const selectedSubs = selectedSubjectsByLevel[levelName] || [];
                const subjects = [
                  ...baseSubjects.filter(s => s !== 'Other'),
                  ...selectedSubs.filter(s => !baseSubjects.includes(s) && s !== 'Other'),
                  ...(baseSubjects.includes('Other') ? ['Other'] : [])
                ];

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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                            {selectedSubs.includes('Other') && (
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginTop: '8px',
                                borderTop: '1px dashed var(--hairline)',
                                paddingTop: '12px',
                                maxWidth: '400px'
                              }}>
                                <Input
                                  placeholder="Add other subject (e.g. Sociology)"
                                  value={customSubjectInputs[levelName] || ''}
                                  onChange={e => setCustomSubjectInputs(prev => ({ ...prev, [levelName]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addCustomSubject(levelName);
                                    }
                                  }}
                                  style={{ height: '36px', fontSize: '13px' }}
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => addCustomSubject(levelName)}
                                  style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                                >
                                  Add
                                </Button>
                              </div>
                            )}
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
                { key: 'own_place', label: 'At My Own Place', desc: 'Students come to your home or classroom', icon: Home },
                { key: 'home_visit', label: 'Home Visits', desc: "You travel to the student's location", icon: Car },
                { key: 'online', label: 'Online / Remote', desc: 'Via Zoom, Google Meet, or WhatsApp Video', icon: Laptop },
              ].map(({ key, label, desc, icon: ModeIcon }) => {
                const active = teachingModes[key];
                return (
                  <button key={key} onClick={() => toggleMode(key)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: 'var(--rounded-md)', border: active ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)', backgroundColor: active ? 'var(--brand-green-soft)' : 'var(--canvas)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: active ? 'rgba(0, 104, 74, 0.1)' : 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ModeIcon size={24} color={active ? 'var(--brand-green-dark)' : 'var(--slate)'} strokeWidth={1.75} />
                    </div>
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
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Home size={18} color="var(--brand-green-dark)" /> Your Teaching Space
                </h4>
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
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={18} color="var(--brand-green-dark)" /> Home Visit Coverage
                </h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Service Radius: <strong style={{ color: 'var(--brand-green-dark)' }}>{serviceRadius} km</strong></label>
                  <input type="range" min={1} max={50} value={serviceRadius} onChange={e => setServiceRadius(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--brand-green-dark)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--stone)' }}>
                    <span>1 km</span><span>50 km</span>
                  </div>
                </div>
                <div>
                  <TehsilSelector
                    multiple={true}
                    value={serviceCities}
                    onChange={setServiceCities}
                    label="Tehsils & Cities You Serve"
                    placeholder="Search or select all tehsils you serve..."
                  />
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
                        <Info size={11} style={{ opacity: 0.8 }} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <UploadBox label="Short Intro Video (optional)" hint="Max 60 seconds · MP4 or MOV · Max 50MB" accept="video/*" icon={Video} value={introVideo} onChange={setIntroVideo} />

            {/* Terms & Privacy Acceptance Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: acceptedTerms ? 'rgba(16, 185, 129, 0.08)' : 'var(--canvas)',
              border: acceptedTerms ? '1px solid var(--brand-green)' : '1px solid var(--hairline-strong)',
              borderRadius: 'var(--rounded-md)',
              padding: '16px',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="checkbox"
                id="accept-terms-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  accentColor: 'var(--brand-green)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <label htmlFor="accept-terms-checkbox" style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5', cursor: 'pointer', userSelect: 'none' }}>
                I have read and agree to TutorOnline.pk&apos;s{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-teal-mid)', textDecoration: 'underline', fontWeight: 600 }}>
                  Terms &amp; Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-teal-mid)', textDecoration: 'underline', fontWeight: 600 }}>
                  Privacy Policy
                </a>.
              </label>
            </div>

            <div style={{ backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', borderRadius: 'var(--rounded-md)', padding: '16px', fontSize: '14px', color: 'var(--brand-green-dark)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="var(--brand-green-dark)" style={{ flexShrink: 0 }} />
              <span>You&apos;re almost done! After submitting, your profile will be reviewed by our admin team. You&apos;ll be notified when you are approved.</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (suspended) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', backgroundColor: 'var(--surface)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={32} color="#EF4444" />
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--ink)' }}>Account Suspended</h2>
        </div>
        <p style={{ color: 'var(--stone)', fontSize: '15px', maxWidth: '520px', margin: 0, lineHeight: 1.5 }}>
          Your tutor account has been suspended by the administrator. During suspension, you cannot complete onboarding, edit your profile details, or make updates to your profile. Please get in touch with administrator support to resolve this suspension.
        </p>
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
          <a href="mailto:support@tutoronline.pk" style={{ textDecoration: 'none' }}>
            <Button style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none' }}>Get Admin Support</Button>
          </a>
          <button 
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="admin-btn admin-btn-secondary"
            style={{ padding: '10px 20px', borderRadius: 'var(--rounded-md)' }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Top progress bar */}
      <div style={{ position: 'sticky', top: '64px', zIndex: 10, backgroundColor: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '20px 24px 24px 24px' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate)' }}>Tutor Profile Setup</span>
            {step !== 0 && (
              <button onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--steel)', fontSize: '13px', cursor: 'pointer', padding: '4px 8px' }}>
                Skip for now →
              </button>
            )}
          </div>

          {/* Mobile Compact Progress Bar */}
          <div className="mobile-onboarding-stepper" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                {step === 0 
                  ? 'Step 0: Contact & Location Details' 
                  : `Step ${step} of ${TOTAL_STEPS}: ${STEP_LABELS[step - 1]}`}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-green-dark)' }}>
                {isGoogleSignup
                  ? Math.round((step / TOTAL_STEPS) * 100)
                  : Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--hairline-strong)', borderRadius: '999px', overflow: 'hidden', marginTop: '6px' }}>
              <div style={{
                height: '100%',
                width: `${isGoogleSignup ? (step / TOTAL_STEPS) * 100 : ((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
                backgroundColor: '#41B01B',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Timeline Stepper */}
          <div className="desktop-onboarding-stepper" style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 10px',
            overflowX: 'auto',
            minWidth: '100%'
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
              width: `calc(${isGoogleSignup ? (step / TOTAL_STEPS) * 100 : ((step - 1) / (TOTAL_STEPS - 1)) * 100}% - ${(isGoogleSignup ? step / TOTAL_STEPS : (step - 1) / (TOTAL_STEPS - 1)) * 100 > 0 ? '10px' : '0px'})`,
              top: '18px',
              height: '3px',
              backgroundColor: '#41B01B',
              zIndex: 2,
              transition: 'width 0.4s ease'
            }} />

            {/* Stepper Steps */}
            {(isGoogleSignup
              ? [{ stepNum: 0, labelText: 'Contact & City' }, ...STEP_LABELS.map((labelText, i) => ({ stepNum: i + 1, labelText }))]
              : STEP_LABELS.map((labelText, i) => ({ stepNum: i + 1, labelText }))
            ).map(({ stepNum, labelText }) => {
              const valid = isStepValid(stepNum);
              const current = step === stepNum;
              const isPast = step > stepNum;
              const isSkippedOrInvalid = !valid && (isPast || step === TOTAL_STEPS);

              let circleBg = '#fff';
              let circleBorder = '2px solid var(--hairline-strong)';
              let textColor = 'var(--stone)';
              let icon = <span style={{ color: current ? '#B45309' : 'var(--stone)', fontWeight: 700, fontSize: '13px' }}>{stepNum}</span>;

              if (isSkippedOrInvalid) {
                circleBg = '#FEF2F2';
                circleBorder = '2px solid #EF4444';
                textColor = '#EF4444';
                icon = <AlertCircle size={18} color="#EF4444" />;
              } else if (valid && (isPast || (current && valid))) {
                circleBg = '#41B01B';
                circleBorder = 'none';
                textColor = '#fff';
                icon = <Check size={16} color="#fff" strokeWidth={3} />;
              } else if (current) {
                circleBg = '#FFFBEB';
                circleBorder = '2px solid #F59E0B';
                textColor = '#B45309';
              }

              return (
                <div 
                  key={stepNum} 
                  className="step-container" 
                  onClick={() => { setStep(stepNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 3,
                    width: '90px',
                    cursor: 'pointer'
                  }}
                  title={isSkippedOrInvalid ? `Step ${stepNum} (${labelText}) is incomplete! Click to fix.` : `Step ${stepNum}: ${labelText}`}
                >
                  {/* Circle */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: circleBg,
                    border: circleBorder,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: current 
                      ? '0 0 0 4px rgba(245, 158, 11, 0.2)' 
                      : isSkippedOrInvalid 
                        ? '0 0 0 4px rgba(239, 68, 68, 0.2)' 
                        : 'none'
                  }}>
                    {icon}
                  </div>
                  {/* Label */}
                  <span className="step-label" style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isSkippedOrInvalid ? '#EF4444' : current ? '#B45309' : valid ? '#41B01B' : 'var(--stone)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {labelText} {isSkippedOrInvalid && <AlertCircle size={11} color="#EF4444" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />}
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
        {(onboardingComplete || profile?.onboarding_complete) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'var(--brand-green-soft)',
            border: '1px solid var(--brand-green-dark)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="var(--brand-green-dark)" />
              <div>
                <span style={{ fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '14px' }}>
                  Profile Settings &amp; Editing Mode
                </span>
                <div style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '2px' }}>
                  Your profile is live. You can review or edit any section and save your changes anytime.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link href="/tutor/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" style={{ height: '34px', fontSize: '12px', padding: '0 14px' }}>
                  ← Dashboard
                </Button>
              </Link>
              <Link href={`/tutors/${user?.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ height: '34px', fontSize: '12px', padding: '0 14px', backgroundColor: 'var(--brand-green-dark)', color: '#fff' }}>
                  View Live Profile →
                </Button>
              </Link>
            </div>
          </div>
        )}

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

      {/* Incomplete Steps Banner (Step 8 / Completion) */}
      {step === TOTAL_STEPS && !isAllStepsCompleted && (
        <div style={{
          position: 'fixed',
          bottom: '76px',
          left: 0,
          right: 0,
          backgroundColor: '#FEF2F2',
          borderTop: '1px solid #FCA5A5',
          borderBottom: '1px solid #FCA5A5',
          padding: '12px 24px',
          zIndex: 89,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 700, fontSize: '13px' }}>
              <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>Cannot complete profile: {incompleteSteps.length} incomplete step(s) remaining</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#7F1D1D', marginRight: '4px' }}>Click to fix:</span>
              {incompleteSteps.map(sNum => (
                <button
                  key={sNum}
                  onClick={() => { setStep(sNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #EF4444',
                    color: '#B91C1C',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {getStepDisplayName(sNum)} ➔
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--canvas)', borderTop: '1px solid var(--hairline)', padding: '16px 24px', zIndex: 90 }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={back} 
            disabled={isGoogleSignup ? step === 0 : step === 1} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '10px 20px', 
              border: '1px solid var(--hairline-strong)', 
              borderRadius: 'var(--rounded-full)', 
              background: 'none', 
              color: (isGoogleSignup ? step === 0 : step === 1) ? 'var(--muted)' : 'var(--slate)', 
              cursor: (isGoogleSignup ? step === 0 : step === 1) ? 'default' : 'pointer', 
              fontSize: '14px', 
              fontWeight: 500 
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div style={{ fontSize: '13px', color: saveMsg === 'Saved!' ? 'var(--brand-green-dark)' : 'var(--accent-orange)', fontWeight: 500, minWidth: '80px', textAlign: 'center' }}>
            {saving ? 'Saving…' : saveMsg}
          </div>
          <Button 
            onClick={next} 
            variant="primary" 
            disabled={saving || (step === TOTAL_STEPS && (!isAllStepsCompleted || hasForbiddenContent || !acceptedTerms))} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              opacity: (step === TOTAL_STEPS && (!isAllStepsCompleted || hasForbiddenContent || !acceptedTerms)) ? 0.5 : 1,
              cursor: (step === TOTAL_STEPS && (!isAllStepsCompleted || hasForbiddenContent || !acceptedTerms)) ? 'not-allowed' : 'pointer'
            }}
          >
            {step === TOTAL_STEPS 
              ? <><CheckCircle2 size={16} /> Complete Profile</> 
              : step === 0 
                ? <>Continue to Step 1 <ChevronRight size={16} /></> 
                : <>Save &amp; Continue <ChevronRight size={16} /></>}
          </Button>
        </div>
      </div>

      {/* Objections Viewer Modal */}
      {objectionsModal.isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99998 }}
            onClick={() => setObjectionsModal({ isOpen: false, url: '', docKey: '' })}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--canvas)',
            borderRadius: 'var(--rounded-lg)',
            border: '1px solid var(--hairline)',
            boxShadow: 'var(--shadow-xl)',
            padding: '24px',
            width: '80vw',
            height: '80vh',
            maxWidth: '900px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, textTransform: 'capitalize' }}>
                Flagged Objections: {objectionsModal.docKey?.replace('_', ' ')}
              </h3>
              <button 
                onClick={() => setObjectionsModal({ isOpen: false, url: '', docKey: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
              {/* Document Image Viewport */}
              <div style={{ 
                flex: 1, 
                position: 'relative', 
                backgroundColor: '#04080A', 
                borderRadius: 'var(--rounded-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {objectionsModal.url.includes('.pdf') ? (
                  <iframe src={objectionsModal.url} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={objectionsModal.url} 
                      alt="" 
                      style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
                    />
                    {/* Render objection selection area boxes */}
                    {(kycVerifications?.[objectionsModal.docKey]?.annotations || []).map((ann, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${ann.x}%`,
                          top: `${ann.y}%`,
                          width: `${ann.w}%`,
                          height: `${ann.h}%`,
                          border: '2px solid #EF4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          pointerEvents: 'none',
                          zIndex: 10
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          backgroundColor: '#EF4444',
                          color: '#fff',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          padding: '1px 3px',
                          borderRadius: '2px'
                        }}>
                          Area {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Objection list comments right panel */}
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase' }}>
                  Objection Notes
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(kycVerifications?.[objectionsModal.docKey]?.annotations || []).map((ann, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '12px', 
                        border: '1px solid #FFCDD2', 
                        borderRadius: 'var(--rounded-md)', 
                        backgroundColor: '#FFEBEE',
                        fontSize: '13px',
                        color: '#B71C1C'
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>Area {idx + 1}:</div>
                      <div style={{ lineHeight: 1.4 }}>{ann.text}</div>
                    </div>
                  ))}
                  {(kycVerifications?.[objectionsModal.docKey]?.annotations || []).length === 0 && (
                    <p style={{ fontSize: '13px', color: 'var(--stone)' }}>No detailed objection comments pinned.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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
