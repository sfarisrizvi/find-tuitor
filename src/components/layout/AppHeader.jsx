'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Menu, X, User, Wallet } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import { NAV_LINKS } from './navbar.config';
import { HeaderNotificationBell } from './HeaderNotificationBell';
import { playClingChime } from '../../lib/soundEffects';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);

  const userRef = React.useRef(null);

  // Determine active role context based on URL route
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
    let messageChannel = null;
    let walletChannel = null;

    const loadProfile = async (u) => {
      try {
        let role = staticRole;
        if (role === 'guest') {
          role = u.user_metadata?.role;
        }

        let data = null;
        if (role === 'tutor') {
          const res = await supabase.from('tutor_profiles').select('id, full_name, avatar_url').eq('id', u.id).maybeSingle();
          data = res.data;
        } else if (role === 'client') {
          const res = await supabase.from('client_profiles').select('id, full_name, avatar_url').eq('id', u.id).maybeSingle();
          data = res.data;
        } else {
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

    const fetchUnreadMessages = async (uId) => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', uId)
          .eq('read', false);
        if (!cancelled && data) {
          setUnreadMessageCount(data.length);
        }
      } catch (err) {
        console.error('Error fetching unread messages count:', err);
      }
    };

    const fetchWallet = async (uId) => {
      try {
        const { data } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', uId)
          .maybeSingle();
        if (!cancelled && data) {
          setWalletBalance(Number(data.balance) || 0);
        }
      } catch (err) {
        console.error('Error fetching wallet balance in header:', err);
      }
    };

    const setupRealtime = (uId) => {
      if (!uId) return;
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (walletChannel) supabase.removeChannel(walletChannel);

      const channelName = `header_msgs_${uId}_${Math.random().toString(36).substring(2, 7)}`;
      messageChannel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${uId}`
        }, () => {
          if (!cancelled) {
            setUnreadMessageCount(prev => prev + 1);
            playClingChime();
          }
        })
        .subscribe();

      const walletChannelName = `header_wallet_${uId}_${Math.random().toString(36).substring(2, 7)}`;
      walletChannel = supabase
        .channel(walletChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${uId}`
        }, (payload) => {
          if (!cancelled && payload.new?.balance !== undefined) {
            setWalletBalance(Number(payload.new.balance) || 0);
          }
        })
        .subscribe();
    };

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        const u = session?.user || null;
        if (u) {
          setUser(u);
          userRef.current = u;
          await loadProfile(u);
          await fetchUnreadMessages(u.id);
          await fetchWallet(u.id);
          setupRealtime(u.id);
        } else {
          setUser(null);
          userRef.current = null;
        }
      } catch (err) {
        console.error('Error initializing session:', err);
      } finally {
        if (!cancelled) setInitialized(true);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      const u = session?.user || null;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (u) {
          setUser(u);
          userRef.current = u;
          loadProfile(u);
          fetchUnreadMessages(u.id);
          fetchWallet(u.id);
          setupRealtime(u.id);
        } else if (event === 'INITIAL_SESSION') {
          setUser(null);
          userRef.current = null;
        }
        setInitialized(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        userRef.current = null;
        setProfile(null);
        setUnreadMessageCount(0);
        setWalletBalance(null);
        setInitialized(true);
      }
    });

    const handleMessagesRead = () => {
      const currentId = userRef.current?.id;
      if (currentId) fetchUnreadMessages(currentId);
    };
    const handleWalletUpdated = (e) => {
      if (e?.detail?.balance !== undefined) {
        setWalletBalance(Number(e.detail.balance));
      } else if (userRef.current?.id) {
        fetchWallet(userRef.current.id);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('messages_read', handleMessagesRead);
      window.addEventListener('wallet_updated', handleWalletUpdated);
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (walletChannel) supabase.removeChannel(walletChannel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('messages_read', handleMessagesRead);
        window.removeEventListener('wallet_updated', handleWalletUpdated);
      }
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
      setUser(null);
      setProfile(null);
      setShowDropdown(false);
      setIsOpen(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handlePostTuitionClick = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      const fullPath = search ? `${path}${search}` : path;
      let redirectUrl = '/client/jobs/new';
      if (path.startsWith('/tutors/')) {
        redirectUrl += `?next=${encodeURIComponent(fullPath)}`;
      }
      window.location.href = redirectUrl;
    }
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

  const activeRole = profile?.role || user?.user_metadata?.role || staticRole;
  const links = NAV_LINKS[activeRole] || NAV_LINKS.guest;

  let logoHref = '/';
  if (activeRole === 'tutor') logoHref = '/tutor/dashboard';
  else if (activeRole === 'client') logoHref = '/client/dashboard';

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
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
            {links.map((link) => {
              const isMessagesLink = link.href.includes('/messages');
              return (
                <Link key={link.href} href={link.href} style={{ ...linkStyle, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  {link.label}
                  {isMessagesLink && unreadMessageCount > 0 && (
                    <span style={{
                      backgroundColor: '#EF4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '999px',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '6px'
                    }}>
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', position: 'relative' }} className="nav-actions-desktop">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
              {walletBalance !== null && (
                <Link
                  href={activeRole === 'tutor' ? '/tutor/wallet' : '/client/wallet'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
                    border: '1px solid rgba(5, 150, 105, 0.22)',
                    color: 'var(--brand-green-dark, #065f46)',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="My Credits & Escrow Wallet"
                >
                  <Wallet size={14} style={{ color: '#059669' }} />
                  <span>{walletBalance.toLocaleString()}</span>
                  <span style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 500 }}>Credits</span>
                </Link>
              )}
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
                {!profile?.avatar_url && <User size={20} color="#fff" />}
              </button>

              {/* Profile Dropdown Menu */}
              {showDropdown && (
                <div
                  id="header-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '220px',
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline-strong)',
                    borderRadius: '16px',
                    boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline-soft)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                      {profile?.full_name || user?.user_metadata?.full_name || 'My Account'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--stone)', textTransform: 'capitalize' }}>
                      {activeRole} Account
                    </div>
                  </div>

                  <Link
                    href={activeRole === 'tutor' ? '/tutor/wallet' : '/client/wallet'}
                    onClick={() => setShowDropdown(false)}
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--hairline-soft)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet size={14} color="#059669" />
                      Credits & Wallet
                    </span>
                    <span style={{
                      fontWeight: 700,
                      color: '#059669',
                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '12px'
                    }}>
                      {walletBalance !== null ? `${walletBalance.toLocaleString()}` : '...'}
                    </span>
                  </Link>

                  <Link
                    href={profileHref}
                    onClick={() => setShowDropdown(false)}
                    style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    View Profile
                  </Link>

                  <Link
                    href={settingsHref}
                    onClick={() => setShowDropdown(false)}
                    style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    Account Settings
                  </Link>

                  <button
                    onClick={handleSignOut}
                    style={{
                      padding: '10px 16px',
                      fontSize: '13px',
                      color: '#EF4444',
                      background: 'none',
                      border: 'none',
                      borderTop: '1px solid var(--hairline-soft)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link href="/login" onClick={handleSignInClick}>
                <Button variant="secondary" size="sm" style={{ borderRadius: '999px' }}>Log In</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="sm" style={{ borderRadius: '999px', border: '1px solid var(--brand-green)', color: 'var(--brand-green-dark)', fontWeight: 600 }}>Join as Tutor</Button>
              </Link>
              <a href="#" onClick={handlePostTuitionClick}>
                <Button variant="primary" size="sm" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontWeight: 700 }}>Post Tuition</Button>
              </a>
            </div>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <div className="nav-actions-mobile">
          {initialized && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeaderNotificationBell user={user} profile={profile} />
              <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'var(--brand-green-dark)',
                  border: isOpen ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  background: profile?.avatar_url ? `url("${getAvatarUrl(profile.avatar_url)}") center/cover` : 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))'
                }}
              >
                {!profile?.avatar_url && (isOpen ? <X size={18} color="#fff" /> : <User size={16} color="#fff" />)}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              aria-label="Toggle menu"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
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

        {initialized && user && walletBalance !== null && (
          <Link
            href={activeRole === 'tutor' ? '/tutor/wallet' : '/client/wallet'}
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              border: '1px solid rgba(5, 150, 105, 0.2)',
              textDecoration: 'none',
              marginBottom: '12px'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--brand-green-dark)' }}>
              <Wallet size={16} color="#059669" />
              Credits Balance
            </span>
            <span style={{
              fontWeight: 800,
              fontSize: '14px',
              color: '#059669',
              backgroundColor: '#ffffff',
              padding: '2px 10px',
              borderRadius: '999px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              {walletBalance.toLocaleString()} Credits
            </span>
          </Link>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {links.map((link) => {
            const isMessagesLink = link.href.includes('/messages');
            return (
              <Link key={link.href} href={link.href} style={mobileLinkStyle} onClick={() => setIsOpen(false)}>
                <span>{link.label}</span>
                {isMessagesLink && unreadMessageCount > 0 && (
                  <span style={{
                    backgroundColor: '#EF4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    padding: '2px 8px'
                  }}>
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount} unread
                  </span>
                )}
              </Link>
            );
          })}

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

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {initialized && user ? (
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
            <>
              <Link href="/login" onClick={(e) => { setIsOpen(false); handleSignInClick(e); }} style={{ width: '100%' }}>
                <Button variant="secondary" style={{ width: '100%', borderRadius: 'var(--rounded-full)', height: '44px' }}>Log In</Button>
              </Link>
              <a href="#" onClick={(e) => { setIsOpen(false); handlePostTuitionClick(e); }} style={{ width: '100%' }}>
                <Button variant="primary" style={{ width: '100%', backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: 'var(--rounded-full)', height: '44px', fontWeight: 700 }}>Post Tuition</Button>
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
