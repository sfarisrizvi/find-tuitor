'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { AuthSidebar } from '../../components/layout/AuthSidebar';

const PAKISTANI_CITIES = ['Islamabad', 'Rawalpindi', 'Attock', 'Lahore', 'Karachi'];

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
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
                  role: 'tutor'
                }
              }
            });

            if (signInError) {
              setError(signInError.message);
              setLoading(false);
            } else {
              setLoading(false);
              router.push('/tutor/onboarding');
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
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!phone) { setError('Phone number is required.'); return; }
    if (!city) { setError('Please select your city.'); return; }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          city
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Successful registration and login
      router.push('/tutor/onboarding');

    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div style={{
      minHeight: '90vh',
      backgroundColor: 'var(--canvas)',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      fontFamily: 'inherit',
    }} className="grid-2col">
      <title>Tutor Registration | Join as an Educator | TutorOnline.pk</title>
      <meta name="description" content="Register as a tutor on TutorOnline.pk. Vetted educators earn, set their own rates, teach online, and manage milestones securely." />
      <link rel="canonical" href="https://tutoronline.pk/register" />
      <meta property="og:site_name" content="TutorOnline.pk" />
      <meta property="og:title" content="Tutor Registration | Join as an Educator | TutorOnline.pk" />
      <meta property="og:description" content="Register as a tutor on TutorOnline.pk. Vetted educators earn, set their own rates, teach online, and manage milestones securely." />
      <meta property="og:url" content="https://tutoronline.pk/register" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://tutoronline.pk/featured-image.jpg" />
      <meta property="og:image:secure_url" content="https://tutoronline.pk/featured-image.jpg" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Tutor Registration | Join as an Educator | TutorOnline.pk" />
      <meta name="twitter:description" content="Register as a tutor on TutorOnline.pk. Vetted educators earn, set their own rates, teach online, and manage milestones securely." />
      <meta name="twitter:image" content="https://tutoronline.pk/featured-image.jpg" />


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
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--ink)' }}>
            Join as a Tutor
          </h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Create your profile, set your rates, and teach students across Pakistan on <strong>TutorOnline.pk</strong>
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

          {/* Phone Number */}
          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
            <Input
              type="tel"
              placeholder="Phone Number (e.g. +92 300 1234567)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
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

          {/* City Selection */}
          <div style={{ position: 'relative' }}>
            <MapPin size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', zIndex: 1 }} />
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              required
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '48px',
                paddingRight: '48px',
                borderRadius: '999px',
                border: '1.5px solid var(--hairline-strong)',
                backgroundColor: 'var(--canvas)',
                fontSize: '14px',
                color: city ? 'var(--ink)' : 'var(--stone)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              <option value="">Select your city</option>
              {PAKISTANI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }} />
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
            {loading ? 'Creating Tutor Account...' : 'Create Tutor Account'}
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
            Parent or Student? <Link href={typeof window !== 'undefined' && window.location.hostname.includes('signup') ? "https://tutoronline.pk/signup" : "/signup"} style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>Create Account here</Link>
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

      {/* Right Side: Reusable Auth Sidebar with Lottie */}
      <AuthSidebar />

    </div>
  );
}
