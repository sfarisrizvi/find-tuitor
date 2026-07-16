'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createClient } from '../../../utils/supabase/client';
import { User, Mail, Phone, MapPin, Edit3, Save, Plus, Trash2, GraduationCap, CheckCircle2, ShieldCheck, BookOpen, Layers, Milestone } from 'lucide-react';
import Link from 'next/link';

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

export default function ClientProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  
  // Edit mode toggles
  const [editBasic, setEditBasic] = useState(false);
  const [editAcademic, setEditAcademic] = useState(false);

  // Basic Details Edit State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Student Academic Edit State
  const [studentGrade, setStudentGrade] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [studentSubjects, setStudentSubjects] = useState([]);

  // Children Edit State
  const [editChildrenList, setEditChildrenList] = useState([]);

  useEffect(() => {
    const loadProfileData = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }
      setUser(authUser);

      const { data: prof } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!prof || !prof.onboarding_complete) {
        window.location.href = '/client/onboarding';
        return;
      }

      setProfile(prof);
      setFullName(prof.full_name || '');
      setPhone(prof.phone || '');
      setCity(prof.city || '');
      setAddress(prof.address || '');

      if (prof.client_type === 'student') {
        setStudentGrade(prof.grade || 'Primary');
        setStudentSchool(prof.school_college || '');
        setStudentSubjects(prof.subjects || []);
      }

      if (prof.client_type === 'parent') {
        const { data: kids } = await supabase
          .from('children')
          .select('*')
          .eq('client_id', authUser.id);
        const childrenList = kids || [];
        setChildren(childrenList);
        setEditChildrenList(childrenList.map(c => ({ ...c })));
      }
      setLoading(false);
    };
    loadProfileData();
  }, []);

  const handleSaveBasic = async () => {
    setSaving(true);
    const supabase = createClient();
    try {
      await supabase
        .from('client_profiles')
        .update({
          full_name: fullName,
          phone,
          city,
          address
        })
        .eq('id', user.id);
      
      setProfile(prev => ({ ...prev, full_name: fullName, phone, city, address }));
      setEditBasic(false);
    } catch (err) {
      console.error('Error saving basic profile info:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStudentAcademic = async () => {
    setSaving(true);
    const supabase = createClient();
    try {
      await supabase
        .from('client_profiles')
        .update({
          grade: studentGrade,
          school_college: studentSchool,
          subjects: studentSubjects
        })
        .eq('id', user.id);
      
      setProfile(prev => ({ ...prev, grade: studentGrade, school_college: studentSchool, subjects: studentSubjects }));
      setEditAcademic(false);
    } catch (err) {
      console.error('Error saving student academic info:', err);
    } finally {
      setSaving(false);
    }
  };

  // Parent Child list modifiers
  const handleAddChild = () => {
    setEditChildrenList([
      ...editChildrenList,
      { id: `temp-${Date.now()}`, client_id: user.id, name: '', grade: 'Primary', school_college: '', subjects: [] }
    ]);
  };

  const handleRemoveChild = (index) => {
    setEditChildrenList(editChildrenList.filter((_, i) => i !== index));
  };

  const handleChildFieldChange = (index, field, value) => {
    const updated = [...editChildrenList];
    updated[index][field] = value;
    if (field === 'grade') {
      updated[index].subjects = [];
    }
    setEditChildrenList(updated);
  };

  const handleChildSubjectToggle = (childIndex, subject) => {
    const updated = [...editChildrenList];
    const currentSubjects = updated[childIndex].subjects || [];
    if (currentSubjects.includes(subject)) {
      updated[childIndex].subjects = currentSubjects.filter(s => s !== subject);
    } else {
      updated[childIndex].subjects = [...currentSubjects, subject];
    }
    setEditChildrenList(updated);
  };

  const handleSaveChildren = async () => {
    setSaving(true);
    const supabase = createClient();
    try {
      await supabase.from('children').delete().eq('client_id', user.id);
      
      const inserts = editChildrenList.map(c => ({
        client_id: user.id,
        name: c.name,
        academic_route: c.grade,
        grade: c.grade,
        school_college: c.school_college,
        subjects: c.subjects
      }));

      if (inserts.length > 0) {
        await supabase.from('children').insert(inserts);
      }

      const { data: kids } = await supabase
        .from('children')
        .select('*')
        .eq('client_id', user.id);
      
      const childrenList = kids || [];
      setChildren(childrenList);
      setEditChildrenList(childrenList.map(c => ({ ...c })));
      setEditAcademic(false);
    } catch (err) {
      console.error('Error saving children list:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChildrenEdit = () => {
    setEditChildrenList(children.map(c => ({ ...c })));
    setEditAcademic(false);
  };

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
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--hairline-strong)', borderTopColor: 'var(--brand-green-dark)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', fontWeight: 500 }}>Loading profile details...</p>
        </div>
      </div>
    );
  }

  const initials = (profile.full_name || 'C')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: 'calc(100vh - 64px - 300px)', paddingBottom: '60px' }}>
      
      {/* Premium Header Banner Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--brand-teal-deep) 0%, var(--brand-green-dark) 100%)', 
        padding: '50px 20px', 
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px', color: '#fff' }}>
            Account Settings
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, margin: 0 }}>
            Manage your personal data, address location, and academic profiles.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '-40px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* Main Grid: Left Sidebar (Personal Info) + Right Settings (Academic / Children) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: PERSONAL DETAILS & SUMMARY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Avatar Circle card */}
            <Card style={{ padding: '32px', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--brand-green-dark), var(--brand-teal-mid))', 
                color: '#fff',
                fontSize: '32px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                {initials}
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
                {profile.full_name}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ 
                  backgroundColor: 'var(--brand-green-soft)', 
                  color: 'var(--brand-green-dark)', 
                  padding: '4px 12px', 
                  borderRadius: '999px', 
                  fontSize: '11px', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {profile.client_type}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--steel)' }}>&bull;</span>
                <span style={{ fontSize: '13px', color: 'var(--steel)', fontWeight: 500 }}>{profile.city}</span>
              </div>
            </Card>

            {/* Editable Personal Details Card */}
            <Card style={{ padding: '32px', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-teal-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="var(--brand-green)" /> Personal Details
                </h3>
                {!editBasic && (
                  <button 
                    onClick={() => setEditBasic(true)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--brand-green-dark)', fontWeight: 600 }}
                    title="Edit Personal Details"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>

              {editBasic ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '6px' }}>Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ height: '38px', fontSize: '14px' }} />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '6px' }}>Phone Number</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ height: '38px', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '6px' }}>City</label>
                    <select 
                      style={{
                        width: '100%', height: '38px', padding: '0 12px',
                        borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                        backgroundColor: 'var(--canvas)', fontSize: '14px', color: 'var(--ink)'
                      }}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    >
                      {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '6px' }}>Address / Location</label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} required style={{ height: '38px', fontSize: '14px' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <Button onClick={() => { setEditBasic(false); setFullName(profile.full_name); setPhone(profile.phone); setCity(profile.city); setAddress(profile.address); }} variant="secondary" style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}>Cancel</Button>
                    <Button onClick={handleSaveBasic} disabled={saving || !fullName || !phone || !city || !address} variant="primary" style={{ backgroundColor: 'var(--brand-green-dark)', color: '#fff', display: 'flex', gap: '6px', height: '34px', fontSize: '12px', padding: '0 12px' }}>
                      <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--surface-soft)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--hairline-soft)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600 }}>{profile.full_name || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--surface-soft)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--hairline-soft)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} color="var(--steel)" /> {profile.email}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--surface-soft)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--hairline-soft)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} color="var(--steel)" /> {profile.phone || 'N/A'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--surface-soft)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--hairline-soft)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>City & Address</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={12} color="var(--steel)" /> {profile.address ? `${profile.address}, ${profile.city}` : `${profile.city}`}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* QUICK ACTIONS CARD */}
            <Card style={{ padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Milestone size={16} color="var(--brand-green)" /> Quick Actions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href="/client/dashboard" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '13px', height: '38px' }}>
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/client/jobs" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '13px', height: '38px' }}>
                    View My Job Posts
                  </Button>
                </Link>
                <Link href="/client/jobs/new" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%', justifyContent: 'center', fontSize: '13px', height: '38px', backgroundColor: 'var(--brand-green)', color: '#fff', border: 'none' }}>
                    Post a New Job
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: ACADEMIC DETAILS OR CHILDREN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <Card style={{ padding: '32px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-teal-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={20} color="var(--brand-green)" /> {profile.client_type === 'parent' ? 'Children Details' : 'Academic Setup'}
                </h3>
                {(!editAcademic && profile.client_type === 'student') && (
                  <Button onClick={() => setEditAcademic(true)} variant="ghost" style={{ display: 'flex', gap: '6px', fontSize: '13px', color: 'var(--brand-green-dark)', padding: '6px 12px' }}>
                    <Edit3 size={14} /> Edit Info
                  </Button>
                )}
              </div>

              {profile.client_type === 'parent' ? (
                /* PARENT VIEW */
                editAcademic ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {editChildrenList.map((child, idx) => (
                      <div key={child.id || idx} style={{ padding: '24px', backgroundColor: 'var(--canvas)', borderRadius: '12px', border: '1px solid var(--hairline-strong)', position: 'relative' }}>
                        {editChildrenList.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveChild(idx)} 
                            style={{ position: 'absolute', top: '18px', right: '18px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: 'var(--brand-teal-deep)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Child #{idx + 1}
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Child&apos;s Name</label>
                            <Input value={child.name} onChange={(e) => handleChildFieldChange(idx, 'name', e.target.value)} required />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Grade / Class</label>
                              <select 
                                style={{
                                  width: '100%', height: '44px', padding: '0 16px',
                                  borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                                  backgroundColor: 'var(--canvas)', fontSize: '15px', color: 'var(--ink)'
                                }}
                                value={child.grade}
                                onChange={(e) => handleChildFieldChange(idx, 'grade', e.target.value)}
                                required
                              >
                                {Object.keys(GRADE_SUBJECTS).map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>School / College</label>
                              <Input value={child.school_college} onChange={(e) => handleChildFieldChange(idx, 'school_college', e.target.value)} />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '10px' }}>Subjects Needed</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {(GRADE_SUBJECTS[child.grade] || []).map(sub => {
                                const isChecked = (child.subjects || []).includes(sub);
                                return (
                                  <label key={sub} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                    borderRadius: '6px', backgroundColor: isChecked ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
                                    border: `1.5px solid ${isChecked ? 'var(--brand-green-dark)' : 'var(--hairline-soft)'}`,
                                    fontSize: '13px', cursor: 'pointer', fontWeight: isChecked ? 600 : 500,
                                    transition: 'all 0.15s ease'
                                  }}>
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked}
                                      onChange={() => handleChildSubjectToggle(idx, sub)}
                                      style={{ accentColor: 'var(--brand-green-dark)' }}
                                    />
                                    {sub}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <Button type="button" onClick={handleAddChild} variant="ghost" style={{ display: 'flex', gap: '6px', color: 'var(--brand-green-dark)', fontWeight: 600, padding: '8px 12px' }}>
                        <Plus size={15} /> Add another child
                      </Button>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Button onClick={handleCancelChildrenEdit} variant="secondary">Cancel</Button>
                        <Button onClick={handleSaveChildren} disabled={saving || editChildrenList.some(c => !c.name.trim())} variant="primary" style={{ backgroundColor: 'var(--brand-green-dark)', color: '#fff', display: 'flex', gap: '8px' }}>
                          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display View of children list with Add More Child Button */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {children.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--stone)', fontSize: '14px', fontStyle: 'italic' }}>
                          No children added yet. Click the button below to add your children.
                        </div>
                      ) : (
                        children.map((child, idx) => (
                          <div key={child.id} style={{ border: '1px solid var(--hairline-soft)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--canvas)', boxShadow: 'var(--shadow-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--brand-teal-deep)', fontWeight: 700 }}>
                                {child.name}
                              </h4>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '3px 10px', borderRadius: '4px' }}>
                                  Grade {child.grade}
                                </span>
                                <button 
                                  onClick={() => {
                                    setEditAcademic(true);
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', transition: 'color 0.2s' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand-green-dark)'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--stone)'}
                                  title="Edit Children Info"
                                >
                                  <Edit3 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ fontSize: '13px', color: 'var(--steel)', marginBottom: '16px' }}>
                              <strong>Institution:</strong> {child.school_college || 'Not specified'}
                            </div>
                            
                            <div style={{ borderTop: '1px dashed var(--hairline)', paddingTop: '14px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Subjects Requested</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(child.subjects || []).length > 0 ? (
                                  child.subjects.map(s => (
                                    <span key={s} style={{ fontSize: '12px', fontWeight: 500, color: 'var(--steel)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline-soft)', padding: '4px 10px', borderRadius: '6px' }}>
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--stone)' }}>No subjects selected</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Full width button to add more child */}
                    <Button 
                      type="button" 
                      onClick={() => { 
                        setEditAcademic(true); 
                        handleAddChild(); 
                      }} 
                      variant="primary" 
                      style={{ 
                        width: '100%', 
                        backgroundColor: 'var(--brand-green-dark)', 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'center', 
                        height: '44px', 
                        fontWeight: 600, 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 'var(--rounded-md)' 
                      }}
                    >
                      <Plus size={18} /> Add More Child
                    </Button>
                  </div>
                )
              ) : (
                /* STUDENT VIEW */
                editAcademic ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Grade / Class</label>
                        <select 
                          style={{
                            width: '100%', height: '44px', padding: '0 16px',
                            borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                            backgroundColor: 'var(--canvas)', fontSize: '15px', color: 'var(--ink)'
                          }}
                          value={studentGrade}
                          onChange={(e) => { setStudentGrade(e.target.value); setStudentSubjects([]); }}
                          required
                        >
                          {Object.keys(GRADE_SUBJECTS).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>School / College</label>
                        <Input value={studentSchool} onChange={(e) => setStudentSchool(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '10px' }}>Subjects Needed</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(GRADE_SUBJECTS[studentGrade] || []).map(sub => {
                          const isChecked = studentSubjects.includes(sub);
                          return (
                            <label key={sub} style={{
                              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                              borderRadius: '6px', backgroundColor: isChecked ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
                              border: `1.5px solid ${isChecked ? 'var(--brand-green-dark)' : 'var(--hairline-soft)'}`,
                              fontSize: '13px', cursor: 'pointer', fontWeight: isChecked ? 600 : 500,
                              transition: 'all 0.15s ease'
                            }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => handleStudentSubjectToggle(sub)}
                                style={{ accentColor: 'var(--brand-green-dark)' }}
                              />
                              {sub}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <Button onClick={() => { setEditAcademic(false); setStudentGrade(profile.grade); setStudentSchool(profile.school_college); setStudentSubjects(profile.subjects); }} variant="secondary">Cancel</Button>
                      <Button onClick={handleSaveStudentAcademic} disabled={saving} variant="primary" style={{ backgroundColor: 'var(--brand-green-dark)', color: '#fff', display: 'flex', gap: '8px' }}>
                        <Save size={15} /> {saving ? 'Saving...' : 'Save Academic Details'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                      <div style={{ backgroundColor: 'var(--surface-soft)', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--hairline-soft)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Grade / Class</div>
                        <div style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600 }}>{profile.grade || 'N/A'}</div>
                      </div>
                      
                      <div style={{ backgroundColor: 'var(--surface-soft)', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--hairline-soft)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>School / College</div>
                        <div style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600 }}>{profile.school_college || 'Not specified'}</div>
                      </div>

                      <div style={{ gridColumn: 'span 2', borderTop: '1px dashed var(--hairline)', paddingTop: '20px', marginTop: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--stone)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Subjects Needed</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {studentSubjects.length > 0 ? (
                            studentSubjects.map(s => (
                              <span key={s} style={{ fontSize: '12px', fontWeight: 500, color: 'var(--steel)', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline-soft)', padding: '4px 10px', borderRadius: '6px' }}>
                                {s}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--stone)' }}>No subjects selected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={() => setEditAcademic(true)} 
                      variant="primary" 
                      style={{ 
                        width: '100%', 
                        backgroundColor: 'var(--brand-green-dark)', 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'center', 
                        height: '44px', 
                        fontWeight: 600, 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 'var(--rounded-md)' 
                      }}
                    >
                      <Edit3 size={16} /> Edit Academic Details
                    </Button>
                  </div>
                )
              )}
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
