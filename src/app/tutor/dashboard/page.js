import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import Link from 'next/link';

export default function TutorDashboard() {
  return (
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Card variant="feature-dark">
          <p style={{ fontSize: '14px', color: 'var(--on-dark-muted)', margin: '0 0 8px 0' }}>Available Balance</p>
          <h2 style={{ margin: 0 }}>Rs 45,000</h2>
          <Button variant="secondary-on-dark" style={{ marginTop: '16px', fontSize: '12px', padding: '6px 12px' }}>Withdraw Funds</Button>
        </Card>
        
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Active Contracts</p>
          <h2 style={{ margin: 0, color: 'var(--brand-teal-deep)' }}>3</h2>
          <Link href="/tutor/contracts" style={{ display: 'inline-block', marginTop: '16px', fontSize: '14px', color: 'var(--brand-green-dark)' }}>View Details &rarr;</Link>
        </Card>
        
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Available Connects</p>
          <h2 style={{ margin: 0, color: 'var(--brand-teal-deep)' }}>24</h2>
          <p style={{ fontSize: '12px', color: 'var(--stone)', margin: '16px 0 0 0' }}>Resets in 14 days</p>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>Recommended Jobs</h3>
        <Link href="/tutor/jobs">
          <Button variant="secondary">Browse All Jobs</Button>
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--brand-green-dark)' }}>Looking for O-Level Physics Tutor</h4>
              <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 16px 0' }}>Posted 2 hours ago &bull; Physical (DHA, Lahore)</p>
            </div>
            <h4 style={{ margin: 0 }}>Rs 5,000/hr</h4>
          </div>
          <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>
            Need an experienced tutor for my son who is appearing for exams in May. Must be able to visit our house 3 days a week.
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Badge variant="purple">O-Levels</Badge>
            <Badge variant="orange">Physics</Badge>
            <span style={{ fontSize: '14px', color: 'var(--steel)' }}>Costs 2 Connects</span>
            <Button variant="primary" style={{ marginLeft: 'auto' }}>Submit Proposal</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
