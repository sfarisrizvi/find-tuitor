'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/Button';
import { Menu, X, User } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import { NAV_LINKS } from './navbar.config';
import { HeaderNotificationBell } from './HeaderNotificationBell';

export function AppHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 1. Determine active role context based on URL route (instant static checks to prevent layouts shifts)
  let staticRole = 'guest';
  if (pathname?.startsWith('/tutor/jobs')) {
    staticRole = 'guest';
  } else if (pathname?.startsWith('/tutor/')) {
    staticRole = 'tutor';
  } else if (pathname?.startsWith('/client/')) {
    staticRole = 'client';
  }

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadProfile = async (u) => {
      try {
        // If route tells us the role, query only that specific table to save DB hits
        let role = staticRole;
        if (role === 'guest') {
          role = u.user_metadata?.role;
        }

        let data = null;
        if (role === 'client') {
          const res = await supabase.from('client_profiles').select('id, full_name, avatar_url').eq('id', u.id).maybeSingle();
          data = res.data;
        } else if (role === 'tutor') {
          const res = await supabase.from('tutor_profiles').select('id, full_name, avatar_url').eq('id', u.id).maybeSingle();
          data = res.data;
        } else if (!role) {
          // Fallback check if metadata role is missing
          const resClient = await supabase.from('client_profiles').select('id, full_name, avatar_url').eq('id', u.id).maybeSingle();
          if (resClient.data) {
            data = resClient.data;
            role = 'client';
          } else {
            const resTutor = await supabase.from('tutor_profiles').select('id, full_name, avatar_url').eq('id', u.id).maybeSingle();
            data = resTutor.data;
            if (data) role = 'tutor';
          }
        }

        if (!cancelled && data) {
          setProfile({ ...data, role });
        }
      } catch (err) {
        console.error('Error loading header profile:', err);
      }
    };

    const initSession = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (u) {
          setUser(u);
          await loadProfile(u);
        }
      } catch (err) {
        console.error('Error initializing session:', err);
      } finally {
        if (!cancelled) setInitialized(true);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN') {
        const u = session?.user || null;
        setUser(u);
        if (u) loadProfile(u);
        setInitialized(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setInitialized(true);
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [staticRole]);

  useEffect(() => {
    if (!showDropdown) return;
    const closeDropdown = (e) => {
      const avatarBtn = document.getElementById('header-avatar-btn');
      const dropdownMenu = document.getElementById('header-dropdown-menu');
      if (avatarBtn && !avatarBtn.contains(e.target) && dropdownMenu && !dropdownMenu.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [showDropdown]);

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

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) return avatarPath;
    return profile?.id ? `/api/media/${profile.id}/avatar` : null;
  };

  // Determine active menu links
  const activeRole = profile?.role || user?.user_metadata?.role || staticRole;
  const links = NAV_LINKS[activeRole] || NAV_LINKS.guest;

  // Determine Logo redirect path
  let logoHref = '/';
  if (activeRole === 'tutor') logoHref = '/tutor/dashboard';
  else if (activeRole === 'client') logoHref = '/client/dashboard';

  // Determine settings path
  const settingsHref = activeRole === 'tutor' ? '/tutor/onboarding' : '/client/profile';
  const profileHref = activeRole === 'tutor' ? `/tutors/${user?.id}` : '/client/profile';

  const navStyle = {
    backgroundColor: 'var(--canvas)',
    borderBottom: '1px solid var(--hairline)',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
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

  return (
    <nav style={navStyle}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href={logoHref} style={{ marginRight: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/dark%20logo.svg" alt="TutorOnline.pk" style={{ height: '24px' }} />
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links">
            {!initialized && activeRole === 'guest' ? (
              // Shimmer loaders for guest menu loading state to prevent layout shift
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ width: '90px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ width: '80px', height: '14px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
              </div>
            ) : (
              links.map((link) => (
                <Link key={link.href} href={link.href} style={linkStyle}>
                  {link.label}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Desktop Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', position: 'relative' }} className="nav-actions-desktop">
          {!initialized ? (
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--hairline-strong)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
              <HeaderNotificationBell user={user} profile={profile} />
              <button
                id="header-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  backgroundColor: 'var(--brand-green-dark)', border: '2px solid var(--hairline-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  background: profile?.avatar_url ? `url("${getAvatarUrl(profile.avatar_url)}") center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))'
                }}
              >
                {!profile?.avatar_url && <User size={18} color="#fff" />}
              </button>

              {showDropdown && (
                <div 
                  id="header-dropdown-menu"
                  style={{
                    position: 'absolute', right: 0, top: '46px', backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline)', borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                    width: '180px', padding: '6px 0', zIndex: 100, display: 'flex', flexDirection: 'column'
                  }}
                >
                  <Link href={profileHref} onClick={() => setShowDropdown(false)} style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', borderBottom: '1px solid var(--hairline-soft)' }}>
                    Profile
                  </Link>
                  <Link href={settingsHref} onClick={() => setShowDropdown(false)} style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}>
                    Settings
                  </Link>
                  <button onClick={() => { setShowDropdown(false); handleSignOut(); }} style={{ padding: '10px 16px', fontSize: '13px', color: '#EF4444', fontWeight: 600, border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', borderTop: '1px solid var(--hairline-soft)' }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="/login" onClick={handleSignInClick} style={{ color: 'var(--ink)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                Log in
              </a>
              <Link href="/register">
                <Button variant="primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px', fontWeight: 600 }}>
                  Become a Tutor
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Right Actions */}
        <div className="nav-actions-mobile" style={{ alignItems: 'center', gap: '12px' }}>
          {initialized && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Notification icon on left side of PFP */}
              <HeaderNotificationBell user={user} profile={profile} />
              
              {/* Profile Avatar Icon replaces Hamburger Menu button when logged in */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle profile menu"
                style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  backgroundColor: 'var(--brand-green-dark)',
                  border: isOpen ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  background: profile?.avatar_url ? `url("${getAvatarUrl(profile.avatar_url)}") center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))'
                }}
              >
                {!profile?.avatar_url && (isOpen ? <X size={20} color="#fff" /> : <User size={18} color="#fff" />)}
              </button>
            </div>
          ) : (
            /* Logged-Out / Guest State: Hamburger Icon ONLY */
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              aria-label="Toggle menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      <div className={`nav-mobile-backdrop ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />

      {/* Mobile Drawer Overlay */}
      <div className={`nav-mobile-overlay ${isOpen ? 'open' : ''}`}>
        
        {/* User Info Card inside drawer when logged in */}
        {initialized && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--hairline-strong)', marginBottom: '8px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              backgroundColor: 'var(--brand-green-dark)', border: '1px solid var(--hairline-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              background: profile?.avatar_url ? `url("${getAvatarUrl(profile.avatar_url)}") center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))'
            }}>
              {!profile?.avatar_url && <User size={20} color="#fff" />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                {profile?.full_name || user?.user_metadata?.full_name || 'My Account'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--stone)', textTransform: 'capitalize' }}>
                {activeRole} Account
              </span>
            </div>
          </div>
        )}

        {/* Top/Middle Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} style={mobileLinkStyle} onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}

          {initialized && user && (
            <>
              <Link href={profileHref} style={mobileLinkStyle} onClick={() => setIsOpen(false)}>
                My Profile
              </Link>
              <Link href={settingsHref} style={mobileLinkStyle} onClick={() => setIsOpen(false)}>
                Settings
              </Link>
            </>
          )}
        </div>

        {/* Bottom Action Section inside Drawer */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {initialized && user ? (
            /* Logged-In State: Red Sign Out Button at Bottom */
            <button 
              onClick={() => { setIsOpen(false); handleSignOut(); }} 
              style={{ 
                width: '100%',
                height: '44px',
                borderRadius: 'var(--rounded-full)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit'
              }}
            >
              Sign Out
            </button>
          ) : (
            /* Guest State: Outlined Login + Fill Accent Join as Tutor Button at Bottom */
            <>
              <a 
                href="/login" 
                onClick={(e) => { setIsOpen(false); handleSignInClick(e); }} 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '44px',
                  borderRadius: 'var(--rounded-full)',
                  border: '1px solid var(--hairline-strong)',
                  color: 'var(--ink)',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  backgroundColor: 'var(--canvas)'
                }}
              >
                Log in
              </a>

              <Link href="/register" onClick={() => setIsOpen(false)} style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
                <Button 
                  variant="primary" 
                  style={{ 
                    width: '100%', 
                    height: '44px', 
                    fontSize: '15px', 
                    fontWeight: 600,
                    borderRadius: 'var(--rounded-full)'
                  }}
                >
                  Join as Tutor
                </Button>
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
