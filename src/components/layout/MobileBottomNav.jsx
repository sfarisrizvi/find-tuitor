'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  Search,
  MessageSquare,
  Wallet,
  User,
  FileText,
  PlusCircle,
  LogIn
} from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);

  // Hide on admin routes or onboarding
  const isAdmin = pathname?.startsWith('/admin');
  const isOnboarding = pathname === '/tutor/onboarding' || pathname === '/client/onboarding';

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (!currentUser) {
          setRole('guest');
          return;
        }

        // Determine role from route or metadata
        let detectedRole = currentUser.user_metadata?.role;
        if (pathname?.startsWith('/tutor/')) {
          detectedRole = 'tutor';
        } else if (pathname?.startsWith('/client/')) {
          detectedRole = 'client';
        }

        if (!detectedRole || detectedRole === 'guest') {
          // Check tables
          const { data: clientProf } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (clientProf) {
            detectedRole = 'client';
          } else {
            detectedRole = 'tutor';
          }
        }

        if (!cancelled) setRole(detectedRole);

        // Fetch unread messages count
        const { data: unread } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', currentUser.id)
          .eq('read', false);

        if (!cancelled && unread) {
          setUnreadCount(unread.length);
        }

        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!cancelled && wallet) {
          setWalletBalance(Number(wallet.balance) || 0);
        }
      } catch (err) {
        console.error('Error in MobileBottomNav init:', err);
      }
    };

    checkSession();

    // Listen for custom read events from chat
    const handleMessagesRead = () => {
      setUnreadCount(0);
    };

    const handleWalletUpdated = (e) => {
      if (e?.detail?.balance !== undefined) {
        setWalletBalance(e.detail.balance);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('messages_read', handleMessagesRead);
      window.addEventListener('wallet_updated', handleWalletUpdated);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('messages_read', handleMessagesRead);
        window.removeEventListener('wallet_updated', handleWalletUpdated);
      }
    };
  }, [pathname]);

  if (isAdmin || isOnboarding) {
    return null;
  }

  // Navigation Items by Role
  const getNavItems = () => {
    if (user && role === 'tutor') {
      return [
        {
          label: 'Home',
          href: '/tutor/dashboard',
          icon: Home,
          isActive: pathname === '/tutor/dashboard'
        },
        {
          label: 'Find Jobs',
          href: '/tutor/jobs/search',
          icon: Search,
          isActive: pathname?.startsWith('/tutor/jobs')
        },
        {
          label: 'Contracts',
          href: '/tutor/contracts',
          icon: FileText,
          isActive: pathname?.startsWith('/tutor/contracts')
        },
        {
          label: 'Messages',
          href: '/tutor/messages',
          icon: MessageSquare,
          isActive: pathname?.startsWith('/tutor/messages'),
          badge: unreadCount
        },
        {
          label: 'Wallet',
          href: '/tutor/wallet',
          icon: Wallet,
          isActive: pathname?.startsWith('/tutor/wallet')
        }
      ];
    }

    if (user && role === 'client') {
      return [
        {
          label: 'Home',
          href: '/client/dashboard',
          icon: Home,
          isActive: pathname === '/client/dashboard'
        },
        {
          label: 'My Jobs',
          href: '/client/jobs',
          icon: Briefcase,
          isActive: pathname?.startsWith('/client/jobs')
        },
        {
          label: 'Messages',
          href: '/client/messages',
          icon: MessageSquare,
          isActive: pathname?.startsWith('/client/messages'),
          badge: unreadCount
        },
        {
          label: 'Wallet',
          href: '/client/wallet',
          icon: Wallet,
          isActive: pathname?.startsWith('/client/wallet')
        },
        {
          label: 'Profile',
          href: '/client/profile',
          icon: User,
          isActive: pathname?.startsWith('/client/profile')
        }
      ];
    }

    // Guest / Logged out
    return [
      {
        label: 'Home',
        href: '/',
        icon: Home,
        isActive: pathname === '/'
      },
      {
        label: 'Find Tutors',
        href: '/find-tutor',
        icon: Search,
        isActive: pathname?.startsWith('/find-tutor') || pathname?.startsWith('/tutors')
      },
      {
        label: 'Post Tuition',
        href: '/client/jobs/new',
        icon: PlusCircle,
        isActive: pathname === '/client/jobs/new'
      },
      {
        label: 'Find Jobs',
        href: '/tutor/jobs',
        icon: Briefcase,
        isActive: pathname?.startsWith('/tutor/jobs')
      },
      {
        label: 'Log In',
        href: '/login',
        icon: LogIn,
        isActive: pathname === '/login' || pathname === '/register'
      }
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      id="mobile-app-bottom-nav"
      className="mobile-bottom-nav-container"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--hairline-strong)',
        boxShadow: '0 -4px 20px rgba(0, 30, 43, 0.06)',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        display: 'none', // Controlled by media query class
        alignItems: 'center',
        justifyContent: 'space-around'
      }}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const active = item.isActive;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              padding: '6px 2px',
              minHeight: '48px',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            {/* Active Top Pill Indicator */}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '28px',
                  height: '3px',
                  backgroundColor: 'var(--brand-green-dark)',
                  borderRadius: '0 0 4px 4px'
                }}
              />
            )}

            {/* Icon Wrapper with Badge */}
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease'
              }}
            >
              <IconComponent
                size={21}
                color={active ? 'var(--brand-green-dark)' : 'var(--steel)'}
                strokeWidth={active ? 2.3 : 1.8}
              />

              {/* Notification Badge */}
              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-9px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 3.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #FFFFFF',
                    lineHeight: 1
                  }}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--brand-green-dark)' : 'var(--steel)',
                marginTop: '3px',
                letterSpacing: '-0.2px',
                lineHeight: 1.1
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
