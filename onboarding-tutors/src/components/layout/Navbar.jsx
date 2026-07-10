'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { User } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    const initUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Error initializing user in navbar:', err);
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null;
      setUser(u);
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
    window.location.href = '/api/auth/signout';
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

  return (
    <nav style={navStyle}>
      <div className="container" style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--ink)', 
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img src="/logo.svg" alt="TutorOnline.pk" style={{ height: '32px' }} />
          </Link>
        </div>

        <div>
          {user ? (
            <Button variant="primary" size="sm" onClick={handleSignOut} style={{ backgroundColor: '#dc2626', color: '#fff' }}>
              Sign Out
            </Button>
          ) : pathname === '/register' ? (
            <Link href="/login">
              <Button variant="primary" size="sm">Login</Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button variant="primary" size="sm">Register</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
