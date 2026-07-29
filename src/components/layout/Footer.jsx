import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export function Footer() {
  const footerStyle = {
    backgroundColor: 'var(--brand-teal-deep)',
    color: 'var(--on-dark-muted)',
    padding: '48px 16px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 'var(--spacing-xl)',
  };

  const headerStyle = {
    color: 'var(--on-dark)',
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: 'var(--spacing-sm)',
  };

  const linkStyle = {
    display: 'block',
    color: 'var(--on-dark-muted)',
    fontSize: '14px',
    padding: '4px 0',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  };

  const iconBtnStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ED64',
    transition: 'transform 0.2s ease, border-color 0.2s ease, backgroundColor 0.2s ease',
    textDecoration: 'none'
  };

  return (
    <footer style={footerStyle}>
      <div className="container" style={gridStyle}>
        
        {/* Brand Intro Column */}
        <div style={{ maxWidth: '280px' }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--on-dark)', 
            marginBottom: 'var(--spacing-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img src="/light%20logo.svg" alt="TutorOnline.pk" style={{ height: '24px' }} />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--on-dark-muted)', lineHeight: '1.6' }}>
            TutorOnline is building the trusted infrastructure for private education—connecting families with Pakistan&apos;s best verified tutors.
          </p>
        </div>

        {/* Column 1: Find Tutor */}
        <div>
          <h4 style={headerStyle}>Find Tutor</h4>
          <Link href="/find-tutor/search?level=Primary" style={linkStyle}>Primary Level</Link>
          <Link href="/find-tutor/search?level=Secondary" style={linkStyle}>Secondary Level</Link>
          <Link href="/find-tutor/search?level=Inter%2FO%27Levels" style={linkStyle}>Inter/O&apos;Levels</Link>
          <Link href="/find-tutor/search?level=University" style={linkStyle}>University Level</Link>
        </div>

        {/* Column 2: Join Us */}
        <div>
          <h4 style={headerStyle}>Join Us</h4>
          <Link href="/register" style={linkStyle}>Register as Tutor</Link>
          <Link href="/signup" style={linkStyle}>Join as Parent/Student</Link>
        </div>

        {/* Column 3: Important Links */}
        <div>
          <h4 style={headerStyle}>Important Links</h4>
          <Link href="/" style={linkStyle}>Home</Link>
          <Link href="/find-tutor/search" style={linkStyle}>Find Tutor</Link>
          <Link href="/tutor/jobs" style={linkStyle}>Find Jobs</Link>
          <Link href="/contact" style={linkStyle}>Contact</Link>
          <Link href="/login" style={linkStyle}>Login</Link>
        </div>

        {/* Column 4: Support */}
        <div>
          <h4 style={headerStyle}>Support</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {/* Email Icon + Written Email */}
            <a href="mailto:support@tutoronline.pk" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="#00ED64" />
              <span>support@tutoronline.pk</span>
            </a>

            {/* WhatsApp Icon + Written Number */}
            <a href="https://wa.me/923455235079" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '8px', color: '#00ED64' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>+92 345 5235079</span>
            </a>
          </div>

          {/* Social Icons Only */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Facebook Icon Only */}
            <a 
              href="https://www.facebook.com/mytutoronline" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="Facebook"
              style={iconBtnStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram Icon Only */}
            <a 
              href="https://www.instagram.com/tutoronline.pk_/" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="Instagram"
              style={iconBtnStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* WhatsApp Icon Only */}
            <a 
              href="https://wa.me/923455235079" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="WhatsApp"
              style={iconBtnStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className="container" style={{
        marginTop: 'var(--spacing-xl)',
        paddingTop: 'var(--spacing-md)',
        borderTop: '1px solid var(--hairline-dark)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13px',
        color: 'var(--on-dark-muted)'
      }}>
        <div>
          &copy; 2026 TutorOnline Platform Pakistan. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: 'var(--on-dark-muted)', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ color: 'var(--on-dark-muted)', textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
