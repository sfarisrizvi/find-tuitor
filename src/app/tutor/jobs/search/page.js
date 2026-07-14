'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Input } from '../../../../components/ui/Input';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Lock,
  Briefcase,
  Zap,
  CheckCircle2,
  User,
  Users,
  GraduationCap
} from 'lucide-react';
import { createClient } from '../../../../utils/supabase/client';

const GRADE_SUBJECTS = {
  'Primary': ['Mathematics', 'English', 'Science', 'Urdu', 'Islamiyat', 'General Knowledge'],
  'Secondary': ['Mathematics', 'English', 'General Science', 'Urdu', 'Islamiyat', 'Social Studies', 'Computer Science'],
  'Matric': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu'],
  'FSc': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu'],
  'O-Level': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Islamiyat', 'Pakistan Studies'],
  'A-Level': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounting', 'Economics', 'Business Studies'],
  'University': ['Calculus', 'Computer Programming', 'Data Structures', 'Organic Chemistry', 'Physics', 'English Literature', 'Microeconomics']
};

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Faisalabad',
  'Multan', 'Gujranwala', 'Sialkot', 'Quetta', 'Hyderabad', 'Abbottabad'
];

const GENDERS = ['Male', 'Female', 'Any'];
const LEVELS = ['Primary', 'Secondary', 'Matric', 'FSc', 'O-Level', 'A-Level', 'University'];
const MODES = [
  { id: 'online', label: 'Online / Remote' },
  { id: 'home_tuition', label: 'Home Tuition (Student\'s Home)' },
  { id: 'tutor_home', label: 'Tutor\'s Home' }
];

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
  },
  {
    id: 'job-mock-7',
    title: 'Matric Maths Physical Class in Gulshan',
    subject: 'Mathematics',
    grade_level: 'Matric',
    mode: 'home_tuition',
    city: 'Karachi',
    gender_preference: 'Male',
    budget_amount: '14000',
    budget_type: 'fixed',
    status: 'open',
    verified_required: true,
    immediate_hiring: false,
    description: 'Requires physical presence in Gulshan-e-Iqbal Karachi. Focus on matric board theorems, algebraic exercises, and trigonometry sections.',
    duration: '3-6 months',
    experience_level: 'Intermediate',
    hours_per_week: 12,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-8',
    title: 'MDCAT Physics Crash Course Online',
    subject: 'Physics',
    grade_level: 'FSc',
    mode: 'online',
    city: 'Peshawar',
    gender_preference: 'Any',
    budget_amount: '4000',
    budget_type: 'hourly',
    status: 'open',
    verified_required: false,
    immediate_hiring: true,
    description: 'Need an entry test physics specialist. Focus on short methods to solve MCQs on electricity, mechanics, and wave dynamics. Direct student coaching.',
    duration: '1-3 months',
    experience_level: 'Expert',
    hours_per_week: 16,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-mock-9',
    title: 'Primary Grade English Grammar Specialist',
    subject: 'English',
    grade_level: 'Primary',
    mode: 'home_tuition',
    city: 'Peshawar',
    gender_preference: 'Female',
    budget_amount: '10000',
    budget_type: 'fixed',
    status: 'open',
    verified_required: false,
    immediate_hiring: false,
    description: 'Hayatabad Phase 3. Seeking a home teacher to improve reading speed, grammar parts of speech, and spelling vocabulary for a Grade 4 girl student.',
    duration: '6+ months',
    experience_level: 'Beginner',
    hours_per_week: 8,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') || '';
  const initialQuery = searchParams.get('query') || '';
  const initialCity = searchParams.get('city') || '';

  const [dbJobs, setDbJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [tutorCity, setTutorCity] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('default');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [filters, setFilters] = useState({
    city: initialCity,
    gender: '',
    modes: initialMode ? [initialMode] : [],
    levels: [],
    subjects: [],
    min_price: '',
    max_price: '',
    verified: false,
    immediate_hiring: false
  });

  // Modal States
  const [activeJobForApply, setActiveJobForApply] = useState(null);
  const [bidType, setBidType] = useState('fixed');
  const [bidAmount, setBidAmount] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [bookDemoLink, setBookDemoLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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
          .order('created_at', { ascending: false });

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

  // Merge live jobs and mock jobs
  const allJobs = [...dbJobs];
  MOCK_JOBS.forEach(mock => {
    if (allJobs.length < 15 && !allJobs.some(j => j.title.toLowerCase() === mock.title.toLowerCase())) {
      allJobs.push(mock);
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilterArray = (key, val) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const updated = arr.includes(val) ? arr.filter(item => item !== val) : [...arr, val];
      return { ...prev, [key]: updated };
    });
  };

  const toggleLevel = (lvl) => {
    setFilters(prev => {
      const levels = prev.levels.includes(lvl) ? prev.levels.filter(l => l !== lvl) : [...prev.levels, lvl];
      let validSubjects = [];
      if (levels.length > 0) {
        const unique = new Set();
        levels.forEach(l => (GRADE_SUBJECTS[l] || []).forEach(s => unique.add(s)));
        validSubjects = Array.from(unique);
      }
      const subjects = prev.subjects.filter(s => validSubjects.includes(s));
      return { ...prev, levels, subjects };
    });
  };

  // Filter Jobs logic
  const filteredJobs = allJobs.filter(job => {
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      const match = job.title.toLowerCase().includes(query) ||
        job.subject.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.city.toLowerCase().includes(query);
      if (!match) return false;
    }
    if (filters.city && job.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.gender && filters.gender !== 'Any') {
      if (job.gender_preference !== 'Any' && job.gender_preference !== filters.gender) return false;
    }
    if (filters.modes.length > 0 && !filters.modes.includes(job.mode)) return false;
    if (filters.levels.length > 0 && !filters.levels.includes(job.grade_level)) return false;
    if (filters.subjects.length > 0 && !filters.subjects.includes(job.subject)) return false;
    if (filters.verified && !job.verified_required) return false;
    if (filters.immediate_hiring && !job.immediate_hiring) return false;

    const price = parseFloat(job.budget_amount) || 0;
    if (filters.min_price && price < parseFloat(filters.min_price)) return false;
    if (filters.max_price && price > parseFloat(filters.max_price)) return false;

    return true;
  });

  // Sorting
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return (parseFloat(a.budget_amount) || 0) - (parseFloat(b.budget_amount) || 0);
    }
    if (sortBy === 'price_desc') {
      return (parseFloat(b.budget_amount) || 0) - (parseFloat(a.budget_amount) || 0);
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

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
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>

      {/* Click-away overlay to dismiss dropdowns */}
      {(showCityDropdown || showGenderDropdown || showSortDropdown) && (
        <div
          onClick={() => {
            setShowCityDropdown(false);
            setShowGenderDropdown(false);
            setShowSortDropdown(false);
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 35, backgroundColor: 'transparent' }}
        />
      )}

      {/* Search Responsive CSS */}
      <style>{`
        .search-topbar-desktop { display: flex; }
        .search-topbar-mobile { display: none; }
        .sidebar-filters-desktop { display: flex; }
        .mobile-filter-overlay { display: none; }
        .jobs-results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .search-topbar-desktop { display: none !important; }
          .search-topbar-mobile { display: flex !important; }
          .sidebar-filters-desktop { display: none !important; }
          .mobile-filter-overlay { display: flex !important; }
          .search-main-layout {
            flex-direction: column !important;
            padding: 16px !important;
            gap: 16px !important;
          }
        }
        .dropdown-item:hover {
          background-color: var(--brand-green-soft) !important;
          color: var(--brand-green-dark) !important;
        }
      `}</style>

      {/* Sticky Filters topbar for desktop */}
      <div className="search-topbar-desktop" style={{
        backgroundColor: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline-strong)',
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
          {/* Custom City Selection Dropdown */}
          <div style={{ position: 'relative', minWidth: '160px' }}>
            <button
              onClick={() => { setShowCityDropdown(!showCityDropdown); setShowGenderDropdown(false); }}
              style={{
                width: '100%', height: '38px', paddingLeft: '34px', paddingRight: '28px',
                borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '13px', cursor: 'pointer', outline: 'none', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start', position: 'relative',
                textAlign: 'left', color: 'var(--ink)'
              }}
            >
              <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
              <span>{filters.city || 'Any City'}</span>
              <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: showCityDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)', color: 'var(--stone)', transition: 'transform 0.15s ease' }} />
            </button>
            {showCityDropdown && (
              <div style={{
                position: 'absolute', left: 0, top: '44px', width: '200px', maxHeight: '280px', overflowY: 'auto',
                backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--hairline-strong)',
                boxShadow: 'var(--shadow-lg)', padding: '6px 0', zIndex: 50
              }}>
                <div
                  onClick={() => { handleFilterChange('city', ''); setShowCityDropdown(false); }}
                  style={{
                    padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                    color: !filters.city ? 'var(--brand-green-dark)' : 'var(--slate)',
                    backgroundColor: !filters.city ? 'var(--brand-green-soft)' : 'transparent',
                    fontWeight: !filters.city ? 600 : 500
                  }}
                  className="dropdown-item"
                >
                  Any City
                </div>
                {PAKISTAN_CITIES.map(c => (
                  <div
                    key={c}
                    onClick={() => { handleFilterChange('city', c); setShowCityDropdown(false); }}
                    style={{
                      padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                      color: filters.city === c ? 'var(--brand-green-dark)' : 'var(--slate)',
                      backgroundColor: filters.city === c ? 'var(--brand-green-soft)' : 'transparent',
                      fontWeight: filters.city === c ? 600 : 500
                    }}
                    className="dropdown-item"
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Gender Preference Selection Dropdown */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <button
              onClick={() => { setShowGenderDropdown(!showGenderDropdown); setShowCityDropdown(false); }}
              style={{
                width: '100%', height: '38px', paddingLeft: '34px', paddingRight: '28px',
                borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '13px', cursor: 'pointer', outline: 'none', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start', position: 'relative',
                textAlign: 'left', color: 'var(--ink)'
              }}
            >
              <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
              <span>{filters.gender ? (filters.gender === 'Any' ? 'No Preference' : filters.gender + ' Only') : 'Gender'}</span>
              <ChevronDown size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: showGenderDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)', color: 'var(--stone)', transition: 'transform 0.15s ease' }} />
            </button>
            {showGenderDropdown && (
              <div style={{
                position: 'absolute', left: 0, top: '44px', width: '180px',
                backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--hairline-strong)',
                boxShadow: 'var(--shadow-lg)', padding: '6px 0', zIndex: 50
              }}>
                <div
                  onClick={() => { handleFilterChange('gender', ''); setShowGenderDropdown(false); }}
                  style={{
                    padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                    color: !filters.gender ? 'var(--brand-green-dark)' : 'var(--slate)',
                    backgroundColor: !filters.gender ? 'var(--brand-green-soft)' : 'transparent',
                    fontWeight: !filters.gender ? 600 : 500
                  }}
                  className="dropdown-item"
                >
                  Gender
                </div>
                {GENDERS.map(g => (
                  <div
                    key={g}
                    onClick={() => { handleFilterChange('gender', g); setShowGenderDropdown(false); }}
                    style={{
                      padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
                      color: filters.gender === g ? 'var(--brand-green-dark)' : 'var(--slate)',
                      backgroundColor: filters.gender === g ? 'var(--brand-green-soft)' : 'transparent',
                      fontWeight: filters.gender === g ? 600 : 500
                    }}
                    className="dropdown-item"
                  >
                    {g === 'Any' ? 'No Preference' : g + ' Only'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search bar inside header */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              placeholder="Search by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '38px', paddingLeft: '36px', fontSize: '13px', border: '1px solid var(--hairline-strong)', borderRadius: '999px', backgroundColor: '#fff' }}
            />
          </div>

          {/* Price Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', padding: '0 16px', borderRadius: '999px', border: '1px solid var(--hairline-strong)', height: '38px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)', marginRight: '2px' }}>Rs</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
              style={{ border: 'none', outline: 'none', width: '70px', fontSize: '13px', fontWeight: 500 }}
            />
            <span style={{ color: 'var(--hairline-strong)', fontSize: '14px', margin: '0 4px' }}>|</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              style={{ border: 'none', outline: 'none', width: '70px', fontSize: '13px', fontWeight: 500 }}
            />
          </div>
        </div>
      </div>

      {/* Sticky top bar for mobile */}
      <div className="search-topbar-mobile" style={{
        backgroundColor: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline-strong)',
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        padding: '12px 16px',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
          <input
            type="text"
            placeholder="Search tuition requirements..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              height: '40px', paddingLeft: '36px', fontSize: '13px',
              border: '1px solid var(--hairline-strong)', borderRadius: '999px',
              backgroundColor: '#fff', width: '100%', outline: 'none'
            }}
          />
        </div>

        <button
          onClick={() => setShowMobileFilters(true)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: filteredJobs.length > 0 ? 'var(--brand-green-dark)' : 'var(--canvas)',
            border: filteredJobs.length > 0 ? 'none' : '1px solid var(--hairline-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'
          }}
        >
          <SlidersHorizontal size={16} color={filteredJobs.length > 0 ? '#fff' : 'var(--slate)'} />
        </button>
      </div>

      {/* Main Search Panel Grid Layout */}
      <div className="search-main-layout" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', padding: '32px 24px', gap: '32px' }}>

        {/* Left Filters Sidebar */}
        <div className="sidebar-filters-desktop" style={{
          width: '280px', flexShrink: 0, flexDirection: 'column', gap: '24px',
          position: 'sticky', top: '138px', alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 170px)', overflowY: 'auto', paddingRight: '8px'
        }}>
          {/* Modes */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand-teal-deep)', marginBottom: '12px' }}>
              Teaching Mode
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MODES.map(mode => (
                <label key={mode.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={filters.modes.includes(mode.id)}
                    onChange={() => toggleFilterArray('modes', mode.id)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)' }}
                  />
                  {mode.label}
                </label>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)' }} />

          {/* Grades Levels & Collapsible Subjects */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand-teal-deep)', marginBottom: '12px' }}>
              Grades / Levels
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {LEVELS.map(lvl => {
                const isLevelChecked = filters.levels.includes(lvl);
                const lvlSubjects = GRADE_SUBJECTS[lvl] || [];
                return (
                  <div key={lvl} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={isLevelChecked}
                        onChange={() => toggleLevel(lvl)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)' }}
                      />
                      {lvl}
                    </label>

                    {isLevelChecked && (
                      <div style={{ paddingLeft: '16px', borderLeft: '1.5px solid var(--hairline-strong)', display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '7px', marginTop: '4px' }}>
                        {lvlSubjects.map(sub => (
                          <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--slate)' }}>
                            <input
                              type="checkbox"
                              checked={filters.subjects.includes(sub)}
                              onChange={() => toggleFilterArray('subjects', sub)}
                              style={{ width: '14px', height: '14px', accentColor: 'var(--brand-green-dark)' }}
                            />
                            {sub}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)' }} />

          {/* Badges / Verified Requirements */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand-teal-deep)', marginBottom: '12px' }}>
              Requirements
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)' }}
                />
                <ShieldCheck size={16} color="var(--brand-teal)" /> Verified Profiles Only
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={filters.immediate_hiring}
                  onChange={(e) => handleFilterChange('immediate_hiring', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)' }}
                />
                <Zap size={16} color="#f59e0b" /> Immediate Hiring
              </label>
            </div>
          </div>
        </div>

        {/* Right side Jobs Feed */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'sticky',
            top: '126px',
            zIndex: 30,
            backgroundColor: 'var(--surface)',
            padding: '12px 0',
            margin: '-12px 0 12px 0'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--brand-teal-deep)' }}>
              {sortedJobs.length} Tuition Jobs Found
            </h3>

            {/* Custom Sort Dropdown */}
            <div style={{ position: 'relative' }}>
              <Button
                variant="outline"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', height: '36px',
                  borderRadius: '999px', border: '1px solid var(--hairline-strong)',
                  backgroundColor: showSortDropdown ? 'var(--brand-green-soft)' : '#fff',
                  color: showSortDropdown ? 'var(--brand-green-dark)' : 'var(--slate)',
                  fontWeight: 500, fontSize: '13px', padding: '0 16px'
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Sort: {sortBy === 'price_asc' ? 'Budget: Low to High' : sortBy === 'price_desc' ? 'Budget: High to Low' : 'Newest First'}</span>
                <ChevronDown size={14} style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </Button>

              {showSortDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '44px', width: '220px',
                  backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--hairline-strong)',
                  boxShadow: 'var(--shadow-lg)', padding: '6px 0', zIndex: 50, display: 'flex', flexDirection: 'column'
                }}>
                  <div
                    onClick={() => { setSortBy('default'); setShowSortDropdown(false); }}
                    style={{
                      padding: '10px 16px', fontSize: '13px', cursor: 'pointer',
                      color: sortBy === 'default' ? 'var(--brand-green-dark)' : 'var(--slate)',
                      backgroundColor: sortBy === 'default' ? 'var(--brand-green-soft)' : 'transparent',
                      fontWeight: sortBy === 'default' ? 600 : 500
                    }}
                    className="dropdown-item"
                  >
                    Newest First
                  </div>
                  <div
                    onClick={() => { setSortBy('price_asc'); setShowSortDropdown(false); }}
                    style={{
                      padding: '10px 16px', fontSize: '13px', cursor: 'pointer',
                      color: sortBy === 'price_asc' ? 'var(--brand-green-dark)' : 'var(--slate)',
                      backgroundColor: sortBy === 'price_asc' ? 'var(--brand-green-soft)' : 'transparent',
                      fontWeight: sortBy === 'price_asc' ? 600 : 500
                    }}
                    className="dropdown-item"
                  >
                    Budget: Low to High
                  </div>
                  <div
                    onClick={() => { setSortBy('price_desc'); setShowSortDropdown(false); }}
                    style={{
                      padding: '10px 16px', fontSize: '13px', cursor: 'pointer',
                      color: sortBy === 'price_desc' ? 'var(--brand-green-dark)' : 'var(--slate)',
                      backgroundColor: sortBy === 'price_desc' ? 'var(--brand-green-soft)' : 'transparent',
                      fontWeight: sortBy === 'price_desc' ? 600 : 500
                    }}
                    className="dropdown-item"
                  >
                    Budget: High to Low
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--steel)' }}>Loading tuition requirements...</p>
            </div>
          ) : sortedJobs.length === 0 ? (
            <Card style={{ padding: '64px 24px', textAlign: 'center', border: '1px dashed var(--hairline-strong)' }}>
              <h4 style={{ color: 'var(--steel)', fontWeight: 600, marginBottom: '8px' }}>No Tuition Requests Found</h4>
              <p style={{ color: 'var(--stone)', fontSize: '14px', margin: 0 }}>Try clearing filters or adapting your search keywords.</p>
            </Card>
          ) : (
            <div className="jobs-results-grid">
              {sortedJobs.map((job) => {
                const isHourly = job.budget_type === 'hourly';
                return (
                  <Card
                    key={job.id}
                    style={{
                      padding: '28px',
                      border: '1px solid var(--hairline-strong)',
                      backgroundColor: 'var(--canvas)',
                      boxShadow: 'var(--shadow-subtle)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Badge variant={job.mode === 'online' ? 'purple' : 'green-soft'}>
                          {job.mode === 'online' ? 'Remote / Online' : job.mode === 'tutor_home' ? 'At Tutor\'s Home' : 'Physical Home Tuition'}
                        </Badge>
                        {job.verified_required && (
                          <Badge variant="blue" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={11} /> Verified Parent
                          </Badge>
                        )}
                        {job.immediate_hiring && (
                          <Badge variant="popular" style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                            <Zap size={11} /> Immediate Hiring
                          </Badge>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 500 }}>
                        {getRelativeTime(job.created_at)}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-teal-deep)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                      {job.title}
                    </h3>

                    {/* Upwork Style Key Specs */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--hairline-soft)',
                      marginBottom: '20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} color="var(--brand-green-dark)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>
                            Rs {parseInt(job.budget_amount).toLocaleString()} {isHourly ? '/ hr' : '/ month'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--stone)' }}>{isHourly ? 'Hourly Rate' : 'Fixed Monthly Budget'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="var(--brand-green-dark)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{job.hours_per_week} hrs/week</div>
                          <div style={{ fontSize: '11px', color: 'var(--stone)' }}>Estimated Schedule</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="var(--brand-green-dark)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{job.duration}</div>
                          <div style={{ fontSize: '11px', color: 'var(--stone)' }}>Contract Duration</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GraduationCap size={16} color="var(--brand-green-dark)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{job.grade_level}</div>
                          <div style={{ fontSize: '11px', color: 'var(--stone)' }}>Grade / Level</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="var(--brand-green-dark)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{job.city}</div>
                          <div style={{ fontSize: '11px', color: 'var(--stone)' }}>Location Address</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="var(--brand-green-dark)" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{job.gender_preference === 'Any' ? 'Any Gender' : job.gender_preference + ' Tutor'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--stone)' }}>Tutor Preference</div>
                        </div>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '14.5px', color: 'var(--slate)', lineHeight: '1.6', marginBottom: '20px',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {job.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--hairline)', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--brand-teal-deep)', backgroundColor: 'var(--hairline-strong)', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
                          {job.subject}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--brand-teal-deep)', backgroundColor: 'var(--hairline-strong)', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
                          {job.grade_level}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleApplyClick(job)}
                        variant="primary"
                        style={{
                          backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)',
                          fontWeight: 700, padding: '10px 24px', fontSize: '14px', borderRadius: '999px',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                    <Link href={`/login?next=/tutor/jobs/search`}>
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

      {/* Mobile filter Overlay Sheet */}
      {showMobileFilters && (
        <div className="mobile-filter-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ flex: 1 }} onClick={() => setShowMobileFilters(false)} />
          <div style={{
            backgroundColor: 'var(--canvas)', borderRadius: '24px 24px 0 0',
            maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px 32px 20px',
            animation: 'slideUp 0.3s ease', boxShadow: '0 -8px 30px rgba(0,0,0,0.12)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Advanced Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                  backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* City */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal-deep)', textTransform: 'uppercase', marginBottom: '8px' }}>City</label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  borderRadius: '8px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                  fontSize: '14px', outline: 'none'
                }}
              >
                <option value="">Any City</option>
                {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Gender Preference */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal-deep)', textTransform: 'uppercase', marginBottom: '8px' }}>Gender Preference</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  borderRadius: '8px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                  fontSize: '14px', outline: 'none'
                }}
              >
                <option value="">Gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Modes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal-deep)', textTransform: 'uppercase', marginBottom: '8px' }}>Teaching Modes</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MODES.map(mode => (
                  <label key={mode.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filters.modes.includes(mode.id)}
                      onChange={() => toggleFilterArray('modes', mode.id)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)' }}
                    />
                    {mode.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing range */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal-deep)', textTransform: 'uppercase', marginBottom: '8px' }}>Budget Range</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                />
              </div>
            </div>

            {/* Requirements */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--brand-teal-deep)', textTransform: 'uppercase', marginBottom: '8px' }}>Requirements</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Verified Only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.immediate_hiring}
                    onChange={(e) => handleFilterChange('immediate_hiring', e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Immediate Hiring
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setFilters({
                    city: '', gender: '', modes: [], levels: [], subjects: [], min_price: '', max_price: '', verified: false, immediate_hiring: false
                  });
                  setShowMobileFilters(false);
                }}
                style={{
                  flex: 1, height: '44px', borderRadius: '8px', border: '1px solid var(--hairline-strong)',
                  backgroundColor: '#fff', fontSize: '14px', fontWeight: 600, color: 'var(--slate)', cursor: 'pointer'
                }}
              >
                Reset All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                style={{
                  flex: 1, height: '44px', borderRadius: '8px', border: 'none',
                  backgroundColor: 'var(--brand-green-dark)', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function FindJobsSearch() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--steel)' }}>Loading search feed...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
