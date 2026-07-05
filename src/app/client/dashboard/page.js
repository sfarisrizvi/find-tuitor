import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';

export default function ParentDashboard() {
  const activeEngagements = [
    {
      id: 1,
      tutorName: 'Ahmed Raza',
      subject: 'O-Level Physics',
      child: 'Ali',
      status: 'Active - Week 3 Completed',
      mode: 'Online',
      badge: 'ID Verified'
    },
    {
      id: 2,
      tutorName: 'Sarah Khan',
      subject: 'MDCAT Biology',
      child: 'Ayesha',
      status: 'Active - Week 1 Completed',
      mode: 'Physical (Karachi)',
      badge: 'Academic Elite'
    }
  ];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>Welcome back!</h2>
          <p>Here is an overview of your active tuitions.</p>
        </div>
        <Link href="/parent/jobs/new">
          <Button variant="primary">Post a New Tuition Requirement</Button>
        </Link>
      </div>

      <h3>Active Engagements</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {activeEngagements.map((eng) => (
          <Card key={eng.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
              <div>
                <h4 style={{ marginBottom: '4px' }}>{eng.tutorName}</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Badge variant={eng.badge === 'Academic Elite' ? 'popular' : 'green-soft'}>{eng.badge}</Badge>
                  <Badge variant="purple">{eng.mode}</Badge>
                </div>
              </div>
              <img src={`https://ui-avatars.com/api/?name=${eng.tutorName}&background=00ED64&color=001E2B`} alt="avatar" style={{ borderRadius: '50%', width: '48px', height: '48px' }} />
            </div>
            
            <div style={{ color: 'var(--steel)', fontSize: '14px', marginBottom: 'var(--spacing-md)' }}>
              <p style={{ margin: '0 0 4px 0' }}><strong>Subject:</strong> {eng.subject}</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>Student:</strong> {eng.child}</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>Status:</strong> {eng.status}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" style={{ flex: 1 }}>Message</Button>
              <Button variant="primary" style={{ flex: 1 }}>Enter Class</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
