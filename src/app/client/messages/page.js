import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function ParentMessages() {
  return (
    <div className="container">
      <h2>Messages</h2>
      <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--steel)' }}>
        <p>No messages yet. When you contact a tutor, your conversations will appear here.</p>
      </Card>
    </div>
  );
}
