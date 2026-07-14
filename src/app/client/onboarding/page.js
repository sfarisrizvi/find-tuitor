'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronRight, CheckCircle2, User, Users, GraduationCap, MapPin, Phone, Building } from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

const GRADE_SUBJECTS = {
  'Primary': ['Mathematics', 'English', 'Science', 'Urdu', 'Islamiyat', 'General Knowledge'],
  'Secondary': ['Mathematics', 'English', 'General Science', 'Urdu', 'Islamiyat', 'Social Studies', 'Computer Science'],
  'Matric': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu'],
  'FSc': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu'],
  'O-Level': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Islamiyat', 'Pakistan Studies'],
  'A-Level': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accounting', 'Economics', 'Business Studies'],
  'University': ['Calculus', 'Computer Programming', 'Data Structures', 'Organic Chemistry', 'Physics', 'English Literature', 'Microeconomics']
};

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Faisalabad', 
  'Multan', 'Gujranwala', 'Sialkot', 'Quetta', 'Hyderabad', 'Abbottabad'
];

export default function ClientOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Form Fields
  const [clientType, setClientType] = useState('parent'); // 'parent' or 'student'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Parent Onboarding Child State
  const [childrenData, setChildrenData] = useState([
    { name: '', grade: 'Primary', school_college: '', subjects: [] }
  ]);

  // Student Onboarding State
  const [studentGrade, setStudentGrade] = useState('Primary');
  const [studentSchool, setStudentSchool] = useState('');
  const [studentSubjects, setStudentSubjects] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }
      setUser(authUser);
      setEmail(authUser.email || '');
      setFullName(authUser.user_metadata?.full_name || '');

      // Fetch existing client profile
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        if (profile.onboarding_complete) {
          router.replace('/client/profile');
          return;
        }
        setClientType(profile.client_type || 'parent');
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.phone) setPhone(profile.phone);
        if (profile.city) setCity(profile.city);
        if (profile.address) setAddress(profile.address);
        if (profile.onboarding_step) setStep(profile.onboarding_step);

        if (profile.client_type === 'student') {
          if (profile.grade) setStudentGrade(profile.grade);
          if (profile.school_college) setStudentSchool(profile.school_college);
          if (profile.subjects) setStudentSubjects(profile.subjects || []);
        }

        // Fetch children if parent
        if (profile.client_type === 'parent') {
          const { data: kids } = await supabase
            .from('children')
            .select('*')
            .eq('client_id', authUser.id);
          if (kids && kids.length > 0) {
            setChildrenData(kids.map(k => ({
              name: k.name,
              grade: k.grade || 'Primary',
              school_college: k.school_college || '',
              subjects: k.subjects || []
            })));
          }
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const saveProgress = async (nextStep) => {
    setSaving(true);
    const supabase = createClient();
    try {
      // 1. Update basic client profile details
      const updatePayload = {
        full_name: fullName,
        phone,
        city,
        address,
        client_type: clientType,
        onboarding_step: nextStep
      };

      if (clientType === 'student') {
        updatePayload.grade = studentGrade;
        updatePayload.school_college = studentSchool;
        updatePayload.subjects = studentSubjects;
      }

      await supabase
        .from('client_profiles')
        .update(updatePayload)
        .eq('id', user.id);

      // 2. If parent and moving past details/children setup, sync children
      if (clientType === 'parent' && step === 3) {
        // Delete old children records
        await supabase.from('children').delete().eq('client_id', user.id);
        
        // Insert new ones
        const inserts = childrenData.map(c => ({
          client_id: user.id,
          name: c.name,
          academic_route: c.grade, // fallback/legacy mapping
          grade: c.grade,
          school_college: c.school_college,
          subjects: c.subjects
        }));
        if (inserts.length > 0) {
          await supabase.from('children').insert(inserts);
        }
      }

      setStep(nextStep);
    } catch (err) {
      console.error('Error saving onboarding step:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    const supabase = createClient();
    try {
      // Mark onboarding as complete
      await supabase
        .from('client_profiles')
        .update({
          onboarding_complete: true,
          onboarding_step: 4
        })
        .eq('id', user.id);

      setStep(4);
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  // Step 3 Child Modifiers
  const handleAddChild = () => {
    setChildrenData([...childrenData, { name: '', grade: 'Primary', school_college: '', subjects: [] }]);
  };

  const handleRemoveChild = (index) => {
    setChildrenData(childrenData.filter((_, i) => i !== index));
  };

  const handleChildChange = (index, field, value) => {
    const updated = [...childrenData];
    updated[index][field] = value;
    setChildrenData(updated);
  };

  const handleChildSubjectToggle = (childIndex, subject) => {
    const updated = [...childrenData];
    const currentSubjects = updated[childIndex].subjects;
    if (currentSubjects.includes(subject)) {
      updated[childIndex].subjects = currentSubjects.filter(s => s !== subject);
    } else {
      updated[childIndex].subjects = [...currentSubjects, subject];
    }
    setChildrenData(updated);
  };

  // Student Subject Modifiers
  const handleStudentSubjectToggle = (subject) => {
    if (studentSubjects.includes(subject)) {
      setStudentSubjects(studentSubjects.filter(s => s !== subject));
    } else {
      setStudentSubjects([...studentSubjects, subject]);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)' }}>
        <p style={{ fontSize: '18px', fontWeight: 500 }}>Loading setup...</p>
      </div>
    );
  }

  const progressPct = (step / 4) * 100;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px - 300px)', padding: '40px 20px', backgroundColor: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Progress Tracker */}
      {step < 4 && (
        <div style={{ width: '100%', maxWidth: '640px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>Step {step} of 3</span>
            <span>{Math.round(progressPct)}% Complete</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--hairline-strong)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--brand-green)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '640px' }}>
        {step === 1 && (
          <Card style={{ padding: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-teal-deep)', textAlign: 'center', margin: '0 0 8px 0' }}>Welcome to TutorOnline!</h2>
            <p style={{ color: 'var(--steel)', textAlign: 'center', margin: '0 0 32px 0', fontSize: '15px' }}>Help us personalize your tutoring dashboard. Tell us who you are:</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div 
                onClick={() => setClientType('parent')}
                style={{
                  border: `2px solid ${clientType === 'parent' ? 'var(--brand-green)' : 'var(--hairline-strong)'}`,
                  backgroundColor: clientType === 'parent' ? 'var(--brand-green-soft)' : 'var(--canvas)',
                  borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--brand-teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <Users size={24} color="var(--brand-teal-deep)" />
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--brand-teal-deep)' }}>Parent / Guardian</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--steel)' }}>Finding tutors for children</p>
              </div>

              <div 
                onClick={() => setClientType('student')}
                style={{
                  border: `2px solid ${clientType === 'student' ? 'var(--brand-green)' : 'var(--hairline-strong)'}`,
                  backgroundColor: clientType === 'student' ? 'var(--brand-green-soft)' : 'var(--canvas)',
                  borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--brand-teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <User size={24} color="var(--brand-teal-deep)" />
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--brand-teal-deep)' }}>Student</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--steel)' }}>Finding tutors for myself</p>
              </div>
            </div>

            <Button 
              onClick={() => saveProgress(2)} 
              variant="primary" 
              style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 700, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}
            >
              Continue <ChevronRight size={18} style={{ marginLeft: '4px' }} />
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card style={{ padding: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-teal-deep)', margin: '0 0 8px 0' }}>Contact & Location Details</h3>
            <p style={{ color: 'var(--steel)', margin: '0 0 28px 0', fontSize: '14px' }}>Please complete your contact details below so verified tutors can contact you.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Your Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--steel)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <Input 
                    placeholder="Enter your full name" 
                    style={{ paddingLeft: '40px' }} 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Email Address</label>
                <Input value={email} disabled style={{ backgroundColor: 'var(--surface)', cursor: 'not-allowed' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--steel)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <Input 
                    placeholder="e.g. 03001234567" 
                    style={{ paddingLeft: '40px' }} 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="var(--steel)" style={{ position: 'absolute', left: '14px', top: '14px', zIndex: 10 }} />
                  <select 
                    style={{
                      width: '100%', height: '44px', paddingLeft: '40px', paddingRight: '16px',
                      borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                      backgroundColor: 'var(--canvas)', fontSize: '15px'
                    }}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  >
                    <option value="">Select your city</option>
                    {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Area / Location Address</label>
                <Input 
                  placeholder="e.g. DHA Phase 6, Sector C" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Button onClick={() => setStep(1)} variant="secondary" style={{ flex: 1 }}>Back</Button>
              <Button 
                onClick={() => saveProgress(3)} 
                disabled={saving || !fullName || !phone || !city || !address} 
                variant="primary" 
                style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}
              >
                {saving ? 'Saving...' : 'Next Step'}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card style={{ padding: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-teal-deep)', margin: '0 0 8px 0' }}>
              {clientType === 'parent' ? 'Children Details' : 'Education Details'}
            </h3>
            <p style={{ color: 'var(--steel)', margin: '0 0 28px 0', fontSize: '14px' }}>
              {clientType === 'parent' 
                ? 'Add profiles for each of your children who need tutoring support.' 
                : 'Help us understand your current academic details.'}
            </p>

            {clientType === 'parent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '32px' }}>
                {childrenData.map((child, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', 
                      border: '1px solid var(--hairline-strong)', position: 'relative' 
                    }}
                  >
                    {childrenData.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveChild(idx)} 
                        style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: 'var(--brand-teal-deep)' }}>Child #{idx + 1}</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Child&apos;s Name</label>
                        <Input 
                          placeholder="e.g. Ali Faris" 
                          value={child.name} 
                          onChange={(e) => handleChildChange(idx, 'name', e.target.value)} 
                          required 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Grade / Class</label>
                          <select 
                            style={{
                              width: '100%', height: '44px', padding: '0 16px',
                              borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                              backgroundColor: 'var(--canvas)', fontSize: '15px'
                            }}
                            value={child.grade}
                            onChange={(e) => handleChildChange(idx, 'grade', e.target.value)}
                            required
                          >
                            {Object.keys(GRADE_SUBJECTS).map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>School / College</label>
                          <Input 
                            placeholder="e.g. Beaconhouse" 
                            value={child.school_college} 
                            onChange={(e) => handleChildChange(idx, 'school_college', e.target.value)} 
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Subjects Needed</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                          {(GRADE_SUBJECTS[child.grade] || []).map(subject => {
                            const isChecked = child.subjects.includes(subject);
                            return (
                              <label 
                                key={subject} 
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                  borderRadius: '6px', backgroundColor: isChecked ? 'var(--brand-green-soft)' : 'var(--canvas)',
                                  border: `1px solid ${isChecked ? 'var(--brand-green)' : 'var(--hairline-soft)'}`,
                                  fontSize: '13px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s ease'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleChildSubjectToggle(idx, subject)}
                                  style={{ accentColor: 'var(--brand-green)' }}
                                />
                                {subject}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleAddChild} 
                  style={{ display: 'flex', gap: '8px', color: 'var(--brand-green-dark)', fontWeight: 600 }}
                >
                  <Plus size={16} /> Add another child
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Your Grade / Class</label>
                    <select 
                      style={{
                        width: '100%', height: '44px', padding: '0 16px',
                        borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                        backgroundColor: 'var(--canvas)', fontSize: '15px'
                      }}
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      required
                    >
                      {Object.keys(GRADE_SUBJECTS).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Your School / College</label>
                    <Input 
                      placeholder="e.g. GCU Lahore" 
                      value={studentSchool} 
                      onChange={(e) => setStudentSchool(e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Subjects You Need Tutoring In</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {(GRADE_SUBJECTS[studentGrade] || []).map(subject => {
                      const isChecked = studentSubjects.includes(subject);
                      return (
                        <label 
                          key={subject} 
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                            borderRadius: '6px', backgroundColor: isChecked ? 'var(--brand-green-soft)' : 'var(--canvas)',
                            border: `1px solid ${isChecked ? 'var(--brand-green)' : 'var(--hairline-soft)'}`,
                            fontSize: '13px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s ease'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleStudentSubjectToggle(subject)}
                            style={{ accentColor: 'var(--brand-green)' }}
                          />
                          {subject}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <Button onClick={() => setStep(2)} variant="secondary" style={{ flex: 1 }}>Back</Button>
              <Button 
                onClick={handleComplete} 
                disabled={saving || (clientType === 'parent' && childrenData.some(c => !c.name))} 
                variant="primary" 
                style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}
              >
                {saving ? 'Completing...' : 'Complete Onboarding'}
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <CheckCircle2 size={44} color="var(--brand-green)" />
            </div>
            
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-teal-deep)', margin: '0 0 12px 0' }}>Profile Setup Complete!</h2>
            <p style={{ color: 'var(--steel)', margin: '0 0 32px 0', fontSize: '16px', lineHeight: '1.6' }}>
              Thank you for completing your profile setup. Your details have been saved, and we are ready to match you with top verified tutors!
            </p>

            <Button 
              onClick={() => router.push('/find-tutor/search')} 
              variant="primary" 
              style={{ width: '100%', maxWidth: '280px', height: '48px', fontSize: '15px', fontWeight: 700, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)' }}
            >
              Search for Tutors &rarr;
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
