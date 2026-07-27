'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileText, ExternalLink } from 'lucide-react';

export default function AdminKYC() {
  const [filter, setFilter] = useState('pending');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      if (res.ok && data.requests) {
        setTutors(data.requests);
      }
    } catch (err) {
      console.error('Error fetching admin KYC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleAction = async (tutorId, action) => {
    setActionLoading(tutorId);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId, action })
      });
      const data = await res.json();
      if (res.ok) {
        setTutors(prev => prev.map(t => t.id === tutorId ? { ...t, kyc_status: action === 'approve' ? 'approved' : 'rejected', verified: action === 'approve' } : t));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = tutors.filter(t => (t.kyc_status || 'pending') === 'pending').length;
  const approvedCount = tutors.filter(t => t.kyc_status === 'approved').length;
  const rejectedCount = tutors.filter(t => t.kyc_status === 'rejected').length;

  const filteredData = tutors.filter(t => (t.kyc_status || 'pending') === filter);

  const filterCards = [
    { label: 'pending', display: 'Pending', count: pendingCount, color: 'var(--accent-orange)' },
    { label: 'approved', display: 'Approved', count: approvedCount, color: 'var(--brand-green-dark)' },
    { label: 'rejected', display: 'Rejected', count: rejectedCount, color: '#EF4444' },
  ];

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>KYC Document Verification</h2>
        <p style={{ color: 'var(--steel)' }}>Review and verify identity and academic documents uploaded by tutors.</p>
      </div>

      {/* Filter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {filterCards.map(c => (
          <div 
            key={c.label} 
            onClick={() => setFilter(c.label)}
            style={{ 
              backgroundColor: 'var(--canvas)', 
              padding: '16px 20px', 
              borderRadius: 'var(--rounded-md)',
              border: filter === c.label ? `2px solid ${c.color}` : '1px solid var(--hairline)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '15px' }}>{c.display} Requests</span>
            <span style={{ backgroundColor: c.color, color: '#fff', padding: '4px 12px', borderRadius: 'var(--rounded-full)', fontWeight: 700, fontSize: '13px' }}>
              {c.count}
            </span>
          </div>
        ))}
      </div>

      {/* Tutors List */}
      {loading ? (
        <p style={{ color: 'var(--steel)' }}>Loading verification requests...</p>
      ) : filteredData.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px', color: 'var(--steel)' }}>
          No {filter} KYC verification requests found.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {filteredData.map(req => {
            const kycDocs = req.kyc_docs || {};
            const docEntries = Object.entries(kycDocs).filter(([k, v]) => !!v);

            return (
              <Card key={req.id}>
                <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                  {/* Left Details */}
                  <div style={{ width: '280px', flexShrink: 0 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{req.full_name || 'Anonymous Tutor'}</h3>
                    <div style={{ marginBottom: '12px' }}>
                      <Badge variant={(req.kyc_status || 'pending') === 'pending' ? 'orange' : req.kyc_status === 'approved' ? 'green-soft' : 'popular'}>
                        {req.kyc_status ? req.kyc_status.toUpperCase() : 'PENDING'}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--steel)', margin: '0 0 16px 0' }}>
                      City: <strong>{req.city || 'Not specified'}</strong>
                    </p>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        variant="primary" 
                        disabled={actionLoading === req.id || req.kyc_status === 'approved'}
                        onClick={() => handleAction(req.id, 'approve')}
                        style={{ flex: 1, backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', fontSize: '13px' }}
                      >
                        {actionLoading === req.id ? 'Saving...' : 'Approve'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        disabled={actionLoading === req.id || req.kyc_status === 'rejected'}
                        onClick={() => handleAction(req.id, 'reject')}
                        style={{ flex: 1, color: '#EF4444', borderColor: '#FCA5A5', fontSize: '13px' }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>

                  {/* Right Documents Preview */}
                  <div style={{ flex: 1, backgroundColor: 'var(--surface-soft)', borderRadius: 'var(--rounded-md)', padding: '16px', border: '1px solid var(--hairline)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Uploaded Documents ({docEntries.length})</h4>
                    {docEntries.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--stone)', margin: 0 }}>No documents uploaded yet.</p>
                    ) : (
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {docEntries.map(([docName, docPath]) => {
                          const fileUrl = typeof docPath === 'string' && docPath.startsWith('http')
                            ? docPath
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/teacher-files/${docPath}`;

                          return (
                            <a 
                              key={docName} 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                textDecoration: 'none', 
                                backgroundColor: 'var(--canvas)', 
                                border: '1px solid var(--hairline-strong)', 
                                borderRadius: '8px', 
                                padding: '10px 14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                fontSize: '13px', 
                                color: 'var(--ink)',
                                fontWeight: 500
                              }}
                            >
                              <FileText size={16} color="var(--brand-green-dark)" />
                              <span style={{ textTransform: 'capitalize' }}>{docName.replace('_', ' ')}</span>
                              <ExternalLink size={12} color="var(--stone)" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
