'use client';
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, MapPin, GraduationCap, Users, BookOpen } from 'lucide-react';

const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur',
  'Larkana', 'Sheikhupura', 'Rahim Yar Khan', 'Gujrat', 'Mardan'
];

const ROLES = [
  { value: 'parent', label: 'Parent', desc: 'Booking a tutor for my children', icon: Users },
  { value: 'student', label: 'Student', desc: 'Looking for a tutor for myself', icon: BookOpen },
  { value: 'tutor', label: 'Tutor / Teacher', desc: 'I want to offer tutoring services', icon: GraduationCap },
];

export default function Register() {
  const [roleSelection, setRoleSelection] = useState('parent');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isTutor = roleSelection === 'tutor';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (isTutor && !phone) { setError('Phone number is required for tutors.'); return; }
    if (isTutor && !city) { setError('Please select your city.'); return; }

    setLoading(true);
    const role = isTutor ? 'tutor' : 'client';
    const clientType = isTutor ? null : roleSelection;

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role, client_type: clientType } }
    });

    if (signupError) {
      setLoading(false);
      setError(signupError.message);
      return;
    }

    if (isTutor) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('profiles').update({ phone, city }).eq('id', user.id);
    }
    setLoading(false);
    router.push(role === 'tutor' ? '/tutor/onboarding' : '/client/onboarding');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-teal-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--brand-green)', fontWeight: 800, fontSize: '18px' }}>F</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--ink)' }}>FindTutors.pk</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>Create your account</h1>
          <p style={{ color: 'var(--steel)', margin: 0, fontSize: '15px' }}>Join thousands of families and tutors across Pakistan</p>
        </div>
        <Card>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>I am a...</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ROLES.map(({ value, label, desc, icon: Icon }) => {
                  const selected = roleSelection === value;
                  return (
                    <button key={value} type="button" onClick={() => setRoleSelection(value)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--rounded-md)', border: selected ? '2px solid var(--brand-green-dark)' : '2px solid var(--hairline-strong)', backgroundColor: selected ? 'var(--brand-green-soft)' : 'var(--canvas)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: selected ? 'var(--brand-green-dark)' : 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={selected ? '#fff' : 'var(--steel)'} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--steel)' }}>{desc}</div>
                      </div>
                      {selected && <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--brand-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>✓</span></div>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input type="text" placeholder="Muhammad Ali" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            {isTutor && (
              <>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                    <Input type="tel" placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} required={isTutor} style={{ paddingLeft: '40px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>City / Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', zIndex: 1 }} />
                    <select value={city} onChange={e => setCity(e.target.value)} required={isTutor} style={{ width: '100%', height: '44px', paddingLeft: '40px', paddingRight: '16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)', fontSize: '15px', color: city ? 'var(--ink)' : 'var(--stone)', cursor: 'pointer', outline: 'none' }}>
                      <option value="">Select your city</option>
                      {PAKISTANI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)' }} />
                <Input type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            {error && <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 'var(--rounded-md)', padding: '12px 16px', color: '#C00', fontSize: '14px' }}>{error}</div>}
            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', height: '48px', fontSize: '16px' }}>
              {loading ? 'Creating account…' : isTutor ? 'Create Tutor Account →' : 'Create Account →'}
            </Button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--steel)', margin: 0 }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </Card>
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--steel)' }}>
          Already have an account?{' '}<Link href="/login" style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
