'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Users, BookOpen, Eye, EyeOff } from 'lucide-react';

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
    name: 'Ayesha Mahmood',
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
    name: 'Zainab Fatima',
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

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

  const handleGoogleAuth = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?role=${roleSelection}&next=/client/onboarding`
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        height: '90vh',
        minHeight: '640px',
        maxHeight: '900px',
        backgroundColor: '#fff',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        fontFamily: 'inherit',
        width: '100%',
        maxWidth: '1200px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        border: '1px solid var(--hairline-strong)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={handleGoogleAuth}
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

          {/* Dark Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
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
            background: 'rgba(255, 255, 255, 0.1)',
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
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  lineHeight: '1.3',
                }}>
                  {slide.heading}
                </h3>
                <p style={{
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  color: 'rgba(255,255,255,0.9)',
                  margin: '0 0 16px 0',
                  fontStyle: 'italic',
                }}>
                  &ldquo;{slide.quote}&rdquo;
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{slide.name}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{slide.subject}</span>
                </div>
              </div>
            ))}
            
            {/* Slider Dots */}
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
    </div>
  );
}
