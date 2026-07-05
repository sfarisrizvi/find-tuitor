'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createClient } from '../../../utils/supabase/client';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Phone, 
  Mail, 
  Award, 
  Calendar,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

const mockTutors = [
  {
    id: 'mock-1',
    full_name: 'Dr. Usman Tariq',
    city: 'Lahore',
    academic_route: 'Cambridge (O/A Levels)',
    kyc_status: 'approved',
    jss_score: 100,
    qualification: 'Ph.D. Physics (FAST-NU Alum)',
    bio: 'Ex-Professor at FAST NUCES, 15+ years teaching Physics & Math. I specialize in helping students break down complex physics concepts into easily digestible logical steps. My students consistently score A* in A-Levels.',
    rate: 'Rs 4,500/hr',
    phone: '+92 300 9876543',
    email: 'usman.tariq@example.com',
    experience: '15+ Years Board Academy Exp',
    about: 'I specialize in helping students break down complex physics concepts into easily digestible logical steps.'
  },
  {
    id: 'mock-2',
    full_name: 'Miss Sana Khan',
    city: 'Islamabad',
    academic_route: 'Entry Tests (MDCAT/ECAT)',
    kyc_status: 'approved',
    jss_score: 98,
    qualification: 'MSc Applied Biosciences (NUST)',
    bio: 'Specialist in A-Level Biology & MDCAT prep. 142 hours logged. Master molecular biology concepts and memorize tricky biochemistry structures using shorthand mnemonics.',
    rate: 'Rs 3,500/hr',
    phone: '+92 321 1234567',
    email: 'sana.khan@example.com',
    experience: '5+ Years Biology Instruction',
    about: 'Master molecular biology concepts and memorize tricky biochemistry structures using shorthand mnemonics.'
  },
  {
    id: 'mock-3',
    full_name: 'Sir Ahmed Shah',
    city: 'Lahore',
    academic_route: 'Matriculation / FSc',
    kyc_status: 'approved',
    jss_score: 99,
    qualification: 'MSc Mathematics (Punjab Uni)',
    bio: 'FSc & Matric Math expert. 8+ years board academy experience. Simplified shortcuts for integration and differentiation.',
    rate: 'Rs 3,000/hr',
    phone: '+92 333 4567890',
    email: 'ahmed.shah@example.com',
    experience: '8+ Years Board Instruction',
    about: 'Simplified shortcuts for integration and differentiation.'
  }
];

