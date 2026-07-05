import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function TutorMessages() {
  return (
    <div className="container">
      <h2>Messages</h2>
      <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--steel)' }}>
        <p>No messages yet. Parents will reach out to you when they accept your proposals.</p>
      </Card>
    </div>
  );
}
