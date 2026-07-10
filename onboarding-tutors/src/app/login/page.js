'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const TUTOR_SLIDES = [
  {
    image: '/tutors-images/304.jpg',
    name: 'Dr. Kamran Bashir',
    subject: 'Physics & Calculus Expert',
    heading: 'Inspiring Academic Excellence',
    quote: 'My goal is to simplify complex sciences and help students achieve top grades in their board examinations.'
  },
  {
    image: '/tutors-images/1783.jpg',
    name: 'Prof. Faisal Mahmood',
    subject: 'O/A-Levels Chemistry Specialist',
    heading: 'Unlocking Student Potential',
    quote: 'I design customized learning journeys that build conceptual clarity and scientific inquiry in young minds.'
  },
  {
    image: '/tutors-images/3335.jpg',
    name: 'Muhammad Ali',
    subject: 'Computer Science & Programming',
    heading: 'Building Next-Gen Innovators',
    quote: "Teaching logic and coding isn't just about syntax; it's about giving students the tools to build the future."
  },
  {
    image: '/tutors-images/56752.jpg',
    name: 'Haris Zain',
    subject: 'English Literature & SAT Prep',
    heading: 'Empowering Eloquent Voices',
    quote: 'Critical reading and writing are key life skills. I help students express themselves confidently and score high.'
  },
  {
    image: '/tutors-images/2147805628.jpg',
    name: 'Prof. Salman Shah',
    subject: 'Biology & Pre-Medical Coach',
    heading: 'Nurturing Future Doctors',
    quote: 'With focused conceptual frameworks and interactive learning, we turn biological complexities into intuitive knowledge.'
  }
];

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [lastUsed, setLastUsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last_login_method');
    }
    return null;
  });
  const [currentSlide, setCurrentSlide] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TUTOR_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        const targetUrl = nextParam || (role === 'client' ? '/client/dashboard' : (role === 'tutor' ? '/tutor/dashboard' : (role === 'admin' ? '/admin/dashboard' : '/')));
        router.replace(targetUrl);
      }
    };
    checkUser();
  }, [router, nextParam]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Supabase credentials are not configured in .env.local yet.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_login_method', 'email');
      }
      const role = data.user.user_metadata?.role;
      setLoading(false);
      const targetUrl = nextParam || (role === 'client' ? '/client/dashboard' : (role === 'tutor' ? '/tutor/dashboard' : (role === 'admin' ? '/admin/dashboard' : '/')));
      router.push(targetUrl);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleGoogleAuth = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_login_method', 'google');
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${nextParam || '/tutor/dashboard'}`
      }
    });
  };

  return (
    <div style={{
      minHeight: '90vh',
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

        {/* Welcome Back Header with Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <img src="/logo.svg" alt="TutorOnline.pk" style={{ height: '36px' }} />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--ink)' }}>
            Welcome back!
          </h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Simplify your learning and search verified tutors in your area with <strong>TutorOnline.pk</strong>. Get started for free.
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Social Sign Ins (Only full-width Google button) - Google Above */}
          <div style={{ position: 'relative' }}>
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              style={{
                width: '100%',
                height: '50px',
                borderRadius: '999px',
                border: '1.5px solid var(--hairline-strong)',
                backgroundColor: '#fff',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Login with Google
            </button>
            {lastUsed === 'google' && (
              <span style={{
                position: 'absolute',
                top: '-10px',
                right: '24px',
                backgroundColor: 'var(--brand-green-dark)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                pointerEvents: 'none',
              }}>
                Last Used
              </span>
            )}
          </div>

          {/* Continue with Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '8px 0',
            color: 'var(--stone)',
            fontSize: '13px',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
            <span style={{ padding: '0 12px', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--hairline-strong)' }} />
          </div>

          {/* Login Form Below */}
          <form onSubmit={handleLogin} style={{ display: 'flex', dataType: 'form', flexDirection: 'column', gap: '16px' }}>

            {/* Email field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input
                  type="email"
                  placeholder="name@example.com"
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
            </div>

            {/* Password field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '18px', top: '30%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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
                <Link href="/forgot-password" style={{ display: 'flex', justifyContent: 'right', paddingTop: '12px', fontSize: '13px', color: 'var(--brand-green-dark)', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '33%',
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
            </div>

            {/* Login Button with Last Used Label */}
            <div style={{ position: 'relative', marginTop: '12px' }}>
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
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              {lastUsed === 'email' && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '24px',
                  backgroundColor: 'var(--brand-green-dark)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  pointerEvents: 'none',
                }}>
                  Last Used
                </span>
              )}
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--steel)' }}>
          Not a member? <Link href="/register" style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>Register now</Link>
        </div>
      </div>

      {/* Right Side: Illustration Panel with Carousel */}
      <div style={{
        padding: '24px 24px 24px 0',
        height: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'block',
      }} className="nav-links">
        <div style={{
          borderRadius: '24px',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}>
          {/* Images */}
          {TUTOR_SLIDES.map((slide, idx) => (
            <img
              key={slide.image}
              src={slide.image}
              alt={slide.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: idx === currentSlide ? 0.75 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: 1,
              }}
            />
          ))}

          {/* Dark Overlay to help readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 100%, rgba(0,0,0,0.7) 0%)',
            zIndex: 2,
            pointerEvents: 'none',
          }} />

          {/* Testimonial Glassmorphic Box */}
          <div style={{
            position: 'absolute',
            bottom: '32px',
            left: '24px',
            right: '24px',
            zIndex: 3,
            background: 'rgba(0, 33, 73, 0.34)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '28px',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          }}>
            {/* Carousel Content */}
            {TUTOR_SLIDES.map((slide, idx) => (
              <div
                key={slide.name}
                style={{
                  display: idx === currentSlide ? 'block' : 'none',
                  opacity: idx === currentSlide ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                }}
              >
                {/* Heading */}
                <h3 style={{
                  fontSize: '22px',
                  color: 'var(--brand-green)',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  lineHeight: '1.3',
                }}>
                  {slide.heading}
                </h3>

                {/* Quote */}
                <p style={{
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.9)',
                  margin: '0 0 16px 0',
                  fontStyle: 'italic',
                }}>
                  &ldquo;{slide.quote}&rdquo;
                </p>

                {/* Tutor Info */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{slide.name}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{slide.subject}</span>
                </div>
              </div>
            ))}

            {/* Slider Dots Indicator */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
              {TUTOR_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: idx === currentSlide ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)' }}>
        Loading...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