export default function TutorProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [tutor, setTutor] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auth view inside gate (default signup)
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientType, setClientType] = useState('parent');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const fetchSession = async () => {
    const supabase = createClient();
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    setUser(sessionUser);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchSession();
      
      // Load profile details
      if (id.startsWith('mock-')) {
        const found = mockTutors.find(t => t.id === id);
        setTutor(found || mockTutors[0]);
      } else {
        const supabase = createClient();
        const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (data) {
          setTutor({
            id: data.id,
            full_name: data.full_name,
            city: data.city || 'Pakistan',
            qualification: data.academic_route ? `${data.academic_route.toUpperCase()} Tutor` : 'Vetted Tutor',
            bio: 'Vetted teacher on the FindTutors platform.',
            jss_score: data.jss_score || 95,
            kyc_status: data.kyc_status,
            rate: 'Negotiable / Hour',
            phone: 'Locked. Sign in to view',
            email: 'Locked. Sign in to view',
            experience: 'Vetted Educator',
            about: 'Available for Home & Online tuition.'
          });
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const supabase = createClient();

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'client',
            client_type: clientType
          }
        }
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthMessage('Account created! Logging in...');
        // Auto signin after signup
        const { data } = await supabase.auth.signInWithPassword({ email, password });
        if (data?.user) {
          setUser(data.user);
        }
      }
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
      } else {
        setUser(data.user);
      }
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px' }}><p>Loading tutor profile...</p></div>;
  if (!tutor) return <div className="container" style={{ padding: '40px' }}><p>Tutor not found.</p></div>;

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: 'calc(100vh - 64px)', padding: 'var(--spacing-xl) 0' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Profile Card Header */}
        <Card style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', border: '1px solid var(--hairline-strong)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--brand-green-soft)' }}>
              <img 
                src={`https://ui-avatars.com/api/?name=${tutor.full_name}&background=001E2B&color=00ED64&size=100`} 
                alt={tutor.full_name} 
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>{tutor.full_name}</h1>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--brand-green-dark)', fontWeight: 600 }}>
                      <MapPin size={14} /> {tutor.city}
                    </span>
                    <span style={{ fontSize: '13px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {tutor.kyc_status === 'approved' ? 'Verified ID' : 'Vetting Pending'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 600, color: 'var(--charcoal)' }}>
                    <Star size={16} fill="var(--accent-orange)" color="var(--accent-orange)" /> 5.0
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--steel)' }}>{tutor.jss_score || 95}% Job Success</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Content (Gated Section) */}
        <div style={{ position: 'relative' }}>
          
          {/* Blurred overlay container */}
          <div style={{
            filter: user ? 'none' : 'blur(8px)',
            pointerEvents: user ? 'auto' : 'none',
            transition: 'filter 0.3s ease-out'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 'var(--spacing-lg)' }}>
              
              {/* Left Column: Bio & Track record */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>About Me</h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--charcoal)' }}>{tutor.bio}</p>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--charcoal)', margin: 0 }}>{tutor.about}</p>
                </Card>

                <Card style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Experience & Academic Route</h3>
                  <p style={{ fontSize: '15px', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="var(--brand-green-dark)" /> <strong>{tutor.experience}</strong>
                  </p>
                  <p style={{ fontSize: '15px', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <BookOpen size={18} color="var(--brand-green-dark)" /> Vetted for: <strong>{tutor.academic_route || 'All Boards'}</strong>
                  </p>
                </Card>
              </div>

              {/* Right Column: Contact Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card style={{ padding: '24px', backgroundColor: 'var(--brand-green-soft)' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--brand-green-dark)', fontWeight: 600, marginBottom: '16px' }}>Tuition Rates</h3>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>{tutor.rate}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--slate)', margin: 0 }}>milestone escrow payment guaranteed.</p>
                </Card>

                <Card style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Verified Contact Info</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Phone size={16} /> <span>{tutor.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Mail size={16} /> <span>{tutor.email}</span>
                    </div>
                  </div>
                </Card>
              </div>

            </div>
          </div>

          {/* Registration Gate Modal (Only when unauthenticated) */}
          {!user && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <Card style={{
                maxWidth: '440px',
                width: '100%',
                padding: '32px',
                boxShadow: 'var(--shadow-modal)',
                border: '2px solid var(--brand-green)',
                backgroundColor: 'white'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Lock size={28} color="var(--brand-green-dark)" style={{ marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0' }}>Join to Unlock Full Profile</h3>
                  <p style={{ fontSize: '14px', color: 'var(--steel)', margin: 0 }}>
                    Sign up or Log in in seconds to unlock phone numbers, detailed credentials, and direct chat.
                  </p>
                </div>

                {authError && <div style={{ color: 'red', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{authError}</div>}
                {authMessage && <div style={{ color: 'var(--brand-green-dark)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{authMessage}</div>}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>I am a...</label>
                        <select 
                          className="input-field" 
                          value={clientType} 
                          onChange={e => setClientType(e.target.value)}
                          style={{
                            width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--rounded-md)',
                            border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)'
                          }}
                        >
                          <option value="parent">Parent</option>
                          <option value="student">Student</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Full Name</label>
                        <Input placeholder="Your Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                      </div>
                    </>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Email Address</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Password</label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>

                  <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }}>
                    {authMode === 'signup' ? 'Sign Up & Continue' : 'Log In & Continue'}
                  </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
                  {authMode === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button onClick={() => setAuthMode('login')} style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>
                        Log In
                      </button>
                    </>
                  ) : (
                    <>
                      Need an account?{' '}
                      <button onClick={() => setAuthMode('signup')} style={{ color: 'var(--brand-green-dark)', fontWeight: 600 }}>
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
