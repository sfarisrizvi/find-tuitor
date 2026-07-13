'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Users, BookOpen, Eye, EyeOff } from 'lucide-react';
import { TutorCarousel } from '../../components/layout/TutorCarousel';

const ROLES = [
  {
    value: 'parent',
    label: 'Parent',
    desc: 'I am looking for a tutor for my child',
    icon: Users
  },
  {
    value: 'student',
    label: 'Student / Learner',
    desc: 'I am looking for a tutor for myself',
    icon: BookOpen
  }
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        clearInterval(interval);
        
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: async (response) => {
            setLoading(true);
            setError('');
            if (typeof window !== 'undefined') {
              localStorage.setItem('last_login_method', 'google');
            }
            const supabase = createClient();
            const { data, error: signInError } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              options: {
                data: {
                  role: 'client',
                  client_type: roleSelection,
                }
              }
            });

            if (signInError) {
              setError(signInError.message);
              setLoading(false);
            } else {
              setLoading(false);
              router.push('/client/onboarding');
            }
          }
        });

        const container = document.getElementById("google-signup-btn-container");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: container.offsetWidth || 320,
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [router, roleSelection]);

  const handleGoogleAuth = () => {
    // Handled by invisible Google SDK overlay button click
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--canvas)',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      fontFamily: 'inherit',
    }} className="grid-2col">
      <title>Sign Up | Find Tutor Online</title>
      <meta name="description" content="Create an account on Find Tutor to find verified tutors or start teaching online. Join as a parent, student, or educator." />
      <link rel="canonical" href="https://find-tuitor.com/signup" />
      <meta property="og:title" content="Sign Up | Find Tutor Online" />
      <meta property="og:description" content="Create an account on Find Tutor to find verified tutors or start teaching online. Join as a parent, student, or educator." />
      <meta property="og:url" content="https://find-tuitor.com/signup" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://find-tuitor.com/favicon.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Sign Up | Find Tutor Online" />
      <meta name="twitter:description" content="Create an account on Find Tutor to find verified tutors or start teaching online. Join as a parent, student, or educator." />
      <meta name="twitter:image" content="https://find-tuitor.com/favicon.png" />

      
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', height: '48px', width: '100%' }}>
            <button
              type="button"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '999px',
                border: '1.5px solid var(--hairline-strong)',
                backgroundColor: '#fff',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Register with Google
            </button>
            {/* Invisible Google OIDC Container overlay */}
            <div 
              id="google-signup-btn-container" 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                zIndex: 5,
              }}
            />
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

      {/* Right Side: Reusable Tutor Carousel */}
      <TutorCarousel />
    </div>
  );
}
