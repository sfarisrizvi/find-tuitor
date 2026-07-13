'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated (token should be processed by supabase-js)
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your password reset link is invalid or has expired. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
            Update Password
          </h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Please enter your new password below.
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

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Password field */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                paddingLeft: '48px',
                paddingRight: '48px',
                borderRadius: '999px',
                height: '50px',
                borderColor: 'var(--hairline-strong)',
                fontSize: '15px',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: 'var(--stone)',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Update Button */}
          <Button
            type="submit"
            disabled={loading || !!error.includes('expired')}
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
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
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
          {/* Simple Shield Illustration */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', margin: 'auto', display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 200 200" width="200" height="200">
              <circle cx="100" cy="100" r="90" fill="#e1f3e9" />
              <path d="M100 40 L160 60 V100 C160 140 100 170 100 170 C100 170 40 140 40 100 V60 Z" fill="#22c55e" />
              <path d="M80 105 L95 120 L125 90" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div style={{ textAlign: 'center', maxWidth: '300px', marginTop: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: '1.4', margin: '0 0 8px 0' }}>
              Your account is safe
            </h2>
            <p style={{ color: 'var(--steel)', fontSize: '14px', margin: 0 }}>
              Create a strong password to keep your account secure on TutorOnline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
