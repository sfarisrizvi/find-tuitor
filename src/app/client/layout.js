import React from 'react';

export default function ClientLayout({ children }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh' }}>
      <div style={{ padding: 'var(--spacing-xl) 0' }}>
        {children}
      </div>
    </div>
  );
}
