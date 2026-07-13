'use client';
import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <CheckCircle size={64} color="var(--brand-green-mid)" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--ink)' }}>
        Thank You for Early Signup!
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--ink-light)', maxWidth: '600px' }}>
        We have received your details. You&apos;ll be given access soon.
      </p>
    </div>
  );
}
