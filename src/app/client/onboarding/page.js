'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

export default function ClientOnboarding() {
  const router = useRouter();
  const [clientType, setClientType] = useState('parent');
  const [childrenData, setChildrenData] = useState([{ name: '', route: '' }]);
  const [city, setCity] = useState('');
  const [studentRoute, setStudentRoute] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('client_profiles').select('client_type').eq('id', user.id).single();
        if (data) setClientType(data.client_type || 'parent');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleAddChild = () => setChildrenData([...childrenData, { name: '', route: '' }]);
  const handleRemoveChild = (index) => setChildrenData(childrenData.filter((_, i) => i !== index));
  const handleChange = (index, field, value) => {
    const updated = [...childrenData];
    updated[index][field] = value;
    setChildrenData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Update profile
      await supabase.from('client_profiles').update({
        city,
        academic_route: clientType === 'student' ? studentRoute : null
      }).eq('id', user.id);

      // Insert children if parent
      if (clientType === 'parent') {
        const inserts = childrenData.map(c => ({
          client_id: user.id,
          name: c.name,
          academic_route: c.route
        }));
        await supabase.from('children').insert(inserts);
      }
      
      router.push('/client/dashboard');
    }
  };

  if (loading) return <div className="container"><p>Loading setup...</p></div>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h2>Complete your Profile</h2>
        <p>Tell us a bit about {clientType === 'parent' ? 'your family' : 'yourself'} so we can find the perfect tutors.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Your City / Area</label>
            <select 
              className="input-field"
              style={{
                width: '100%',
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline-strong)',
                borderRadius: 'var(--rounded-md)',
                padding: '0 16px',
                height: '44px',
                fontSize: '16px',
              }}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            >
              <option value="">Select a city</option>
              <option value="karachi">Karachi</option>
              <option value="lahore">Lahore</option>
              <option value="islamabad">Islamabad / Rawalpindi</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: 'var(--spacing-lg) 0' }} />

          {clientType === 'parent' ? (
            <>
              <h3 style={{ fontSize: '20px' }}>Your Children</h3>
              <p style={{ fontSize: '14px', marginBottom: '16px' }}>Add profiles for each child you are seeking tuition for.</p>

              {childrenData.map((child, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', marginBottom: 'var(--spacing-md)', position: 'relative' }}>
                  {childrenData.length > 1 && (
                    <button type="button" onClick={() => handleRemoveChild(idx)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--accent-orange)' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginTop: '8px' }}>
                    <div>
                      <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Child&apos;s Name</label>
                      <Input placeholder="e.g. Ali" value={child.name} onChange={(e) => handleChange(idx, 'name', e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Academic Route</label>
                      <select 
                        className="input-field"
                        style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)' }}
                        value={child.route}
                        onChange={(e) => handleChange(idx, 'route', e.target.value)}
                        required
                      >
                        <option value="">Select Route</option>
                        <option value="cambridge">Cambridge (O/A Levels)</option>
                        <option value="matric">Matriculation / FSc</option>
                        <option value="entry">Entry Tests (MDCAT/ECAT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={handleAddChild} style={{ color: 'var(--brand-green-dark)', display: 'flex', gap: '8px' }}>
                <Plus size={16} /> Add another child
              </Button>
            </>
          ) : (
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Your Education</h3>
              <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block', fontWeight: 500 }}>Academic Route</label>
              <select 
                className="input-field"
                style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)' }}
                value={studentRoute}
                onChange={(e) => setStudentRoute(e.target.value)}
                required
              >
                <option value="">Select Route</option>
                <option value="cambridge">Cambridge (O/A Levels)</option>
                <option value="matric">Matriculation / FSc</option>
                <option value="university">University / Undergrad</option>
                <option value="entry">Entry Tests (MDCAT/ECAT)</option>
              </select>
            </div>
          )}

          <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'right' }}>
            <Button type="submit" variant="primary">Complete Setup</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
