import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Search } from 'lucide-react';

export function Navbar() {
  const navStyle = {
    backgroundColor: 'var(--canvas)',
    borderBottom: '1px solid var(--hairline)',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  };

  const linkStyle = {
    color: 'var(--ink)',
    marginRight: 'var(--spacing-md)',
    fontSize: '14px',
    fontWeight: 500,
  };

  const rightActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  };

  return (
    <nav style={navStyle}>
      <div className="container" style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--ink)', 
            marginRight: 'var(--spacing-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ 
              width: '12px', 
              height: '24px', 
              backgroundColor: 'var(--brand-green-dark)', 
              borderRadius: '2px',
              transform: 'skewX(-15deg)'
            }} />
            FindTutors.pk
          </Link>
          
          <Link href="/client/search" style={linkStyle}>Find Tutors</Link>
          <Link href="/tutor/jobs" style={linkStyle}>Find Jobs</Link>
          <Link href="/#how-it-works" style={linkStyle}>How It Works</Link>
          <Link href="/contact" style={linkStyle}>Contact Us</Link>
        </div>

        <div style={rightActionsStyle}>
          <Link href="/login" style={linkStyle}>Sign In</Link>
          <Link href="/register">
            <Button variant="primary">Join Free</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
