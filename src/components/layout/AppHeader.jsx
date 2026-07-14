'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { TutorHeader } from './TutorHeader';
import { ClientHeader } from './ClientHeader';
import { GuestHeader } from './GuestHeader';

export function AppHeader() {
  const pathname = usePathname();

  // Instant static routing checks to avoid any auth queries or glitches on dashboard pages
  if (pathname?.startsWith('/tutor/')) {
    return <TutorHeader />;
  }

  if (pathname?.startsWith('/client/')) {
    return <ClientHeader />;
  }

  // Fallback to GuestHeader which has lazy session checking for public pages
  return <GuestHeader />;
}
