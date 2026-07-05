import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function TutorEarnings() {
  return (
    <div className="container">
      <h2>My Earnings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Card variant="feature-dark">
          <p style={{ fontSize: '14px', color: 'var(--on-dark-muted)', margin: '0 0 8px 0' }}>Available for Withdrawal</p>
          <h2 style={{ margin: 0 }}>Rs 0</h2>
        </Card>
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Pending Clearance</p>
          <h2 style={{ margin: 0, color: 'var(--brand-teal-deep)' }}>Rs 0</h2>
        </Card>
      </div>
      <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--steel)' }}>
        <p>Your transaction history will appear here.</p>
      </Card>
    </div>
  );
}
