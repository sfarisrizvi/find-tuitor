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
  const [filters, setFilters] = useState({
    city: initialCity,
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
  const GENDERS = ['Male', 'Female'];
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

  // Client-side text keyword filter
  const filteredTutors = tutors.filter(tutor => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      tutor.full_name.toLowerCase().includes(lowerQuery) ||
      (tutor.bio && tutor.bio.toLowerCase().includes(lowerQuery)) ||
      (tutor.about && tutor.about.toLowerCase().includes(lowerQuery))
    );
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
        top: 0,
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

          {/* Subject Dropdown */}
          <div style={{ position: 'relative', minWidth: '160px' }}>
            <BookOpen size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              style={{
                width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px',
                borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none'
              }}
            >
              <option value="">Any Subject</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
          </div>

          {/* Level Dropdown */}
          <div style={{ position: 'relative', minWidth: '160px' }}>
            <Award size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              style={{
                width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px',
                borderRadius: '999px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '14px', cursor: 'pointer', outline: 'none', appearance: 'none'
              }}
            >
              <option value="">Any Level/Class</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
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
          gap: '24px'
        }} className={`sidebar-filters ${showFilters ? 'open' : ''}`}>
          
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
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Experience (Years)</h3>
            <select
              value={filters.min_experience}
              onChange={(e) => handleFilterChange('min_experience', e.target.value)}
              style={{
                width: '100%', height: '36px', paddingLeft: '12px', paddingRight: '12px',
                borderRadius: '8px', border: '1px solid var(--hairline-strong)', backgroundColor: '#fff',
                fontSize: '14px', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="">Any Experience</option>
              <option value="1">1+ Years</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
              <option value="10">10+ Years</option>
            </select>
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
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--stone)' }}>
              Loading results...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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

export default function FindTutorSearch() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--stone)' }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
