'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';

export default function TutorOnboarding() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    city: '',
    subjects: '',
    rate: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push('/tutor/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h2>Tutor Verification & KYC</h2>
        <p>To ensure safety and quality, all tutors must provide academic and identity documents.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Your City / Area</label>
              <select className="input-field" style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)' }} required>
                <option value="">Select City</option>
                <option>Karachi</option>
                <option>Lahore</option>
                <option>Islamabad</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px' }}>Hourly Rate (PKR)</label>
              <Input type="number" placeholder="e.g. 2500" required />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: 'var(--spacing-lg) 0' }} />

          <h3>Document Uploads</h3>
          <p style={{ fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>Upload clear, readable images. Maximum file size is 5MB.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ border: '2px dashed var(--hairline-strong)', padding: 'var(--spacing-lg)', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
              <UploadCloud size={32} style={{ color: 'var(--steel)', marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px 0' }}>CNIC (Front & Back)</h4>
              <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>Required for ID Verification badge</p>
              <Button type="button" variant="secondary">Browse Files</Button>
            </div>

            <div style={{ border: '2px dashed var(--hairline-strong)', padding: 'var(--spacing-lg)', borderRadius: 'var(--rounded-md)', textAlign: 'center' }}>
              <UploadCloud size={32} style={{ color: 'var(--steel)', marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 4px 0' }}>Latest Academic Transcript / Degree</h4>
              <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>Required for Academic Elite badge</p>
              <Button type="button" variant="secondary">Browse Files</Button>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--semantic-warning-bg, #FFF9C4)', padding: '16px', borderRadius: '8px', marginTop: 'var(--spacing-lg)', fontSize: '14px', color: 'var(--charcoal)' }}>
            <strong>Note:</strong> Your profile will be limited to 2 active bids until an Admin manually approves your documents.
          </div>

          <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'right' }}>
            <Button type="submit" variant="primary">Submit for Verification</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
