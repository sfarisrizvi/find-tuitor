'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, MapPin, Star, ShieldCheck, Lock, ChevronDown,
  Award, BookOpen, Zap, SlidersHorizontal, User, ArrowUpDown, X,
  MessageSquare, Coins, AlertCircle
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';
import { TehsilSelector } from '../../../components/ui/TehsilSelector';

const getHeadingText = (tutor) => {
  const role = tutor.current_role;
  const company = tutor.current_company;
  const qual = tutor.qualification;

  let part1 = '';
  if (role && company) {
    part1 = `${role} at ${company}`;
  } else if (role) {
    part1 = role;
  } else if (company) {
    part1 = company;
  }

  let part2 = '';
  if (qual) {
    part2 = `${qual} Qualified`;
  }

  if (part1 && part2) {
    return `${part1} & ${part2}`;
  }
  return part1 || part2 || null;
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || '';
  const initialQuery = searchParams.get('query') || '';

  const parseLevelsFromParam = (param) => {
    if (!param) return [];
    if (param === 'University' || param === 'BS/MS') return ['BS/MS'];
    if (param.includes('Inter') || param.includes('O\'Levels')) return ['Inter'];
    return [param];
  };

  const initialLevelParam = searchParams.get('level') || searchParams.get('levels') || '';
  const initialLevels = parseLevelsFromParam(initialLevelParam);

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Book Demo & Chat Spend State
  const [demoModalTutor, setDemoModalTutor] = useState(null);
  const [checkingDemoTutorId, setCheckingDemoTutorId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [spendError, setSpendError] = useState(null);
  const [isConfirmingSpend, setIsConfirmingSpend] = useState(false);

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/teacher-media/${path}`;
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filters, setFilters] = useState({
    city: initialCity,
    subjects: [], // Array for multiple subjects selection
    custom_subject: '',
    levels: initialLevels, // Array for multiple levels selection
    min_price: '',
    max_price: '',
    gender: '',
    min_experience: [], // Array for multiple selection
    verified: false,
    immediate_hiring: false,
    modes: []
  });

  const LEVEL_SUBJECTS = {
    'Matric': ['Arts', 'Biology', 'Computer'],
    'Inter': ['Arts', 'Pre-Engineering', 'Pre-Medical', 'Commerce', 'ICs', 'O Levels'],
    'BS/MS': [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Urdu', 'AI', 'Digital Marketing',
      'Data Science', 'Software Engineering', 'Cybersecurity', 'Information Technology', 'Electrical Engineering',
      'Mechanical Engineering', 'Civil Engineering', 'Biotechnology', 'Environmental Sciences', 'Psychology',
      'Sociology', 'Economics', 'Business Administration', 'Finance & Accounting', 'Mass Communication',
      'International Relations', 'Political Science', 'Statistics', 'Architecture', 'Fine Arts', 'Other'
    ]
  };

  const LEVELS = ['Kindergarten', 'Primary', 'Secondary', 'Matric', 'Inter', 'BS/MS'];
  const GENDERS = ['Male', 'Female'];
  const MODES = [
    { id: 'online', label: 'Online' },
    { id: 'home_tuition', label: 'Home Tuition' },
    { id: 'tutor_home', label: 'Tutor Home' }
  ];

  // Debounce search query by 1000ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Helper to dynamically get subjects by level
  const getSubjectOptions = (level) => {
    if (!level) return [];
    return LEVEL_SUBJECTS[level] || [];
  };

  const fetchTutors = async (currentFilters = filters) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Resolve min experience threshold from selected checkboxes
      const expVals = (currentFilters.min_experience || []).map(e => parseInt(e)).filter(e => !isNaN(e));
      const resolvedMinExp = expVals.length > 0 ? Math.min(...expVals) : null;

      const rpcParams = {
        p_city: currentFilters.city || null,
        p_subjects: null,
        p_levels: currentFilters.levels && currentFilters.levels.length > 0 ? currentFilters.levels : null,
        p_gender: currentFilters.gender || null,
        p_verified: currentFilters.verified ? true : null,
        p_immediate_hiring: currentFilters.immediate_hiring ? true : null,
        p_min_price: currentFilters.min_price ? parseFloat(currentFilters.min_price) : null,
        p_max_price: currentFilters.max_price ? parseFloat(currentFilters.max_price) : null,
        p_min_experience: resolvedMinExp,
        p_modes: currentFilters.modes.length > 0 ? currentFilters.modes : null
      };

      console.log('[DEBUG] Calling search_tutors RPC with params:', rpcParams);
      const { data, error } = await supabase.rpc('search_tutors', rpcParams);

      if (error) {
        console.error("Error fetching tutors:", error);
        setTutors([]);
      } else {
        console.log('[DEBUG] Search results loaded:', data?.length);
        setTutors(data || []);
      }
    } catch (err) {
      console.error("Exception in fetchTutors:", err);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const rawLevel = searchParams.get('level') || searchParams.get('levels') || '';
      const city = searchParams.get('city') || '';
      const query = searchParams.get('query') || '';

      const parsedLevels = parseLevelsFromParam(rawLevel);

      const currentFilters = {
        ...filters,
        city: city || filters.city,
        levels: parsedLevels.length > 0 ? parsedLevels : filters.levels,
      };

      setFilters(currentFilters);
      if (query) setSearchQuery(query);
      fetchTutors(currentFilters);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleBookDemo = async (tutor) => {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 1. If not authenticated, redirect to login
    if (!currentUser) {
      router.push(`/login?next=${encodeURIComponent('/find-tutor/search')}`);
      return;
    }

    // 2. Prevent messaging own profile
    if (currentUser.id === tutor.id) {
      alert("You cannot book a demo with your own profile.");
      return;
    }

    setCheckingDemoTutorId(tutor.id);
    setSpendError(null);

    try {
      // 3. Check if conversation already exists between this user and tutor
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${currentUser.id},tutor_id.eq.${tutor.id}),and(client_id.eq.${tutor.id},tutor_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (existingConv) {
        // Conversation already exists -> open chat directly without spending credits
        setCheckingDemoTutorId(null);
        router.push(`/client/messages?tutorId=${tutor.id}`);
        return;
      }

      // 4. Fetch user's wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      const balance = wallet ? Number(wallet.balance) : 0;
      setWalletBalance(balance);
      setDemoModalTutor(tutor);
    } catch (err) {
      console.error('Error checking demo chat state:', err);
      router.push(`/client/messages?tutorId=${tutor.id}`);
    } finally {
      setCheckingDemoTutorId(null);
    }
  };

  const handleConfirmSpend = async () => {
    if (!demoModalTutor) return;
    setIsConfirmingSpend(true);
    setSpendError(null);

    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userId = currentUser?.id || session?.user?.id;

      if (!userId) {
        router.push(`/login?next=${encodeURIComponent('/find-tutor/search')}`);
        return;
      }

      // 1. Deduct 100 credits via RPC
      const { data: deductRes, error: deductErr } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: 100,
        p_type: 'chat_initiation',
        p_description: `Initiated demo chat with ${demoModalTutor.full_name || 'tutor'} (100 credits)`,
        p_reference_id: demoModalTutor.id
      });

      if (deductErr || (deductRes && !deductRes.success)) {
        setSpendError(deductRes?.error || deductErr?.message || 'Insufficient credits or deduction failed.');
        setIsConfirmingSpend(false);
        return;
      }

      // 2. Create conversation
      await supabase
        .from('conversations')
        .insert({
          client_id: userId,
          tutor_id: demoModalTutor.id,
          initiated_by: userId,
          last_message: 'Demo class inquiry initiated',
          last_message_at: new Date().toISOString()
        });

      const tutorId = demoModalTutor.id;
      setDemoModalTutor(null);
      setIsConfirmingSpend(false);
      router.push(`/client/messages?tutorId=${tutorId}`);
    } catch (err) {
      console.error('Error confirming demo chat spend:', err);
      setSpendError('An unexpected error occurred. Please try again.');
      setIsConfirmingSpend(false);
    }
  };

  const handleFilterChange = (key, value) => {
    let newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    fetchTutors(newFilters);
  };

  const toggleExperience = (val) => {
    let newExps = [...filters.min_experience];
    if (val === '') {
      newExps = [];
    } else {
      if (newExps.includes(val)) {
        newExps = newExps.filter(e => e !== val);
      } else {
        newExps.push(val);
      }
    }
    handleFilterChange('min_experience', newExps);
  };

  const toggleLevel = (lvl) => {
    let newLevels = [...filters.levels];
    if (newLevels.includes(lvl)) {
      newLevels = newLevels.filter(l => l !== lvl);
    } else {
      newLevels.push(lvl);
    }

    let newFilters = { ...filters, levels: newLevels };

    // Clean up checked subjects if they are no longer in valid subject options
    let validSubjects = [];
    if (newLevels.length > 0) {
      const unique = new Set();
      newLevels.forEach(l => getSubjectOptions(l).forEach(s => unique.add(s)));
      validSubjects = Array.from(unique);
    } else {
      validSubjects = getSubjectOptions('');
    }

    newFilters.subjects = filters.subjects.filter(s => validSubjects.includes(s));
    if (!newFilters.subjects.includes('Other')) {
      newFilters.custom_subject = '';
    }

    setFilters(newFilters);
    setPage(1);
    fetchTutors(newFilters);
  };

  const toggleSubjectFilter = (subj) => {
    let newSubjects = [...filters.subjects];
    if (newSubjects.includes(subj)) {
      newSubjects = newSubjects.filter(s => s !== subj);
    } else {
      newSubjects.push(subj);
    }

    let newFilters = { ...filters, subjects: newSubjects };
    if (!newSubjects.includes('Other')) {
      newFilters.custom_subject = '';
    }

    setFilters(newFilters);
    setPage(1);
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

  // Client-side text keyword and dynamic nested categories filter
  const filteredTutors = tutors.filter(tutor => {
    let matchesQuery = true;
    if (debouncedQuery) {
      const lowerQuery = debouncedQuery.toLowerCase();
      matchesQuery = (
        (tutor.full_name && tutor.full_name.toLowerCase().includes(lowerQuery)) ||
        (tutor.bio && tutor.bio.toLowerCase().includes(lowerQuery)) ||
        (tutor.about && tutor.about.toLowerCase().includes(lowerQuery)) ||
        (tutor.categories && Array.isArray(tutor.categories) && tutor.categories.some(c => c.subject && c.subject.toLowerCase().includes(lowerQuery)))
      );
    }

    if (!matchesQuery) return false;

    // Nested Levels/Subjects Filter Logic
    if (filters.levels.length > 0) {
      const matchesAnyCheckedLevel = filters.levels.some(lvl => {
        const teachesLevel = tutor.categories?.some(c => c.level === lvl);
        if (!teachesLevel) return false;

        const levelSubjects = LEVEL_SUBJECTS[lvl] || [];
        const checkedSubsForLvl = filters.subjects.filter(s => levelSubjects.includes(s));

        // If no subjects are checked under this level, tutor matches by teaching the level
        if (checkedSubsForLvl.length === 0) return true;

        // If subjects are checked under this level, tutor must teach at least one of those subjects
        const teachesAnyCheckedSubject = tutor.categories?.some(c =>
          c.level === lvl && checkedSubsForLvl.includes(c.subject)
        );

        // Special custom subject checks for BS/MS 'Other'
        if (lvl === 'BS/MS' && checkedSubsForLvl.includes('Other') && filters.custom_subject) {
          const text = filters.custom_subject.toLowerCase().trim();
          const isMathRelated = text.includes('algebra') || text.includes('calculus') || text.includes('math') || text.includes('linear') || text.includes('stat');
          const isPhysicsRelated = text.includes('physic') || text.includes('mechanic') || text.includes('thermo') || text.includes('quantum');
          const isChemistryRelated = text.includes('chem') || text.includes('organic');

          const tutorSubjects = tutor.categories?.filter(c => c.level === 'BS/MS').map(c => c.subject?.toLowerCase()) || [];

          let matchesCustom = false;
          if (isMathRelated && tutorSubjects.includes('mathematics')) {
            matchesCustom = true;
          } else if (isPhysicsRelated && tutorSubjects.includes('physics')) {
            matchesCustom = true;
          } else if (isChemistryRelated && tutorSubjects.includes('chemistry')) {
            matchesCustom = true;
          } else {
            matchesCustom = (
              tutor.bio?.toLowerCase().includes(text) ||
              tutor.qualification?.toLowerCase().includes(text) ||
              tutorSubjects.some(s => s && s.includes(text))
            );
          }
          if (matchesCustom) return true;
        }

        return teachesAnyCheckedSubject;
      });

      if (!matchesAnyCheckedLevel) return false;
    }

    // Hard exclusion: Must have completed onboarding, and non-dummy profiles must have approved KYC
    if (tutor.onboarding_complete === false) return false;
    const isMock = Boolean(tutor.is_dummy || tutor.id?.startsWith('mock-') || tutor.full_name?.startsWith('Sir ') || tutor.full_name?.startsWith('Miss ') || tutor.full_name?.startsWith('Mr. Tutor') || tutor.full_name?.startsWith('Miss Tutor'));
    if (!isMock && tutor.kyc_status !== 'approved') return false;

    return true;
  });

  const calculateRelevanceScore = (tutor) => {
    const cleanQuery = (debouncedQuery || '').trim().toLowerCase();

    // 1. Keyword Relevancy (40% Weightage)
    let keywordScore = 100;
    if (cleanQuery.length > 0) {
      const tokens = cleanQuery.split(/\s+/).filter(Boolean);
      const fullName = (tutor.full_name || '').toLowerCase();
      const qual = (tutor.qualification || '').toLowerCase();
      const role = (tutor.current_role || '').toLowerCase();
      const company = (tutor.current_company || '').toLowerCase();
      const bio = (tutor.bio || '').toLowerCase();
      const about = (tutor.about || '').toLowerCase();
      const subjects = (tutor.categories || [])
        .map(c => `${c.subject || ''} ${c.level || ''}`.toLowerCase())
        .join(' ');

      if (fullName === cleanQuery) {
        keywordScore = 100;
      } else if (fullName.includes(cleanQuery)) {
        keywordScore = 95;
      } else {
        let matchedScores = [];
        for (const token of tokens) {
          if (fullName.includes(token)) matchedScores.push(90);
          else if (qual.includes(token)) matchedScores.push(85);
          else if (role.includes(token) || company.includes(token)) matchedScores.push(80);
          else if (subjects.includes(token)) matchedScores.push(80);
          else if (bio.includes(token) || about.includes(token)) matchedScores.push(65);
          else matchedScores.push(20);
        }
        const sum = matchedScores.reduce((acc, val) => acc + val, 0);
        keywordScore = Math.min(100, sum / tokens.length);
      }
    }

    // 2. Rating & Reviews (25% Weightage)
    let ratingScore = 20;
    const numRating = tutor.rating != null ? parseFloat(tutor.rating) : 0;
    const numReviews = tutor.reviews_count || 0;
    if (numReviews > 0 && numRating > 0) {
      const baseVal = (numRating / 5.0) * 80;
      const reviewBonus = Math.min(numReviews * 2, 20);
      ratingScore = Math.min(100, baseVal + reviewBonus);
    }

    // 3. Verified Status (25% Weightage - Premium verified badge ranks higher)
    const verifiedScore = tutor.verified ? 100 : 0;

    // 4. Profile Completeness (20% Weightage - photo, bio, rate)
    let completeness = 0;
    if (tutor.avatar_url) completeness += 40;
    if (tutor.bio && tutor.bio.length >= 20) completeness += 30;
    if (tutor.hourly_rate && parseFloat(tutor.hourly_rate) > 0) completeness += 30;

    // Composite Weighted Sum
    return (keywordScore * 0.30) + (ratingScore * 0.25) + (verifiedScore * 0.25) + (completeness * 0.20);
  };

  const sortedTutors = [...filteredTutors].sort((a, b) => {
    // 1. Real tutors always stay on top; dummy profiles always stay on bottom
    const aDummy = Boolean(a.is_dummy || a.id?.startsWith('mock-') || a.full_name?.startsWith('Sir ') || a.full_name?.startsWith('Miss ') || a.full_name?.startsWith('Mr. Tutor') || a.full_name?.startsWith('Miss Tutor'));
    const bDummy = Boolean(b.is_dummy || b.id?.startsWith('mock-') || b.full_name?.startsWith('Sir ') || b.full_name?.startsWith('Miss ') || b.full_name?.startsWith('Mr. Tutor') || b.full_name?.startsWith('Miss Tutor'));

    if (aDummy !== bDummy) {
      return aDummy ? 1 : -1;
    }

    // 2. Secondary sort within each group
    if (sortBy === 'price_asc') {
      return (a.hourly_rate || 0) - (b.hourly_rate || 0);
    }
    if (sortBy === 'price_desc') {
      return (b.hourly_rate || 0) - (a.hourly_rate || 0);
    }
    // Default: Sort by composite relevancy score
    const scoreDiff = calculateRelevanceScore(b) - calculateRelevanceScore(a);
    if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

    // Tie-breaker: New profiles start ranking from bottom (older established profiles first)
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return aDate - bDate;
  });

  const paginatedTutors = sortedTutors.slice(0, page * pageSize);
  const displayedTutors = session ? paginatedTutors : paginatedTutors.slice(0, 8);
  const hasMore = session && paginatedTutors.length < sortedTutors.length;
  const showAuthOverlay = !session && filteredTutors.length > 7;

  // Count active filters for the badge
  const activeFilterCount = [
    filters.city,
    filters.gender,
    filters.levels.length > 0,
    filters.subjects.length > 0,
    filters.modes.length > 0,
    filters.verified,
    filters.immediate_hiring,
    filters.min_price,
    filters.max_price,
    filters.min_experience.length > 0
  ].filter(Boolean).length;

  // Mobile filter modal state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Embedded responsive styles */}
      <style>{`
        /* ─── DESKTOP TOP BAR ─── */
        .search-topbar-desktop { display: flex; }
        .search-topbar-mobile { display: none; }
        .sidebar-filters-desktop { display: flex; }
        .mobile-filter-overlay { display: none; }

        .tutor-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 24px;
        }

        @media (max-width: 768px) {
          .search-topbar-desktop { display: none !important; }
          .search-topbar-mobile { display: flex !important; }
          .sidebar-filters-desktop { display: none !important; }
          .mobile-filter-overlay { display: flex !important; }

          .tutor-results-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .search-main-layout {
            flex-direction: column !important;
            padding: 16px !important;
            gap: 0 !important;
          }

          .search-results-area {
            width: 100% !important;
          }
        }
      `}</style>

      {/* ─── DESKTOP TOP BAR ─── */}
      <div className="search-topbar-desktop" style={{
        backgroundColor: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline-strong)',
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
          {/* City Dropdown */}
          <div style={{ position: 'relative', width: '165px', flexShrink: 0 }}>
            <TehsilSelector
              value={filters.city}
              onChange={(payload, formatted) => handleFilterChange('city', payload ? (payload.tehsil || formatted) : '')}
              placeholder="Any Tehsil / City"
              allowAll={true}
              allOptionLabel="Any Tehsil"
              showQuickGps={false}
              triggerStyle={{
                minHeight: '40px',
                height: '40px',
                borderRadius: '999px',
                padding: '0 12px',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Gender Dropdown */}
          <div style={{ position: 'relative', width: '135px', flexShrink: 0 }}>
            <User size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              style={{
                width: '100%', height: '40px', paddingLeft: '32px', paddingRight: '24px',
                borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '13px', cursor: 'pointer', outline: 'none', appearance: 'none', fontWeight: 500,
                color: 'var(--ink)'
              }}
            >
              <option value="">Gender</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
          </div>

          {/* Search query input */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              placeholder="Search by keyword, subject, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '40px', paddingLeft: '36px', fontSize: '14px', border: '1px solid var(--hairline-strong)', borderRadius: '999px', backgroundColor: '#fff' }}
            />
          </div>
        </div>
      </div>

      {/* ─── MOBILE TOP BAR: Search + Filter Icon ─── */}
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
        {/* Search Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
          <Input
            placeholder="Search tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              height: '44px', paddingLeft: '36px', fontSize: '14px',
              border: '1px solid var(--hairline-strong)', borderRadius: '999px',
              backgroundColor: '#fff', width: '100%'
            }}
          />
        </div>

        {/* Rounded Filter Funnel Icon */}
        <button
          onClick={() => setShowMobileFilters(true)}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: activeFilterCount > 0 ? 'var(--brand-green-dark)' : 'var(--canvas)',
            border: activeFilterCount > 0 ? 'none' : '1px solid var(--hairline-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          <SlidersHorizontal size={18} color={activeFilterCount > 0 ? '#fff' : 'var(--slate)'} />
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              backgroundColor: 'var(--brand-green)', color: 'var(--brand-teal-deep)',
              width: '20px', height: '20px', borderRadius: '50%',
              fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── MOBILE FILTER MODAL (Slide-up) ─── */}
      {showMobileFilters && (
        <div className="mobile-filter-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, flexDirection: 'column',
          backgroundColor: 'rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>

          {/* Backdrop tap to close */}
          <div style={{ flex: 1 }} onClick={() => setShowMobileFilters(false)} />

          {/* Modal Content */}
          <div style={{
            backgroundColor: 'var(--canvas)', borderRadius: '24px 24px 0 0',
            maxHeight: '85vh', overflowY: 'auto',
            padding: '24px 20px 32px 20px',
            animation: 'slideUp 0.3s ease',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.12)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'var(--surface)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '18px', color: 'var(--slate)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tehsil / City */}
            <div style={{ marginBottom: '20px' }}>
              <TehsilSelector
                value={filters.city}
                onChange={(payload, formatted) => handleFilterChange('city', payload ? (payload.tehsil || formatted) : '')}
                placeholder="Any Tehsil / City"
                label="Tehsil / City"
                allowAll={true}
                allOptionLabel="Any Tehsil"
                triggerStyle={{
                  height: '44px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  padding: '0 14px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Gender */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  style={{
                    width: '100%', height: '44px', paddingLeft: '36px', paddingRight: '12px',
                    borderRadius: '12px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                    fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none'
                  }}
                >
                  <option value="">Any Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)', margin: '8px 0 20px 0' }} />

            {/* Grade / Level */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade / Level</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {LEVELS.map(lvl => {
                  const isLevelChecked = filters.levels.includes(lvl);
                  const hasSubjects = ['Matric', 'Inter', 'BS/MS'].includes(lvl);
                  const subjects = LEVEL_SUBJECTS[lvl] || [];
                  return (
                    <div key={lvl} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                        <input
                          type="checkbox"
                          checked={isLevelChecked}
                          onChange={() => toggleLevel(lvl)}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                        />
                        {lvl}
                      </label>
                      {isLevelChecked && hasSubjects && (
                        <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--hairline-strong)', marginLeft: '8px' }}>
                          {subjects.map(subj => (
                            <label key={subj} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--slate)' }}>
                              <input
                                type="checkbox"
                                checked={filters.subjects.includes(subj)}
                                onChange={() => toggleSubjectFilter(subj)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                              />
                              {subj}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)', margin: '8px 0 20px 0' }} />

            {/* Teaching Mode */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teaching Mode</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MODES.map(mode => (
                  <label key={mode.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                    <input
                      type="checkbox"
                      checked={filters.modes.includes(mode.id)}
                      onChange={() => toggleMode(mode.id)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                    />
                    {mode.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)', margin: '8px 0 20px 0' }} />

            {/* Requirements */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requirements</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                  />
                  <ShieldCheck size={16} color="var(--brand-teal)" />
                  Verified Only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={filters.immediate_hiring}
                    onChange={(e) => handleFilterChange('immediate_hiring', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                  />
                  <Zap size={16} color="#f59e0b" />
                  Immediate Hiring
                </label>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)', margin: '8px 0 20px 0' }} />

            {/* Sort */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%', height: '44px', padding: '0 12px', borderRadius: '12px',
                  border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                  fontSize: '14px', color: 'var(--slate)', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="default">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Experience</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { value: '1', label: '1+ Yrs' },
                  { value: '3', label: '3+ Yrs' },
                  { value: '5', label: '5+ Yrs' },
                  { value: '10', label: '10+ Yrs' },
                ].map((exp) => {
                  const isChecked = filters.min_experience.includes(exp.value);
                  return (
                    <button
                      key={exp.value}
                      onClick={() => toggleExperience(exp.value)}
                      style={{
                        padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500,
                        border: isChecked ? '1.5px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)',
                        backgroundColor: isChecked ? 'var(--brand-green-soft)' : '#fff',
                        color: isChecked ? 'var(--brand-green-dark)' : 'var(--slate)',
                        cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      {exp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setFilters({ city: '', subjects: [], custom_subject: '', levels: [], min_price: '', max_price: '', gender: '', min_experience: [], verified: false, immediate_hiring: false, modes: [] });
                  setSortBy('default');
                  setPage(1);
                  fetchTutors({ city: '', subjects: [], custom_subject: '', levels: [], min_price: '', max_price: '', gender: '', min_experience: [], verified: false, immediate_hiring: false, modes: [] }, 1);
                }}
                style={{
                  flex: 1, height: '48px', borderRadius: '12px',
                  border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                  fontSize: '15px', fontWeight: 600, color: 'var(--slate)', cursor: 'pointer'
                }}
              >
                Reset All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                style={{
                  flex: 1, height: '48px', borderRadius: '12px',
                  border: 'none', backgroundColor: 'var(--brand-green-dark)',
                  fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer'
                }}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN LAYOUT ─── */}
      <div className="search-main-layout" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', padding: '24px', gap: '32px' }}>

        {/* ─── LEFT SIDEBAR: ADVANCED FILTERS (desktop only) ─── */}
        <div className="sidebar-filters-desktop" style={{
          width: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'sticky',
          top: '152px',
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>

          {/* Grade / Level (with Nested Subject Checkboxes) */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade / Level</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {LEVELS.map(lvl => {
                const isLevelChecked = filters.levels.includes(lvl);
                const hasSubjects = ['Matric', 'Inter', 'BS/MS'].includes(lvl);
                const subjects = LEVEL_SUBJECTS[lvl] || [];

                return (
                  <div key={lvl} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Level Selector */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                      <input
                        type="checkbox"
                        checked={isLevelChecked}
                        onChange={() => toggleLevel(lvl)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                      />
                      {lvl}
                    </label>

                    {/* Indented Subject Checkboxes */}
                    {isLevelChecked && hasSubjects && (
                      <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--hairline-strong)', marginLeft: '7px', marginTop: '2px' }}>
                        {subjects.map(subj => {
                          const isSubChecked = filters.subjects.includes(subj);
                          return (
                            <div key={subj} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--slate)' }}>
                                <input
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={() => toggleSubjectFilter(subj)}
                                  style={{ width: '14px', height: '14px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                                />
                                {subj}
                              </label>

                              {/* Custom BS/MS Subject Field inline nested */}
                              {lvl === 'BS/MS' && subj === 'Other' && isSubChecked && (
                                <div style={{ marginTop: '2px' }}>
                                  <Input
                                    placeholder="e.g. Linear Algebra"
                                    value={filters.custom_subject}
                                    onChange={(e) => handleFilterChange('custom_subject', e.target.value)}
                                    style={{ height: '30px', fontSize: '12px', padding: '0 8px', border: '1px solid var(--hairline-strong)', borderRadius: '4px', backgroundColor: '#fff', width: '100%' }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />

          {/* Teaching Mode */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teaching Mode</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MODES.map(mode => (
                <label key={mode.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={filters.modes.includes(mode.id)}
                    onChange={() => toggleMode(mode.id)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                  />
                  {mode.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />

          {/* Badges / Checkboxes */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requirements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                />
                <ShieldCheck size={16} color="var(--brand-teal)" />
                Verified Only
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                <input
                  type="checkbox"
                  checked={filters.immediate_hiring}
                  onChange={(e) => handleFilterChange('immediate_hiring', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                />
                <Zap size={16} color="#f59e0b" />
                Immediate Hiring
              </label>
            </div>
          </div>

        </div>

        {/* ─── MAIN CONTENT: RESULTS ─── */}
        <div className="search-results-area" style={{ flex: 1, position: 'relative' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {loading ? 'Searching...' : `${filteredTutors.length} Tutors Found`}
            </h2>
            {/* Custom Popover Dropdown under Funnel/Sort trigger */}
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
                <span>Sort & Price</span>
                <ChevronDown size={14} style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </Button>

              {showSortDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '44px', width: '280px',
                  backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--hairline-strong)',
                  boxShadow: 'var(--shadow-lg)', padding: '16px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '16px'
                }}>
                  {/* Sorting */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px',
                        border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                        fontSize: '13px', color: 'var(--slate)', cursor: 'pointer', outline: 'none'
                      }}
                    >
                      <option value="default">Best Match</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--hairline)' }} />

                  {/* Price Range (Double handle range slider) */}
                  {(() => {
                    const minVal = filters.min_price ? parseInt(filters.min_price) : 1000;
                    const maxVal = filters.max_price ? parseInt(filters.max_price) : 50000;
                    const minPercent = ((minVal - 1000) / (50000 - 1000)) * 100;
                    const maxPercent = ((maxVal - 1000) / (50000 - 1000)) * 100;
                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range</label>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-green-dark)' }}>
                            Rs {minVal.toLocaleString()} - {maxVal.toLocaleString()}
                          </span>
                        </div>

                        <div style={{ position: 'relative', width: '100%', height: '28px', marginTop: '4px' }}>
                          <style>{`
                            .dual-range-input::-webkit-slider-thumb {
                              height: 18px;
                              width: 18px;
                              border-radius: 50%;
                              background: #ffffff;
                              border: 2px solid var(--brand-green-dark);
                              cursor: pointer;
                              pointer-events: auto;
                              -webkit-appearance: none;
                              box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                              position: relative;
                              z-index: 10;
                            }
                            .dual-range-input::-moz-range-thumb {
                              height: 18px;
                              width: 18px;
                              border-radius: 50%;
                              background: #ffffff;
                              border: 2px solid var(--brand-green-dark);
                              cursor: pointer;
                              pointer-events: auto;
                              box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                              position: relative;
                              z-index: 10;
                            }
                          `}</style>

                          {/* Visual track background */}
                          <div style={{
                            position: 'absolute', left: 0, right: 0, top: '11px', height: '6px',
                            backgroundColor: 'var(--hairline-strong)', borderRadius: '999px', zIndex: 1
                          }} />

                          {/* Visual track active range progress */}
                          <div style={{
                            position: 'absolute', top: '11px', height: '6px',
                            left: `${minPercent}%`, right: `${100 - maxPercent}%`,
                            backgroundColor: 'var(--brand-green-dark)', borderRadius: '999px', zIndex: 2
                          }} />

                          {/* Min Slider Thumb */}
                          <input
                            type="range"
                            min="1000"
                            max="50000"
                            step="500"
                            value={minVal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val < maxVal) {
                                handleFilterChange('min_price', val.toString());
                              }
                            }}
                            className="dual-range-input"
                            style={{
                              position: 'absolute', width: '100%', top: 0, left: 0, height: '28px',
                              background: 'none', pointerEvents: 'none', WebkitAppearance: 'none', appearance: 'none',
                              margin: 0, zIndex: 3
                            }}
                          />

                          {/* Max Slider Thumb */}
                          <input
                            type="range"
                            min="1000"
                            max="50000"
                            step="500"
                            value={maxVal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val > minVal) {
                                handleFilterChange('max_price', val.toString());
                              }
                            }}
                            className="dual-range-input"
                            style={{
                              position: 'absolute', width: '100%', top: 0, left: 0, height: '28px',
                              background: 'none', pointerEvents: 'none', WebkitAppearance: 'none', appearance: 'none',
                              margin: 0, zIndex: 4
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--stone)', marginTop: '4px' }}>
                          <span>Rs 1,000</span>
                          <span>Rs 50,000</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ height: '1px', backgroundColor: 'var(--hairline)' }} />

                  {/* Experience */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Experience</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[
                        { value: '1', label: '1+ Yrs' },
                        { value: '3', label: '3+ Yrs' },
                        { value: '5', label: '5+ Yrs' },
                        { value: '10', label: '10+ Yrs' },
                      ].map((exp) => {
                        const isChecked = filters.min_experience.includes(exp.value);
                        return (
                          <button
                            key={exp.value}
                            onClick={() => toggleExperience(exp.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 500,
                              border: isChecked ? '1.5px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)',
                              backgroundColor: isChecked ? 'var(--brand-green-soft)' : '#fff',
                              color: isChecked ? 'var(--brand-green-dark)' : 'var(--slate)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {exp.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--hairline)' }} />

                  {/* Popover Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        handleFilterChange('min_price', '');
                        handleFilterChange('max_price', '');
                        handleFilterChange('min_experience', []);
                        setSortBy('default');
                      }}
                      style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--stone)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Reset All
                    </button>
                    <Button
                      variant="primary"
                      onClick={() => setShowSortDropdown(false)}
                      style={{ height: '28px', padding: '0 12px', fontSize: '12px', borderRadius: '4px' }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <>
              <style>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
                .skeleton-pulse {
                  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
                  background-size: 200% 100%;
                  animation: shimmer 1.5s infinite linear;
                }
              `}</style>
              <div className="tutor-results-grid" style={{ paddingBottom: '40px' }}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <TutorCardSkeleton key={idx} />
                ))}
              </div>
            </>
          ) : (
            <div className="tutor-results-grid" style={{
              paddingBottom: showAuthOverlay ? '140px' : '40px'
            }}>
              {displayedTutors.map((tutor) => (
                <Card key={tutor.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

                  {tutor.immediate_hiring && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} fill="#D97706" /> IMMEDIATE
                    </div>
                  )}

                  <Link href={`/tutors/${tutor.id}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--surface)', flexShrink: 0,
                        backgroundImage: tutor.avatar_url ? `url("${getAvatarUrl(tutor.avatar_url)}")` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--hairline)'
                      }}>
                        {!tutor.avatar_url && <User size={28} color="var(--stone)" />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                            {tutor.full_name}
                          </h3>
                          {tutor.verified && (
                            <span
                              className="premium-badge-wrapper"
                              tabIndex={0}
                              title="Premium Verified"
                              aria-label="Premium Verified Tutor"
                            >
                              <Image
                                src="/shield.svg"
                                alt="Premium Verified"
                                width={20}
                                height={20}
                                style={{ display: 'block', flexShrink: 0, cursor: 'pointer' }}
                              />
                              <span className="premium-badge-tooltip">
                                Premium Verified
                              </span>
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--steel)', marginBottom: '4px' }}>
                          <MapPin size={14} /> {tutor.city} {tutor.area && `- ${tutor.area}`}
                        </div>
                        {tutor.rating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                            <Star size={14} fill="#f59e0b" /> {tutor.rating} <span style={{ color: 'var(--stone)', fontWeight: 400 }}>({tutor.reviews_count} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>


                    <div style={{ fontSize: '13px', color: 'var(--steel)', marginBottom: '16px', lineHeight: '1.5', flex: 1 }}>
                      {tutor.bio || 'Experienced tutor dedicated to student success.'}
                    </div>

                    {/* Skills / Categories */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                      {tutor.categories?.slice(0, 3).map((cat, i) => (
                        <span key={i} style={{ backgroundColor: 'var(--surface)', color: 'var(--steel)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--hairline)' }}>
                          {cat.subject || cat.level}
                        </span>
                      ))}
                      {tutor.categories?.length > 3 && (
                        <span style={{ fontSize: '12px', color: 'var(--stone)', alignSelf: 'center' }}>+{tutor.categories.length - 3} more</span>
                      )}
                    </div>
                  </Link>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hourly Rate</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>Rs {tutor.hourly_rate || 'N/A'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link href={`/tutors/${tutor.id}`}>
                        <Button variant="outline" style={{ height: '36px', padding: '0 14px', fontSize: '13px', borderRadius: '999px', border: '1px solid var(--hairline-strong)', color: 'var(--slate)', fontWeight: 500 }}>
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookDemo(tutor);
                        }}
                        disabled={checkingDemoTutorId === tutor.id}
                        style={{
                          height: '36px', padding: '0 16px', fontSize: '13px', borderRadius: '999px',
                          backgroundColor: 'var(--brand-green-dark)', color: '#fff', border: 'none',
                          fontWeight: 600, cursor: checkingDemoTutorId === tutor.id ? 'wait' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {checkingDemoTutorId === tutor.id ? (
                          'Connecting…'
                        ) : (
                          <>
                            <MessageSquare size={14} />
                            Book Demo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {filteredTutors.length === 0 && !loading && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0', color: 'var(--stone)' }}>
                  <Search size={48} color="var(--hairline-strong)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No tutors found</h3>
                  <p>Try adjusting your filters to see more results.</p>
                </div>
              )}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !loading && sortedTutors.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', paddingBottom: '40px' }}>
              <Button
                type="button"
                variant="outline"
                style={{
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1.5px solid var(--brand-green-dark)',
                  color: 'var(--brand-green-dark)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(prevPage => prevPage + 1);
                }}
              >
                Load More Tutors
              </Button>
            </div>
          )}

          {/* ─── UNAUTHENTICATED PREVIEW OVERLAY ─── */}
          {showAuthOverlay && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '350px',
              background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.9) 40%, rgba(250,250,250,1) 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: '60px',
              zIndex: 10,
              pointerEvents: 'all'
            }}>
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <Lock size={32} color="var(--stone)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
                  {filteredTutors.length > 4
                    ? `${filteredTutors.length - 4} more tutors available`
                    : 'Unlock more profiles'}
                </h3>
                <p style={{ color: 'var(--steel)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
                  Create a free account or log in to view all matching tutors, see their full profiles, and start messaging.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <Link href="/signup">
                    <Button variant="primary" style={{ height: '48px', padding: '0 32px', borderRadius: '999px', fontSize: '15px' }}>
                      Sign Up Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" style={{ height: '48px', padding: '0 32px', borderRadius: '999px', fontSize: '15px', backgroundColor: '#fff' }}>
                      Log In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ─── BOOK DEMO / MESSAGE CONFIRM SPEND MODAL ─── */}
          {demoModalTutor && (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => {
                if (!isConfirmingSpend) {
                  setDemoModalTutor(null);
                  setSpendError(null);
                }
              }}
            >
              <div 
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '32px 28px',
                  maxWidth: '440px',
                  width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                {!isConfirmingSpend && (
                  <button
                    onClick={() => {
                      setDemoModalTutor(null);
                      setSpendError(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: '18px',
                      right: '18px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--stone)',
                      backgroundColor: 'var(--surface)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Icon Header */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: walletBalance >= 100 ? '#DCFCE7' : '#FEF3C7',
                  color: walletBalance >= 100 ? '#16A34A' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  {walletBalance >= 100 ? <MessageSquare size={26} /> : <Coins size={26} />}
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
                  {walletBalance >= 100 ? 'Book Demo & Message Tutor' : '100 Credits Required'}
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--steel)', lineHeight: 1.5 }}>
                  {walletBalance >= 100 ? (
                    <>Initiate a direct chat to schedule a trial/demo class with <strong>{demoModalTutor.full_name}</strong>.</>
                  ) : (
                    <>Initiating a direct chat with <strong>{demoModalTutor.full_name}</strong> requires 100 credits.</>
                  )}
                </p>

                {/* Credit Ledger Box */}
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid var(--hairline)',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                    <span style={{ color: 'var(--steel)' }}>Chat Initiation Fee:</span>
                    <strong style={{ color: 'var(--ink)' }}>100 Credits</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: walletBalance >= 100 ? '8px' : '0', fontSize: '13.5px' }}>
                    <span style={{ color: 'var(--steel)' }}>Your Available Balance:</span>
                    <strong style={{ color: walletBalance >= 100 ? '#16A34A' : '#DC2626' }}>
                      {Number(walletBalance || 0).toLocaleString()} Credits
                    </strong>
                  </div>
                  {walletBalance >= 100 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--hairline)', fontSize: '13.5px' }}>
                      <span style={{ color: 'var(--steel)' }}>Remaining Balance:</span>
                      <strong style={{ color: 'var(--ink)' }}>
                        {Number(walletBalance - 100).toLocaleString()} Credits
                      </strong>
                    </div>
                  )}
                </div>

                {spendError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    marginBottom: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{spendError}</span>
                  </div>
                )}

                {walletBalance < 100 ? (
                  <div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '10px 14px', borderRadius: '8px', textAlign: 'center' }}>
                      Your balance is low. Please top up your wallet via bank deposit to message tutors directly.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button
                        variant="secondary"
                        style={{ flex: 1, height: '42px', borderRadius: '8px' }}
                        onClick={() => {
                          setDemoModalTutor(null);
                          setSpendError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        style={{ flex: 1, height: '42px', borderRadius: '8px' }}
                        onClick={() => router.push('/client/wallet')}
                      >
                        Buy Credits
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button
                      variant="secondary"
                      style={{ flex: 1, height: '42px', borderRadius: '8px' }}
                      onClick={() => {
                        setDemoModalTutor(null);
                        setSpendError(null);
                      }}
                      disabled={isConfirmingSpend}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      style={{ flex: 1.4, height: '42px', borderRadius: '8px' }}
                      onClick={handleConfirmSpend}
                      disabled={isConfirmingSpend}
                    >
                      {isConfirmingSpend ? 'Initiating Chat…' : 'Confirm Spend (100 Credits)'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TutorCardSkeleton() {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', height: '360px', padding: '24px', position: 'relative', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        {/* Avatar Skeleton */}
        <div className="skeleton-pulse" style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0 }} />
        {/* Text Skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <div className="skeleton-pulse" style={{ height: '18px', width: '75%', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '55%', borderRadius: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '14px', width: '45%', borderRadius: '4px' }} />
        </div>
      </div>
      {/* Bio lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginBottom: '20px' }}>
        <div className="skeleton-pulse" style={{ height: '14px', width: '100%', borderRadius: '4px' }} />
        <div className="skeleton-pulse" style={{ height: '14px', width: '90%', borderRadius: '4px' }} />
        <div className="skeleton-pulse" style={{ height: '14px', width: '60%', borderRadius: '4px' }} />
      </div>
      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        <div className="skeleton-pulse" style={{ height: '24px', width: '60px', borderRadius: '999px' }} />
        <div className="skeleton-pulse" style={{ height: '24px', width: '75px', borderRadius: '999px' }} />
        <div className="skeleton-pulse" style={{ height: '24px', width: '50px', borderRadius: '999px' }} />
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)' }}>
        <div>
          <div className="skeleton-pulse" style={{ height: '11px', width: '60px', borderRadius: '2px', marginBottom: '4px' }} />
          <div className="skeleton-pulse" style={{ height: '20px', width: '80px', borderRadius: '4px' }} />
        </div>
        <div className="skeleton-pulse" style={{ height: '36px', width: '100px', borderRadius: '6px' }} />
      </div>
    </Card>
  );
}

export default function FindTutorSearch() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--stone)' }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
