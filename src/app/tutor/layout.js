'use client';
import React from 'react';
import { usePathname } from 'next/navigation';

export default function TutorLayout({ children }) {
  const pathname = usePathname();
  const isSearchPage = pathname?.startsWith('/tutor/jobs/search');

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <div style={{ padding: isSearchPage ? '0' : 'var(--spacing-xl) 0' }}>
        {children}
      </div>
    </div>
  );
}
