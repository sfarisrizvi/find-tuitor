'use client';
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleSelection, setRoleSelection] = useState('parent');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Supabase credentials are not configured in .env.local yet.');
      return;
    }

    const role = roleSelection === 'tutor' ? 'tutor' : 'client';
    const clientType = roleSelection === 'tutor' ? null : roleSelection;

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          client_type: clientType
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      router.push(role === 'client' ? '/client/onboarding' : '/tutor/onboarding');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: 'var(--spacing-xxl)' }}>
      <Card>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Create an Account</h2>
        {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>I am a...</label>
            <select 
              className="input-field" 
              style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', backgroundColor: 'var(--canvas)' }}
              value={roleSelection} onChange={e => setRoleSelection(e.target.value)}
            >
              <option value="parent">Parent (Booking for children)</option>
              <option value="student">Student (Booking for myself)</option>
              <option value="tutor">Tutor</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Full Name</label>
            <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }}>Sign Up</Button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--brand-green-dark)' }}>Log in</Link>
        </div>
      </Card>
    </div>
  );
}
