'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';

export function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      setUser(sessionUser);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading || !user) return null;
  if (pathname === '/client/onboarding') return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const links = [
    { name: 'Dashboard', path: '/client/dashboard' },
    { name: 'Search Tutors', path: '/client/search' },
    { name: 'My Jobs', path: '/client/jobs' },
    { name: 'Messages', path: '/client/messages' },
    { name: 'Wallet', path: '/client/wallet' },
  ];

  return (
    <div style={{
      backgroundColor: 'var(--canvas)',
      borderBottom: '1px solid var(--hairline)',
      padding: '0 32px',
      overflowX: 'auto'
    }}>
      <div className="container" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.path);
          return (
            <Link 
              key={link.name} 
              href={link.path}
              style={{
                padding: 'var(--spacing-sm) 0',
                color: isActive ? 'var(--brand-green-dark)' : 'var(--steel)',
                fontWeight: isActive ? 600 : 400,
                borderBottom: isActive ? '2px solid var(--brand-green-dark)' : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {link.name}
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          style={{
            marginLeft: 'auto',
            padding: 'var(--spacing-sm) 0',
            color: 'var(--accent-orange)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            borderBottom: '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
