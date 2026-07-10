import React from 'react';
import Link from 'next/link';

export function Footer() {
  const footerStyle = {
    backgroundColor: 'var(--brand-teal-deep)',
    color: 'var(--on-dark-muted)',
    padding: 'var(--spacing-section) var(--spacing-xxl)',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--spacing-xl)',
  };

  const headerStyle = {
    color: 'var(--on-dark)',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: 'var(--spacing-sm)',
  };

  const linkStyle = {
    display: 'block',
    color: 'var(--on-dark-muted)',
    fontSize: '14px',
    padding: 'var(--spacing-xxs) 0',
    textDecoration: 'none',
  };

  return (
    <footer style={footerStyle}>
      <div className="container" style={gridStyle}>
        <div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--on-dark)', 
            marginBottom: 'var(--spacing-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img src="/logo_dark.svg" alt="TutorOnline.pk" style={{ height: '36px' }} />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--on-dark-muted)' }}>
            Connecting students with Pakistan&apos;s best verified educators under a secure escrow framework.
          </p>
        </div>

        <div>
          <h4 style={headerStyle}>Find Tutors</h4>
          <Link href="/find-tutor" style={linkStyle}>Search Educators</Link>
          <Link href="/client/jobs/new" style={linkStyle}>Post a Requirement</Link>
          <Link href="/find-tutor" style={linkStyle}>Local Board Specialists</Link>
          <Link href="/find-tutor" style={linkStyle}>Cambridge Tutors</Link>
        </div>

        <div>
          <h4 style={headerStyle}>For Tutors</h4>
          <Link href="/tutor/jobs" style={linkStyle}>Find Tuition Jobs</Link>
          <Link href="/register" style={linkStyle}>Apply as Verified Educator</Link>
          <Link href="/register" style={linkStyle}>Success Metrics</Link>
        </div>

        <div>
          <h4 style={headerStyle}>Company</h4>
          <Link href="#" style={linkStyle}>About Our Team</Link>
          <Link href="#" style={linkStyle}>Trust, Geofencing & Safety Protocols</Link>
          <a href="mailto:info@tutoronline.pk" style={linkStyle}>Support: info@tutoronline.pk</a>
        </div>
      </div>
      
      <div className="container" style={{
        marginTop: 'var(--spacing-xl)',
        paddingTop: 'var(--spacing-md)',
        borderTop: '1px solid var(--hairline-dark)',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        &copy; 2026 TutorOnline Platform Pakistan. Secure Milestone Marketplace Architecture. All rights reserved.
      </div>
    </footer>
  );
}
