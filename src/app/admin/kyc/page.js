'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export default function AdminKYC() {
  const [filter, setFilter] = useState('Pending');

  const kycRequests = [
    { id: 1, name: 'Usman Tariq', status: 'Pending', uploadedAt: '2 hours ago', docs: ['CNIC Front', 'CNIC Back', 'BSc Degree'] },
    { id: 2, name: 'Fatima Noor', status: 'Pending', uploadedAt: '5 hours ago', docs: ['CNIC Front', 'CNIC Back', 'MSc Transcript'] },
    { id: 3, name: 'Ali Khan', status: 'Approved', uploadedAt: '1 day ago', docs: ['CNIC Front', 'CNIC Back'] },
    { id: 4, name: 'Ayesha Raza', status: 'Rejected', uploadedAt: '2 days ago', docs: ['CNIC Front'] },
  ];

  const filteredData = kycRequests.filter(req => req.status === filter);

  const filterCards = [
    { label: 'Pending', count: 2, color: 'var(--accent-orange)' },
    { label: 'Approved', count: 1, color: 'var(--brand-green-dark)' },
    { label: 'Rejected', count: 1, color: 'var(--steel)' },
  ];

  return (
    <div className="container">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>KYC Document Verification</h2>
        <p>Review and verify identity and academic documents uploaded by tutors.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {filterCards.map(c => (
          <div 
            key={c.label} 
            onClick={() => setFilter(c.label)}
            style={{ 
              backgroundColor: 'var(--canvas)', 
              padding: 'var(--spacing-md)', 
              borderRadius: 'var(--rounded-md)',
              border: filter === c.label ? `2px solid ${c.color}` : '1px solid var(--hairline)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: 500 }}>{c.label} Requests</span>
            <span style={{ backgroundColor: c.color, color: 'var(--on-dark)', padding: '4px 12px', borderRadius: 'var(--rounded-full)', fontWeight: 600 }}>{c.count}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {filteredData.length === 0 ? (
          <Card style={{ textAlign: 'center', color: 'var(--steel)' }}>No requests found for this filter.</Card>
        ) : filteredData.map(req => (
          <Card key={req.id}>
            <div style={{ display: 'flex', gap: 'var(--spacing-xl)' }}>
              {/* Left Details */}
              <div style={{ width: '300px', flexShrink: 0 }}>
                <h3 style={{ marginBottom: '8px' }}>{req.name}</h3>
                <Badge variant={req.status === 'Pending' ? 'orange' : req.status === 'Approved' ? 'green' : 'popular'} style={{ marginBottom: '16px' }}>{req.status}</Badge>
                <p style={{ fontSize: '14px', color: 'var(--steel)' }}>Uploaded {req.uploadedAt}</p>
                
                <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: '8px' }}>
                  {req.status === 'Pending' && (
                    <>
                      <Button variant="primary" style={{ flex: 1 }}>Approve</Button>
                      <Button variant="secondary" style={{ flex: 1 }}>Reject</Button>
                    </>
                  )}
                </div>
              </div>

              {/* Right Documents Preview */}
              <div style={{ flex: 1, backgroundColor: 'var(--surface-soft)', borderRadius: 'var(--rounded-md)', padding: 'var(--spacing-md)' }}>
                <h4 style={{ marginBottom: '16px' }}>Uploaded Documents</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {req.docs.map((doc, idx) => (
                    <div key={idx} style={{ width: '120px', height: '80px', backgroundColor: 'var(--hairline-strong)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--on-dark)' }}>
                      {doc} IMG
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
