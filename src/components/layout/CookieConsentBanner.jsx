'use client';
import React, { useState, useEffect } from 'react';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('cookie_consent_choice');
    }
    return false;
  });

  const updateConsent = (granted) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': granted ? 'granted' : 'denied',
        'ad_storage': granted ? 'granted' : 'denied',
        'ad_user_data': granted ? 'granted' : 'denied',
        'ad_personalization': granted ? 'granted' : 'denied',
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChoice = localStorage.getItem('cookie_consent_choice');
      if (savedChoice === 'all') {
        updateConsent(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent_choice', 'all');
    updateConsent(true);
    setShowBanner(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('cookie_consent_choice', 'essential');
    updateConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      maxWidth: '440px',
      backgroundColor: 'rgba(0, 30, 43, 0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      color: '#fff',
      zIndex: 99999,
      animation: 'fadeInUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>🍪</span>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
          Privacy & Cookie Preferences
        </h4>
      </div>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
        We use cookies and analytics to enhance your browsing experience, measure performance, and connect families with Pakistan&apos;s top verified tutors.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleAcceptAll}
          style={{
            flex: 1,
            height: '40px',
            backgroundColor: 'var(--brand-green)',
            color: 'var(--on-primary)',
            border: 'none',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Accept All
        </button>
        <button
          onClick={handleEssentialOnly}
          style={{
            flex: 1,
            height: '40px',
            backgroundColor: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '999px',
            fontWeight: 500,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
