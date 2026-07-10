import React from 'react';
import Link from 'next/link';

export function Footer() {
  const footerStyle = {
    backgroundColor: 'var(--brand-teal-deep)',
    color: 'var(--on-dark-muted)',
    padding: 'var(--spacing-xl) var(--spacing-xxl)',
  };

  const linkStyle = {
    color: 'var(--on-dark-muted)',
    fontSize: '14px',
    textDecoration: 'none',
  };

  return (
    <footer style={footerStyle}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        gap: '20px'
      }}>
        {/* Logo */}
        <div>
          <img src="/logo_dark.svg" alt="TutorOnline.pk" style={{ height: '36px' }} />
        </div>
        
        {/* Description */}
        <p style={{ fontSize: '15px', color: 'var(--on-dark-muted)', margin: 0, lineHeight: '1.6' }}>
          Connecting students with Pakistan&apos;s best verified educators under a secure escrow framework. Simplify your learning and search verified tutors in your area.
        </p>
        
        {/* Support Email */}
        <div>
          <a href="mailto:info@tutoronline.pk" style={linkStyle}>Support: info@tutoronline.pk</a>
        </div>
        
        {/* Copyright */}
        <div style={{
          marginTop: '12px',
          paddingTop: '20px',
          borderTop: '1px solid var(--hairline-dark)',
          width: '100%',
          fontSize: '13px'
        }}>
          &copy; {new Date().getFullYear()} TutorOnline Platform Pakistan. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
