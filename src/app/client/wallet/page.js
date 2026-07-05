import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function ParentWallet() {
  return (
    <div className="container">
      <h2>Wallet & Payments</h2>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--steel)', margin: '0 0 8px 0' }}>Current Balance</p>
            <h3 style={{ margin: 0 }}>Rs 0</h3>
          </div>
          <Button variant="primary">Add Funds</Button>
        </div>
      </Card>
    </div>
  );
}
