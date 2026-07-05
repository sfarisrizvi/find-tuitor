import React from 'react';
import { ClientNav } from '../../components/layout/ClientNav';

export default function ClientLayout({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <ClientNav />
      <div style={{ padding: 'var(--spacing-xl) 0' }}>
        {children}
      </div>
    </div>
  );
}
