'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Users, BookOpen, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { value: 'parent', label: 'Parent', desc: 'Booking a tutor for my children', icon: Users },
  { value: 'student', label: 'Student', desc: 'Looking for a tutor for myself', icon: BookOpen },
];

export default function Signup() {
  const [roleSelection, setRoleSelection] = useState('parent');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        if (role === 'client') {
          router.replace('/client/dashboard');
        } else if (role === 'tutor') {
          router.replace('/tutor/dashboard');
        } else if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          const { data: clientProf } = await supabase.from('client_profiles').select('id').eq('id', session.user.id).maybeSingle();
          if (clientProf) {
            router.replace('/client/dashboard');
          } else {
            router.replace('/tutor/dashboard');
          }
        }
      }
    };
    checkUser();
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    const clientType = roleSelection; // parent or student

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role: 'client', client_type: clientType } }
    });

    if (signupError) {
      setLoading(false);
      setError(signupError.message);
      return;
    }

    setLoading(false);
    router.push('/client/onboarding');
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
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
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--ink)' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Join thousands of families and tutors across Pakistan on <strong>TutorOnline.pk</strong>
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

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Role Cards Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px', fontSize: '14px', color: 'var(--ink)' }}>
              I am a...
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ROLES.map(({ value, label, desc, icon: Icon }) => {
                const selected = roleSelection === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRoleSelection(value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '16px',
                      border: selected
                        ? '2px solid var(--brand-green-dark)'
                        : '1.5px solid var(--hairline-strong)',
                      backgroundColor: selected ? 'var(--brand-green-soft)' : 'var(--canvas)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      backgroundColor: selected ? 'var(--brand-green-dark)' : 'var(--surface-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color={selected ? '#fff' : 'var(--steel)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--steel)', marginTop: '1px' }}>{desc}</div>
                    </div>
                    {selected && (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-green-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              style={{
                paddingLeft: '48px',
                borderRadius: '999px',
                height: '48px',
                borderColor: 'var(--hairline-strong)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Email */}
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
                height: '48px',
                borderColor: 'var(--hairline-strong)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                paddingLeft: '48px',
                paddingRight: '48px',
                borderRadius: '999px',
                height: '48px',
                borderColor: 'var(--hairline-strong)',
                fontSize: '14px',
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

          {/* Confirm Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={{
                paddingLeft: '48px',
                borderRadius: '999px',
                height: '48px',
                borderColor: 'var(--hairline-strong)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              height: '48px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '15px',
              border: 'none',
              marginTop: '8px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px 0 12px',
            color: 'var(--stone)',
            fontSize: '13px',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
            <span style={{ padding: '0 12px' }}>or register with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          </div>

          {/* Social Logins */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => triggerToast('Google signup coming soon!')}
              style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#fff"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => triggerToast('Apple signup coming soon!')}
              style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.58 2.98-1.43" fill="#fff"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => triggerToast('Facebook signup coming soon!')}
              style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#fff"/>
              </svg>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--steel)' }}>
            Tutor or Teacher? <Link href="/register" style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>Join here</Link>
          </div>
        </form>

        {/* Dynamic Toast Message */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
          }}>
            {toastMsg}
          </div>
        )}
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
          justifyContent: 'space-between',
          padding: '48px 32px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}>
          
          {/* Custom SVG Illustration */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', margin: 'auto' }}>
            <svg viewBox="0 0 300 300" width="100%" height="100%">
              <circle cx="150" cy="150" r="110" fill="#e1f3e9" />
              <path d="M 50 150 Q 80 80 150 70 T 250 150" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,5" />
              
              <g id="character">
                <path d="M 120 220 Q 90 230 110 240 Q 140 240 150 220" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 180 220 Q 210 230 190 240 Q 160 240 150 220" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 110 160 C 110 210 190 210 190 160 Z" fill="#22c55e" stroke="#000" strokeWidth="3" />
                <path d="M 150 165 C 135 165 130 180 150 195 C 170 180 165 165 150 165 Z" fill="#fff" />
                <path d="M 110 160 Q 80 160 90 185 Q 100 200 115 190" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 190 160 Q 220 160 210 185 Q 200 200 185 190" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <rect x="144" y="125" width="12" height="15" fill="#fbcfe8" stroke="#000" strokeWidth="3" />
                <circle cx="150" cy="115" r="22" fill="#fbcfe8" stroke="#000" strokeWidth="3" />
                <path d="M 144 115 Q 147 118 150 115" fill="none" stroke="#000" strokeWidth="2" />
                <circle cx="143" cy="109" r="2" fill="#000" />
                <circle cx="157" cy="109" r="2" fill="#000" />
                <path d="M 128 115 C 128 95 172 95 172 115 C 172 120 165 125 150 120 C 135 125 128 120 128 115 Z" fill="#1e293b" />
              </g>

              {/* Floating Widget Card */}
              <foreignObject x="10" y="160" width="120" height="75">
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink)' }}>A-Levels Physics</div>
                  <div style={{ fontSize: '8px', color: 'var(--stone)' }}>12 Classes</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <div style={{ width: '48px', height: '4px', backgroundColor: 'var(--hairline-strong)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: '84%', height: '100%', backgroundColor: '#22c55e' }} />
                    </div>
                    <span style={{ fontSize: '8px', fontWeight: 600 }}>84%</span>
                  </div>
                </div>
              </foreignObject>

              {/* Floating avatars */}
              <circle cx="250" cy="160" r="16" fill="#fbcfe8" stroke="#000" strokeWidth="1.5" />
              <path d="M 242 166 Q 250 158 258 166" fill="none" stroke="#000" strokeWidth="1.5" />
              <circle cx="250" cy="155" r="4" fill="#000" />
              
              <circle cx="50" cy="90" r="16" fill="#fed7aa" stroke="#000" strokeWidth="1.5" />
              <path d="M 42 96 Q 50 88 58 96" fill="none" stroke="#000" strokeWidth="1.5" />
              <circle cx="50" cy="85" r="4" fill="#000" />
            </svg>
          </div>

          {/* Slider Dots */}
          <div style={{ display: 'flex', gap: '6px', margin: '24px 0 16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--stone)' }} />
            <div style={{ width: '16px', height: '6px', borderRadius: '999px', backgroundColor: '#000' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--stone)' }} />
          </div>

          <div style={{ textAlign: 'center', maxWidth: '300px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: '1.4', margin: '0 0 8px 0' }}>
              Make learning easier and organized with TutorOnline.pk
            </h2>
          </div>
        </div>
      </div>

    </div>
  );
}
