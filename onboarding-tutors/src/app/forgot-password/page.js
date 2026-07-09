'use client';
import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent! Check your email.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--canvas)',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      fontFamily: 'inherit',
    }} className="grid-2col">
      
      {/* Left Side: Form */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px 60px',
        maxWidth: '540px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--ink)' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FFF0F0',
            border: '1px solid #FFCCCC',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#C00',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: '#E6F9F0',
            border: '1px solid #B3E6CC',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'var(--brand-green-dark)',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email field */}
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                paddingLeft: '48px',
                borderRadius: '999px',
                height: '50px',
                borderColor: 'var(--hairline-strong)',
                fontSize: '15px',
              }}
            />
          </div>

          {/* Reset Button */}
          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              height: '50px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '15px',
              border: 'none',
              marginTop: '12px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--steel)' }}>
            Remembered your password? <Link href="/login" style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>Back to login</Link>
          </div>
        </form>
      </div>

      {/* Right Side: Illustration Panel */}
      <div style={{
        padding: '32px 32px 32px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} className="nav-links">
        <div style={{
          backgroundColor: '#f2f9f5',
          borderRadius: '24px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Simple Lock Illustration */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', margin: 'auto', display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 200 200" width="200" height="200">
              <circle cx="100" cy="100" r="90" fill="#e1f3e9" />
              <path d="M70 90 V70 C70 50 130 50 130 70 V90 Z" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" />
              <rect x="50" y="90" width="100" height="70" rx="12" fill="#22c55e" />
              <circle cx="100" cy="125" r="8" fill="#fff" />
              <path d="M100 125 V140" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ textAlign: 'center', maxWidth: '300px', marginTop: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: '1.4', margin: '0 0 8px 0' }}>
              Secure account recovery
            </h2>
            <p style={{ color: 'var(--steel)', fontSize: '14px', margin: 0 }}>
              We ensure your data is always safe. Follow the link in your email to securely reset your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
