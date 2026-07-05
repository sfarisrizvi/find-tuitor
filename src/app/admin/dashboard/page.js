import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function AdminDashboard() {
  return (
    <div className="container">
      <h2>Admin Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Total Tutors</p>
          <h2 style={{ margin: 0, color: 'var(--brand-green-dark)' }}>142</h2>
        </Card>
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Pending KYC</p>
          <h2 style={{ margin: 0, color: 'var(--accent-orange)' }}>8</h2>
        </Card>
        <Card>
          <p style={{ fontSize: '14px', color: 'var(--steel)', margin: '0 0 8px 0' }}>Active Jobs</p>
          <h2 style={{ margin: 0, color: 'var(--brand-teal-deep)' }}>56</h2>
        </Card>
      </div>
    </div>
  );
}
