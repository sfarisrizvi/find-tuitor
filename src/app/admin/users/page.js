'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function AdminUsers() {
  const [filter, setFilter] = useState('All');

  const users = [
    { id: 1, name: 'Ahmed Raza', role: 'Parent', status: 'Active', joined: 'Jan 10, 2026' },
    { id: 2, name: 'Usman Tariq', role: 'Tutor', status: 'Active', joined: 'Feb 12, 2026' },
    { id: 3, name: 'Sarah Khan', role: 'Tutor', status: 'Suspended', joined: 'Mar 01, 2026' },
  ];

  const filteredUsers = filter === 'All' ? users : users.filter(u => u.status === filter);

  const filterCards = ['All', 'Active', 'Suspended'];

  return (
    <div className="container">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>User Management</h2>
        <p>Manage all tutors and clients on the platform.</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {filterCards.map(c => (
          <div 
            key={c} 
            onClick={() => setFilter(c)}
            style={{ 
              backgroundColor: 'var(--canvas)', 
              padding: '12px 24px', 
              borderRadius: 'var(--rounded-full)',
              border: filter === c ? `2px solid var(--brand-green-dark)` : '1px solid var(--hairline)',
              cursor: 'pointer',
              fontWeight: 500,
              color: filter === c ? 'var(--brand-green-dark)' : 'var(--steel)'
            }}
          >
            {c} Users
          </div>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--surface-soft)' }}>
              <th style={{ padding: '16px', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Role</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Joined</th>
              <th style={{ padding: '16px', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--hairline-soft)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{user.name}</td>
                <td style={{ padding: '16px' }}><Badge variant="purple">{user.role}</Badge></td>
                <td style={{ padding: '16px' }}><Badge variant={user.status === 'Active' ? 'green-soft' : 'popular'}>{user.status}</Badge></td>
                <td style={{ padding: '16px', color: 'var(--steel)' }}>{user.joined}</td>
                <td style={{ padding: '16px' }}>
                  <Button variant="ghost" style={{ fontSize: '13px', color: 'var(--brand-green-dark)' }}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
