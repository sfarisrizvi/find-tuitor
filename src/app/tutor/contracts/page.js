import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function TutorContracts() {
  return (
    <div className="container">
      <h2>My Contracts</h2>
      <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--steel)' }}>
        <p>You don&apos;t have any active contracts yet. Start bidding on jobs to get hired!</p>
      </Card>
    </div>
  );
}
