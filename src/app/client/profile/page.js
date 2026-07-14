'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createClient } from '../../../utils/supabase/client';
import { User, Mail, Phone, MapPin, Edit3, Save, Plus, Trash2, GraduationCap, CheckCircle2 } from 'lucide-react';

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
    // reset subjects if grade level changes
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
      // Delete existing children
      await supabase.from('children').delete().eq('client_id', user.id);
      
      // Filter out temp IDs for inserts (or let DB generate them)
      const inserts = editChildrenList.map(c => ({
        client_id: user.id,
        name: c.name,
        academic_route: c.grade, // fallback mapping
        grade: c.grade,
        school_college: c.school_college,
        subjects: c.subjects
      }));

      if (inserts.length > 0) {
        await supabase.from('children').insert(inserts);
      }

      // Re-fetch children list from DB to get verified IDs
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
        <p style={{ fontSize: '18px', fontWeight: 500 }}>Loading profile details...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: 'calc(100vh - 64px - 300px)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>
          My Account Profile
        </h2>
        <p style={{ color: 'var(--steel)', marginBottom: '32px', fontSize: '15px' }}>
          Manage your personal information, address, and {profile.client_type === 'parent' ? 'children education details' : 'your academic details'}.
        </p>

        {/* 1. Basic / Contact Details Card */}
        <Card style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-teal-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} color="var(--brand-green)" /> Personal Details
            </h3>
            {!editBasic && (
              <Button onClick={() => setEditBasic(true)} variant="ghost" style={{ display: 'flex', gap: '6px', fontSize: '13px', color: 'var(--brand-green-dark)' }}>
                <Edit3 size={15} /> Edit
              </Button>
            )}
          </div>

          {editBasic ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Phone Number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>City</label>
                  <select 
                    style={{
                      width: '100%', height: '44px', padding: '0 16px',
                      borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                      backgroundColor: 'var(--canvas)', fontSize: '15px'
                    }}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  >
                    {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Area Address / Location</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button onClick={() => { setEditBasic(false); setFullName(profile.full_name); setPhone(profile.phone); setCity(profile.city); setAddress(profile.address); }} variant="secondary">Cancel</Button>
                <Button onClick={handleSaveBasic} disabled={saving || !fullName || !phone || !city || !address} variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', display: 'flex', gap: '8px' }}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</div>
                <div style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500 }}>{profile.full_name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</div>
                <div style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="var(--steel)" /> {profile.email}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</div>
                <div style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="var(--steel)" /> {profile.phone || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>City & Address</div>
                <div style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--steel)" /> {profile.address}, {profile.city}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 2. Dynamic Academic / Children Details Card */}
        <Card style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-teal-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap size={20} color="var(--brand-green)" /> {profile.client_type === 'parent' ? 'Children Details' : 'Academic Setup'}
            </h3>
            {!editAcademic && (
              <Button onClick={() => setEditAcademic(true)} variant="ghost" style={{ display: 'flex', gap: '6px', fontSize: '13px', color: 'var(--brand-green-dark)' }}>
                <Edit3 size={15} /> Edit Info
              </Button>
            )}
          </div>

          {profile.client_type === 'parent' ? (
            /* Parent / Children view */
            editAcademic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {editChildrenList.map((child, idx) => (
                  <div key={child.id || idx} style={{ padding: '20px', backgroundColor: 'var(--canvas)', borderRadius: '10px', border: '1px solid var(--hairline-strong)', position: 'relative' }}>
                    {editChildrenList.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveChild(idx)} 
                        style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: 'var(--brand-teal-deep)' }}>Child #{idx + 1}</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Child&apos;s Name</label>
                        <Input value={child.name} onChange={(e) => handleChildFieldChange(idx, 'name', e.target.value)} required />
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
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Subjects Needed</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                          {(GRADE_SUBJECTS[child.grade] || []).map(sub => {
                            const isChecked = (child.subjects || []).includes(sub);
                            return (
                              <label key={sub} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                                borderRadius: '4px', backgroundColor: isChecked ? 'var(--brand-green-soft)' : 'var(--surface)',
                                border: `1px solid ${isChecked ? 'var(--brand-green)' : 'var(--hairline-soft)'}`,
                                fontSize: '12px', cursor: 'pointer'
                              }}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleChildSubjectToggle(idx, sub)}
                                  style={{ accentColor: 'var(--brand-green)' }}
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
                  <Button type="button" onClick={handleAddChild} variant="ghost" style={{ display: 'flex', gap: '6px', color: 'var(--brand-green-dark)', fontWeight: 600 }}>
                    <Plus size={15} /> Add another child
                  </Button>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Button onClick={handleCancelChildrenEdit} variant="secondary">Cancel</Button>
                    <Button onClick={handleSaveChildren} disabled={saving || editChildrenList.some(c => !c.name)} variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', display: 'flex', gap: '8px' }}>
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Children'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Display View of children list */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {children.map((child, idx) => (
                  <div key={child.id} style={{ border: '1px solid var(--hairline)', borderRadius: '8px', padding: '20px', backgroundColor: 'var(--canvas)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--brand-teal-deep)', fontWeight: 700 }}>
                      {child.name}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--steel)' }}>
                      <strong>Grade:</strong> {child.grade}
                    </p>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--steel)' }}>
                      <strong>School/College:</strong> {child.school_college || 'Not specified'}
                    </p>
                    
                    <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Subjects Needed:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(child.subjects || []).length > 0 ? (
                        child.subjects.map(s => (
                          <span key={s} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '4px 10px', borderRadius: '4px' }}>
                            {s}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--stone)' }}>No subjects selected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Student view */
            editAcademic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Grade / Class</label>
                    <select 
                      style={{
                        width: '100%', height: '44px', padding: '0 16px',
                        borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)',
                        backgroundColor: 'var(--canvas)', fontSize: '15px'
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--brand-teal-deep)', marginBottom: '8px' }}>Subjects Needed</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {(GRADE_SUBJECTS[studentGrade] || []).map(sub => {
                      const isChecked = studentSubjects.includes(sub);
                      return (
                        <label key={sub} style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                          borderRadius: '4px', backgroundColor: isChecked ? 'var(--brand-green-soft)' : 'var(--surface)',
                          border: `1px solid ${isChecked ? 'var(--brand-green)' : 'var(--hairline-soft)'}`,
                          fontSize: '12px', cursor: 'pointer'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleStudentSubjectToggle(sub)}
                            style={{ accentColor: 'var(--brand-green)' }}
                          />
                          {sub}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <Button onClick={() => { setEditAcademic(false); setStudentGrade(profile.grade); setStudentSchool(profile.school_college); setStudentSubjects(profile.subjects); }} variant="secondary">Cancel</Button>
                  <Button onClick={handleSaveStudentAcademic} disabled={saving} variant="primary" style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', display: 'flex', gap: '8px' }}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Academic Details'}
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Grade / Class</div>
                  <div style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500 }}>{profile.grade || 'N/A'}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>School / College</div>
                  <div style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500 }}>{profile.school_college || 'Not specified'}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '12px', color: 'var(--steel)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Subjects Needed:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {studentSubjects.length > 0 ? (
                      studentSubjects.map(s => (
                        <span key={s} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-green-dark)', backgroundColor: 'var(--brand-green-soft)', padding: '4px 10px', borderRadius: '4px' }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--stone)' }}>No subjects selected</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </Card>

      </div>
    </div>
  );
}
