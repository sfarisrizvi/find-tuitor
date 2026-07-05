import React from 'react';
import { TutorNav } from '../../components/layout/TutorNav';

export default function TutorLayout({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <TutorNav />
      <div style={{ padding: 'var(--spacing-xl) 0' }}>
        {children}
      </div>
    </div>
  );
}
