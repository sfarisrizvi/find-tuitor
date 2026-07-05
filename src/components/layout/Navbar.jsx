'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

  const mobileLinkStyle = {
    color: 'var(--ink)',
    fontSize: '18px',
    fontWeight: 600,
    padding: '8px 0',
    borderBottom: '1px solid var(--hairline)',
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
          
          <div className="nav-links">
            <Link href="/client/search" style={linkStyle}>Find Tutors</Link>
            <Link href="/tutor/jobs" style={linkStyle}>Find Jobs</Link>
            <Link href="/#how-it-works" style={linkStyle}>How It Works</Link>
            <Link href="/contact" style={linkStyle}>Contact Us</Link>
          </div>
        </div>

        <div style={rightActionsStyle} className="nav-links">
          <Link href="/login" style={linkStyle}>Sign In</Link>
          <Link href="/register">
            <Button variant="primary">Join Free</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="nav-mobile-btn" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={`nav-mobile-overlay ${isOpen ? 'open' : ''}`}>
        <Link href="/client/search" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Find Tutors</Link>
        <Link href="/tutor/jobs" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Find Jobs</Link>
        <Link href="/#how-it-works" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>How It Works</Link>
        <Link href="/contact" style={mobileLinkStyle} onClick={() => setIsOpen(false)}>Contact Us</Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          <Link href="/login" onClick={() => setIsOpen(false)} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>Sign In</Link>
          <Link href="/register" onClick={() => setIsOpen(false)}>
            <Button variant="primary" style={{ width: '100%' }}>Join Free</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
