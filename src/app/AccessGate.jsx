'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ComingSoon from './ComingSoon';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

function AccessGateContent({ children }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAccess = () => {
      // 1. Check URL query parameters
      const hasParam = searchParams.get('access') === 'allowed' || 
                       searchParams.has('accessallowed');
      
      if (hasParam) {
        localStorage.setItem('access_allowed', 'true');
        document.cookie = "access_allowed=true; path=/; max-age=31536000; SameSite=Lax";
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // 2. Check localStorage
      const localAllowed = localStorage.getItem('access_allowed') === 'true';
      if (localAllowed) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // 3. Check cookies
      const cookieAllowed = document.cookie.split(';').some((item) => item.trim().startsWith('access_allowed=true'));
      if (cookieAllowed) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Default to false
      setHasAccess(false);
      setLoading(false);
    };

    checkAccess();
  }, [searchParams]);

  if (loading) {
    // Return a styled loader container that matches the beige color of the coming soon screen to prevent flashing
    return (
      <div style={{
        backgroundColor: '#FBF3D5',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#17475A', fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 600 }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <ComingSoon />;
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px - 300px)' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

export default function AccessGate({ children }) {
  return (
    <Suspense fallback={
      <div style={{
        backgroundColor: '#FBF3D5',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#17475A', fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 600 }}>
          Loading...
        </div>
      </div>
    }>
      <AccessGateContent>{children}</AccessGateContent>
    </Suspense>
  );
}
