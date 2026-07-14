'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Menu, X, User } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const loadProfile = async (u) => {
      try {
        let role = u.user_metadata?.role;
        let prof = null;

        if (role) {
          const table = role === 'client' ? 'client_profiles' : 'tutor_profiles';
          const { data } = await supabase
            .from(table)
            .select('id, full_name, avatar_url')
            .eq('id', u.id)
            .maybeSingle();
          if (data) {
            prof = data;
          }
        }

        if (!prof) {
          // Check client profiles
          const { data: clientProf } = await supabase
            .from('client_profiles')
            .select('id, full_name, avatar_url')
            .eq('id', u.id)
            .maybeSingle();
          if (clientProf) {
            prof = clientProf;
            role = 'client';
          } else {
            // Check tutor profiles
            const { data: tutorProf } = await supabase
              .from('tutor_profiles')
              .select('id, full_name, avatar_url')
              .eq('id', u.id)
              .maybeSingle();
            if (tutorProf) {
              prof = tutorProf;
              role = 'tutor';
            }
          }
        }

        if (prof) {
          setProfile({ ...prof, role });
        }
      } catch (err) {
        console.error('Error loading navbar profile:', err);
      }
    };

    const initUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          await loadProfile(user);
        }
      } catch (err) {
        console.error('Error initializing user in navbar:', err);
      } finally {
        setInitialized(true);
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setInitialized(true);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signout:', err);
    }
    
    let redirectUrl = '/api/auth/signout';
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      const fullPath = search ? `${path}${search}` : path;
      if (path.startsWith('/tutors/')) {
        redirectUrl += `?next=${encodeURIComponent(fullPath)}`;
      }
    }
    window.location.href = redirectUrl;
  };

  const handleSignInClick = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      const fullPath = search ? `${path}${search}` : path;
      if (path === '/login' || path === '/signup' || path === '/register') {
        window.location.href = '/login';
      } else {
        window.location.href = `/login?next=${encodeURIComponent(fullPath)}`;
      }
    }
  };

  const isTutor = profile?.role === 'tutor' || user?.user_metadata?.role === 'tutor';
  const isClient = profile?.role === 'client' || user?.user_metadata?.role === 'client';

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    // Proxy through /api/media — keeps storage URL and email path server-side
    return profile?.id ? `/api/media/${profile.id}/avatar` : null;
  };

  const navStyle = {
    backgroundColor: 'var(--canvas)',
    borderBottom: '1px solid var(--hairline)',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  };

  const linkStyle = {
    color: 'var(--ink)',
    marginRight: 'var(--spacing-md)',
    fontSize: '14px',
    fontWeight: 500,
  };

  const mobileLinkStyle = {
    color: 'var(--ink)',
    fontSize: '18px',
    fontWeight: 600,
    padding: '8px 0',
    borderBottom: '1px solid var(--hairline)',
  };

  const rightActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    position: 'relative'
  };

  const renderLinks = () => {
    if (!initialized) {
      return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ width: '90px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ width: '80px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ width: '70px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
      );
    }
    if (user && isTutor) {
      return (
        <>
          <Link href="/tutor/dashboard" style={linkStyle}>Dashboard</Link>
          <Link href="/tutor/contracts" style={linkStyle}>Active Tuitions</Link>
          <Link href="/tutor/jobs" style={linkStyle}>Find Tuitions</Link>
          <Link href="/tutor/messages" style={linkStyle}>Messages</Link>
        </>
      );
    }
    if (user && isClient) {
      return (
        <>
          <Link href="/client/dashboard" style={linkStyle}>Dashboard</Link>
          <Link href="/client/jobs" style={linkStyle}>Active Teachers</Link>
          <Link href="/find-tutor" style={linkStyle}>Find Teacher</Link>
          <Link href="/client/messages" style={linkStyle}>Messages</Link>
        </>
      );
    }
    // Default fallback (unsigned-out state or while loading) to prevent flickering/empty nav
    return (
      <>
        <Link href="/find-tutor" style={linkStyle}>Find Tutors</Link>
        <Link href="/tutor/jobs" style={linkStyle}>Find Jobs</Link>
        <Link href="/#how-it-works" style={linkStyle}>How It Works</Link>
        <Link href="/contact" style={linkStyle}>Contact Us</Link>
      </>
    );
  };

  return (
    <nav style={navStyle}>
      <div className="container" style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ 
            marginRight: 'var(--spacing-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img src="/logo.svg" alt="TutorOnline.pk" style={{ height: '24px' }} />
          </Link>
          
          <div className="nav-links">
            {renderLinks()}
          </div>
        </div>

        <div style={rightActionsStyle} className="nav-links">
          {!initialized ? (
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--hairline-strong)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ) : user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-green-dark)',
                  border: '2px solid var(--hairline-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: profile?.avatar_url ? `url("${getAvatarUrl(profile.avatar_url)}") center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))'
                }}
              >
                {!profile?.avatar_url && (
                  <User size={18} color="#fff" />
                )}
              </button>
              
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  backgroundColor: 'var(--canvas)',
                  border: '1px solid var(--hairline)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  width: '180px',
                  padding: '6px 0',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {isTutor && (
                    <Link 
                      href={`/tutors/${user.id}`} 
                      onClick={() => setShowDropdown(false)}
                      style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', borderBottom: '1px solid var(--hairline-soft)' }}
                    >
                      Profile
                    </Link>
                  )}
                  {isClient && (
                    <Link 
                      href="/client/profile" 
                      onClick={() => setShowDropdown(false)}
                      style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', borderBottom: '1px solid var(--hairline-soft)' }}
                    >
                      Profile
                    </Link>
                  )}
                  <Link 
                    href={isTutor ? "/tutor/onboarding" : "/client/profile"} 
                    onClick={() => setShowDropdown(false)}
                    style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    Settings
                  </Link>
                  <button 
                    onClick={() => { setShowDropdown(false); handleSignOut(); }}
                    style={{ padding: '10px 16px', fontSize: '13px', color: '#EF4444', fontWeight: 600, border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', borderTop: '1px solid var(--hairline-soft)' }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" onClick={handleSignInClick} style={linkStyle}>Sign In</Link>
              <Link href="/signup">
                <Button variant="primary">Join Free</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="nav-mobile-btn" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={`nav-mobile-overlay ${isOpen ? 'open' : ''}`}>
        {user && isTutor ? (
          <>
            <Link href="/tutor/dashboard" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Dashboard</Link>
            <Link href="/tutor/contracts" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Active Tuitions</Link>
            <Link href="/tutor/jobs" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Find Tuitions</Link>
            <Link href="/tutor/messages" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Messages</Link>
            <Link href={`/tutors/${user?.id}`} style={mobileLinkStyle} onClick={() => setIsOpen(false)}>View Profile</Link>
            <Link href="/tutor/onboarding" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Settings</Link>
            <button 
              onClick={() => { setIsOpen(false); handleSignOut(); }}
              style={{ width: '100%', padding: '12px 0', fontSize: '18px', fontWeight: 600, color: '#EF4444', border: 'none', backgroundColor: 'transparent', textAlign: 'left', borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </>
        ) : user && isClient ? (
          <>
            <Link href="/client/dashboard" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Dashboard</Link>
            <Link href="/client/jobs" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Active Teachers</Link>
            <Link href="/find-tutor" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Find Teacher</Link>
            <Link href="/client/messages" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Messages</Link>
            <Link href="/client/profile" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>View Profile</Link>
            <button 
              onClick={() => { setIsOpen(false); handleSignOut(); }}
              style={{ width: '100%', padding: '12px 0', fontSize: '18px', fontWeight: 600, color: '#EF4444', border: 'none', backgroundColor: 'transparent', textAlign: 'left', borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/find-tutor" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Find Tutors</Link>
            <Link href="/tutor/jobs" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Find Jobs</Link>
            <Link href="/#how-it-works" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>How It Works</Link>
            <Link href="/contact" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Contact Us</Link>
            {user ? (
              <>
                <Link href="/settings" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Settings</Link>
                <button 
                  onClick={() => { setIsOpen(false); handleSignOut(); }}
                  style={{ width: '100%', padding: '12px 0', fontSize: '18px', fontWeight: 600, color: '#EF4444', border: 'none', backgroundColor: 'transparent', textAlign: 'left', borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                <Link href="/login" onClick={(e) => { setIsOpen(false); handleSignInClick(e); }} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>Sign In</Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" style={{ width: '100%' }}>Join Free</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
