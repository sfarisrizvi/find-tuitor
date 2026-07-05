import React from 'react';
import { AdminNav } from '../../components/layout/AdminNav';

export default function AdminLayout({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <AdminNav />
      <div style={{ padding: 'var(--spacing-xl) 0' }}>
        {children}
      </div>
    </div>
  );
}
