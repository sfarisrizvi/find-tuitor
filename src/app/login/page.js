'use client';
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if Supabase keys are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Supabase credentials are not configured in .env.local yet.');
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (profile?.role === 'client') {
        router.push('/client/dashboard');
      } else if (profile?.role === 'tutor') {
        router.push('/tutor/dashboard');
      } else if (profile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: 'var(--spacing-xxl)' }}>
      <Card>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Welcome Back</h2>
        {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px' }}>Log In</Button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: 'var(--brand-green-dark)' }}>Sign up</Link>
        </div>
      </Card>
    </div>
  );
}
