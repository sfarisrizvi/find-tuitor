'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ComingSoon from './ComingSoon';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

function AccessGateContent({ children }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAccess = () => {
      // 1. Check URL query parameters
      const hasParam = searchParams.get('access') === 'allowed' || 
                       searchParams.has('accessallowed');
      

      if (hasParam) {
        localStorage.setItem('access_allowed', 'true');
        const cookieJSON = JSON.stringify({ allow: true });
        document.cookie = `access_allowed=${encodeURIComponent(cookieJSON)}; path=/; max-age=315360000; SameSite=Lax`;
        setHasAccess(true);
        setIsMounted(true);
        return;
      }

      // 2. Check localStorage
      const localAllowed = localStorage.getItem('access_allowed') === 'true';
      if (localAllowed) {
        setHasAccess(true);
        setIsMounted(true);
        return;
      }

      // 3. Check cookies
      const rawCookie = document.cookie.split(';').find((item) => item.trim().startsWith('access_allowed='));
      if (rawCookie) {
        const val = decodeURIComponent(rawCookie.split('=')[1].trim());
        if (val === 'true' || val === '{"allow":true}') {
          setHasAccess(true);
          setIsMounted(true);
          return;
        }
        try {
          const parsed = JSON.parse(val);
          if (parsed === true || (parsed && parsed.allow === true)) {
            setHasAccess(true);
            setIsMounted(true);
            return;
          }
        } catch (e) {
          // ignore
        }
      }

      // Access not allowed
      setHasAccess(false);
      setIsMounted(true);
    };

    checkAccess();
  }, [searchParams]);


  // During SSR/static page compilation and initial client hydration,
  // we render ComingSoon. This guarantees that no website contents
  // are compiled into the HTML of index.html or leaked to the user.
  if (!isMounted) {
    return <ComingSoon />;
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
    <Suspense fallback={<ComingSoon />}>
      <AccessGateContent>{children}</AccessGateContent>
    </Suspense>
  );
}
