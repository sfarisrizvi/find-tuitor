'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, MapPin, Star, ShieldCheck, Lock, ChevronDown, 
  Award, BookOpen, Zap, SlidersHorizontal, User
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || '';
  const initialQuery = searchParams.get('query') || '';

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    city: initialCity,
    subjects: [], // Array for multiple subjects selection
    custom_subject: '',
    levels: [], // Array for multiple levels selection
    min_price: '',
    max_price: '',
    gender: '',
    min_experience: [], // Array for multiple selection
    verified: false,
    immediate_hiring: false,
    modes: []
  });

  const CITIES = ['Islamabad', 'Rawalpindi', 'Attock', 'Lahore', 'Karachi'];
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

  // Helper to dynamically get subjects by level
  const getSubjectOptions = (level) => {
    if (!level) {
      return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing'];
    }
    switch (level) {
      case 'Kindergarten':
      case 'Primary':
      case 'Secondary':
        return []; // Disabled
      case 'Matric':
        return ['Arts', 'Biology', 'Computer'];
      case 'Inter':
        return ['Arts', 'Pre-Engineering', 'Pre-Medical', 'Commerce', 'ICs', 'O Levels'];
      case 'BS/MS':
        return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing', 'Other'];
      default:
        return [];
    }
  };

  const fetchTutors = async (currentFilters) => {
    setLoading(true);
    const supabase = createClient();
    
    // If subjects array includes 'Other', fetch all tutors for that level and filter client-side for custom subject relevance
    const querySubject = (currentFilters.subjects && currentFilters.subjects.length > 0)
      ? currentFilters.subjects.filter(s => s !== 'Other')
      : null;

    // Resolve min experience threshold from selected checkboxes (use the lowest selected minimum threshold)
    const expVals = (currentFilters.min_experience || []).map(e => parseInt(e)).filter(e => !isNaN(e));
    const resolvedMinExp = expVals.length > 0 ? Math.min(...expVals) : null;

    const rpcParams = {
      p_city: currentFilters.city || null,
      p_subjects: querySubject && querySubject.length > 0 ? querySubject : null,
      p_levels: currentFilters.levels && currentFilters.levels.length > 0 ? currentFilters.levels : null,
      p_gender: currentFilters.gender || null,
      p_verified: currentFilters.verified || null,
      p_immediate_hiring: currentFilters.immediate_hiring || null,
      p_min_price: currentFilters.min_price ? parseFloat(currentFilters.min_price) : null,
      p_max_price: currentFilters.max_price ? parseFloat(currentFilters.max_price) : null,
      p_min_experience: resolvedMinExp,
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
    let newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
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

  // Client-side text keyword and dynamic BS/MS subject relevance filter
  const filteredTutors = tutors.filter(tutor => {
    let matchesQuery = true;
    if (debouncedQuery) {
      const lowerQuery = debouncedQuery.toLowerCase();
      matchesQuery = (
        tutor.full_name.toLowerCase().includes(lowerQuery) ||
        (tutor.bio && tutor.bio.toLowerCase().includes(lowerQuery)) ||
        (tutor.about && tutor.about.toLowerCase().includes(lowerQuery))
      );
    }

    let matchesCustomSubject = true;
    const levelIsBSMS = filters.levels.includes('BS/MS');
    const subjectIsOther = filters.subjects.includes('Other');
    if (levelIsBSMS && subjectIsOther && filters.custom_subject) {
      const text = filters.custom_subject.toLowerCase();
      const isMathRelated = text.includes('algebra') || text.includes('calculus') || text.includes('math') || text.includes('linear') || text.includes('stat');
      const isPhysicsRelated = text.includes('physic') || text.includes('mechanic') || text.includes('thermo') || text.includes('quantum');
      const isChemistryRelated = text.includes('chem') || text.includes('organic');
      
      const tutorSubjects = tutor.categories?.map(c => c.subject?.toLowerCase()) || [];
      
      if (isMathRelated && tutorSubjects.includes('mathematics')) {
        matchesCustomSubject = true;
      } else if (isPhysicsRelated && tutorSubjects.includes('physics')) {
        matchesCustomSubject = true;
      } else if (isChemistryRelated && tutorSubjects.includes('chemistry')) {
        matchesCustomSubject = true;
      } else {
        // Fallback checks
        matchesCustomSubject = (
          tutor.bio?.toLowerCase().includes(text) ||
          tutor.qualification?.toLowerCase().includes(text) ||
          tutorSubjects.some(s => s && s.includes(text))
        );
      }
    }

    return matchesQuery && matchesCustomSubject;
  });

  const displayedTutors = session ? filteredTutors : filteredTutors.slice(0, 3);
  const showAuthOverlay = !session && filteredTutors.length > 3;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* ─── HYBRID TOP BAR: SELECTORS ─── */}
      <div style={{ 
        backgroundColor: 'var(--canvas)', 
        borderBottom: '1px solid var(--hairline-strong)',
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          <Link href="/find-tutor" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px', cursor: 'pointer' }}>
              <Search size={20} color="var(--brand-green-dark)" />
              Find Tutors
            </div>
          </Link>

          {/* City Dropdown */}
          <div style={{ position: 'relative', minWidth: '160px' }}>
            <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{
                width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px',
                borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none'
              }}
            >
              <option value="">Any City</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
          </div>

          {/* Search query input */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input 
              placeholder="Search by keyword..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ height: '40px', paddingLeft: '36px', fontSize: '14px', border: '1px solid var(--hairline-strong)', borderRadius: '999px', backgroundColor: '#fff' }} 
            />
          </div>

          <Button 
            className="mobile-filter-btn" 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'none' }}
          >
            <SlidersHorizontal size={16} style={{ marginRight: '8px' }} /> Filters
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', padding: '24px', gap: '32px' }}>
        
        {/* ─── LEFT SIDEBAR: ADVANCED FILTERS ─── */}
        <div style={{
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
        }} className={`sidebar-filters ${showFilters ? 'open' : ''}`}>

          {/* Grade / Level Filter */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade / Level</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LEVELS.map(lvl => {
                const isChecked = filters.levels.includes(lvl);
                return (
                  <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleLevel(lvl)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                    />
                    {lvl}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />

          {/* Subjects Filter */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects</h3>
            {(() => {
              const activeLevels = filters.levels;
              let subjectOptions = [];
              if (activeLevels.length === 0) {
                subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing'];
              } else {
                const unique = new Set();
                activeLevels.forEach(lvl => {
                  getSubjectOptions(lvl).forEach(s => unique.add(s));
                });
                subjectOptions = Array.from(unique);
              }

              if (subjectOptions.length === 0) {
                return (
                  <div style={{ fontSize: '13px', color: 'var(--stone)', fontStyle: 'italic' }}>
                    General curriculum (no subject selection required).
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {subjectOptions.map(subj => {
                    const isChecked = filters.subjects.includes(subj);
                    return (
                      <div key={subj} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleSubjectFilter(subj)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                          />
                          {subj}
                        </label>
                        
                        {subj === 'Other' && isChecked && (
                          <div style={{ paddingLeft: '24px', marginTop: '4px' }}>
                            <Input
                              placeholder="e.g. Linear Algebra"
                              value={filters.custom_subject}
                              onChange={(e) => handleFilterChange('custom_subject', e.target.value)}
                              style={{ height: '32px', fontSize: '13px', padding: '0 8px', border: '1px solid var(--hairline-strong)', borderRadius: '4px', backgroundColor: '#fff', width: '100%' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          
          {/* Price Range */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range (Rs/hr)</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input 
                type="number" 
                placeholder="Min" 
                value={filters.min_price} 
                onChange={(e) => handleFilterChange('min_price', e.target.value)} 
                style={{ height: '36px', fontSize: '14px' }} 
              />
              <span style={{ color: 'var(--stone)' }}>-</span>
              <Input 
                type="number" 
                placeholder="Max" 
                value={filters.max_price} 
                onChange={(e) => handleFilterChange('max_price', e.target.value)} 
                style={{ height: '36px', fontSize: '14px' }} 
              />
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />

          {/* Gender */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Any', 'Male', 'Female'].map(g => {
                const val = g === 'Any' ? '' : g;
                const active = filters.gender === val;
                return (
                  <button
                    key={g}
                    onClick={() => handleFilterChange('gender', val)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: 500,
                      border: active ? '1.5px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)',
                      backgroundColor: active ? 'var(--brand-green-soft)' : '#fff',
                      color: active ? 'var(--brand-green-dark)' : 'var(--stone)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >{g}</button>
                )
              })}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--hairline-strong)' }} />

          {/* Experience */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Experience</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { value: '', label: 'Any Experience' },
                { value: '1', label: '1+ Years' },
                { value: '3', label: '3+ Years' },
                { value: '5', label: '5+ Years' },
                { value: '10', label: '10+ Years' },
              ].map((exp) => {
                const isChecked = exp.value === '' 
                  ? filters.min_experience.length === 0 
                  : filters.min_experience.includes(exp.value);
                return (
                  <label key={exp.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--ink)' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleExperience(exp.value)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-green-dark)', cursor: 'pointer' }}
                    />
                    {exp.label}
                  </label>
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
        <div style={{ flex: 1, position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {loading ? 'Searching...' : `${filteredTutors.length} Tutors Found`}
            </h2>
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                gap: '24px',
                paddingBottom: '40px'
              }}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <TutorCardSkeleton key={idx} />
                ))}
              </div>
            </>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: '24px',
              paddingBottom: showAuthOverlay ? '140px' : '40px'
            }}>
              {displayedTutors.map((tutor) => (
                <Card key={tutor.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  
                  {tutor.immediate_hiring && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} fill="#D97706" /> IMMEDIATE
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--surface)', flexShrink: 0,
                      backgroundImage: tutor.avatar_url ? `url(${tutor.avatar_url})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--hairline)'
                    }}>
                      {!tutor.avatar_url && <User size={28} color="var(--stone)" />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                          {tutor.full_name}
                        </h3>
                        {tutor.verified && <ShieldCheck size={16} color="var(--brand-teal)" />}
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

                  <div style={{ fontSize: '14px', color: 'var(--ink)', marginBottom: '16px', lineHeight: '1.5', flex: 1 }}>
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

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hourly Rate</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>Rs {tutor.hourly_rate || 'N/A'}</div>
                    </div>
                    <Link href={`/tutors/${tutor.id}`}>
                      <Button variant="outline" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>View Profile</Button>
                    </Link>
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
                  {filteredTutors.length - 3} more tutors available
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
