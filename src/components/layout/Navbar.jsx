'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { User } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function Navbar() {
  const [user, setUser] = useState(null);

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
            <img src="/logo.svg" alt="FindTutors.pk" style={{ height: '32px' }} />
          </Link>
        </div>

        <div>
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
