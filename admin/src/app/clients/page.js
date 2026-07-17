'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Shield
} from 'lucide-react';

export default function ClientsDirectory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [adminRole, setAdminRole] = useState('super_admin');

  // Filters & Search
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active' | 'suspended'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Client details drawer
  const [selectedClient, setSelectedClient] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.user_metadata?.role !== 'admin') {
        router.push('/login');
        return;
      }
      setAdminUser(user);
      setAdminRole(user.user_metadata?.admin_role || 'super_admin');
      fetchClients();
    };
    checkAuth();
  }, [router]);

  // Handle Suspension toggle
  const toggleSuspension = async () => {
    if (!selectedClient || adminRole === 'monitor') return;
    const nextSuspendedState = !selectedClient.suspended;

    setSubmittingAction(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({ suspended: nextSuspendedState })
        .eq('id', selectedClient.id);

      if (error) throw error;

      // Update state locally
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, suspended: nextSuspendedState } : c));
      setSelectedClient(prev => ({ ...prev, suspended: nextSuspendedState }));
      alert(`Client account ${nextSuspendedState ? 'suspended' : 'unsuspended'} successfully.`);
    } catch (err) {
      alert(`Error updating suspension: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Toggle Verification Badge
  const toggleVerification = async () => {
    if (!selectedClient || adminRole === 'monitor') return;
    const nextVerifiedState = !selectedClient.verified;

    setSubmittingAction(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('client_profiles')
        .update({ verified: nextVerifiedState })
        .eq('id', selectedClient.id);

      if (error) throw error;

      // Update state locally
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, verified: nextVerifiedState } : c));
      setSelectedClient(prev => ({ ...prev, verified: nextVerifiedState }));
      alert(`Verified badge ${nextVerifiedState ? 'granted' : 'removed'} successfully.`);
    } catch (err) {
      alert(`Error updating verification: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Permanently delete Client Account (Super Admin only)
  const handleDeleteAccount = async () => {
    if (!selectedClient || adminRole !== 'super_admin') return;
    if (!confirm(`CRITICAL ACTION: Are you sure you want to permanently delete client account ${selectedClient.full_name}? This cannot be undone.`)) return;

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admins?id=${selectedClient.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Update state locally
      setClients(prev => prev.filter(c => c.id !== selectedClient.id));
      setSelectedClient(null);
      alert('Client account permanently deleted.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getFilteredClients = () => {
    let list = clients;

    if (filterMode === 'active') {
      list = list.filter(c => !c.suspended);
    } else if (filterMode === 'suspended') {
      list = list.filter(c => c.suspended);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    return list;
  };

  const filteredClients = getFilteredClients();

  const totalClients = clients.length;
  const totalActive = clients.filter(c => !c.suspended).length;
  const totalSuspended = clients.filter(c => c.suspended).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Band */}
      <div className="admin-header-band">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '100%' }}>
          <div>
            <h1>Clients Directory</h1>
            <p>Manage parent and student profiles, restrict account access, and review routing metadata.</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={fetchClients}>
            <RefreshCw size={14} /> Refresh Directory
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)', flex: 1, width: '100%', maxWidth: '100%' }}>
        
        {/* Top metrics filter cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <div 
            onClick={() => setFilterMode('all')}
            style={{ 
              backgroundColor: 'var(--canvas)', 
              padding: 'var(--spacing-md)', 
              borderRadius: 'var(--rounded-lg)',
              border: filterMode === 'all' ? '2px solid var(--brand-green)' : '1px solid var(--hairline)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', textTransform: 'uppercase' }}>All Clients</span>
            <h2 style={{ margin: '4px 0 0 0', color: 'var(--brand-green)' }}>{totalClients}</h2>
          </div>

          <div 
            onClick={() => setFilterMode('active')}
            style={{ 
              backgroundColor: 'var(--canvas)', 
              padding: 'var(--spacing-md)', 
              borderRadius: 'var(--rounded-lg)',
              border: filterMode === 'active' ? '2px solid var(--accent-blue)' : '1px solid var(--hairline)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', textTransform: 'uppercase' }}>Active</span>
            <h2 style={{ margin: '4px 0 0 0', color: 'var(--accent-blue)' }}>{totalActive}</h2>
          </div>

          <div 
            onClick={() => setFilterMode('suspended')}
            style={{ 
              backgroundColor: 'var(--canvas)', 
              padding: 'var(--spacing-md)', 
              borderRadius: 'var(--rounded-lg)',
              border: filterMode === 'suspended' ? '2px solid var(--accent-pink)' : '1px solid var(--hairline)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', textTransform: 'uppercase' }}>Suspended</span>
            <h2 style={{ margin: '4px 0 0 0', color: '#FF5252' }}>{totalSuspended}</h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-md)', padding: '12px 16px' }}>
          <Search size={18} style={{ color: 'var(--steel)' }} />
          <input
            type="text"
            className="admin-input"
            style={{ border: 'none', background: 'transparent', color: 'var(--ink)', width: '100%', height: 'auto', padding: 0 }}
            placeholder="Search clients by name, email or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Clients list table */}
        <div className="admin-table-container">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px' }}>Loading clients directory...</p>
          ) : filteredClients.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px' }}>No clients found matching the query.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>S.#</th>
                  <th>Client Name</th>
                  <th>Contact Information</th>
                  <th>City / Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client, idx) => (
                  <tr 
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {client.avatar_url ? (
                          <img 
                            src={client.avatar_url.startsWith('http') ? client.avatar_url : `https://qlhcavfyllfcwifxbtbu.supabase.co/storage/v1/object/public/client-files/${client.avatar_url}`}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--slate)', fontSize: '13px' }}>
                            {client.full_name?.substring(0, 2).toUpperCase() || 'CL'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {client.full_name || 'Unnamed Client'}
                            {client.verified && <img src="/shield.svg" alt="Verified" style={{ width: '15px', height: '15px', verticalAlign: 'middle' }} />}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--steel)', textTransform: 'capitalize' }}>
                            {client.client_type || 'Student / Parent'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{client.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--steel)' }}>{client.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <div>{client.city || 'No City'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--steel)' }}>
                        Route: {client.academic_route || 'Not set'}
                      </div>
                    </td>
                    <td>
                      {client.suspended ? (
                        <span className="admin-badge admin-badge-red">Suspended</span>
                      ) : (
                        <span className="admin-badge admin-badge-green">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Right Drawer: Client Details */}
      {selectedClient && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 940 }}
            onClick={() => setSelectedClient(null)}
          />

          <div className={`admin-drawer ${selectedClient ? 'open' : ''}`}>
            
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--canvas-dark)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Client Account Review</h3>
                <span style={{ fontSize: '11px', color: 'var(--steel)' }}>ID: {selectedClient.id}</span>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                style={{ color: 'var(--steel)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Card Summary */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-lg)', backgroundColor: 'var(--surface-soft)' }}>
                {selectedClient.avatar_url ? (
                  <img 
                    src={selectedClient.avatar_url.startsWith('http') ? selectedClient.avatar_url : `https://qlhcavfyllfcwifxbtbu.supabase.co/storage/v1/object/public/client-files/${selectedClient.avatar_url}`}
                    alt="" 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: 'var(--steel)' }}>
                    {selectedClient.full_name?.substring(0, 2).toUpperCase() || 'CL'}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{selectedClient.full_name}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--steel)', display: 'block' }}>{selectedClient.email}</span>
                  <span style={{ fontSize: '12px', color: 'var(--steel)', display: 'block' }}>{selectedClient.phone || 'No phone'}</span>
                </div>
              </div>

              {/* Status Banner */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Account Status</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`admin-badge ${selectedClient.suspended ? 'admin-badge-red' : 'admin-badge-green'}`}>
                    {selectedClient.suspended ? 'Suspended' : 'Active Account'}
                  </span>
                  {selectedClient.verified && <img src="/shield.svg" alt="Verified" style={{ width: '15px', height: '15px', verticalAlign: 'middle' }} />}
                </div>
              </div>

              {/* Client Metadata grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', marginBottom: '4px' }}>Client Type</span>
                  <strong style={{ textTransform: 'capitalize' }}>{selectedClient.client_type || 'Parent / Student'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', marginBottom: '4px' }}>City</span>
                  <strong>{selectedClient.city || 'No City'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', marginBottom: '4px' }}>Academic Route</span>
                  <strong>{selectedClient.academic_route || 'Not set'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', marginBottom: '4px' }}>Onboarding Complete</span>
                  <strong>{selectedClient.onboarding_complete ? 'Yes' : 'No'}</strong>
                </div>
              </div>

              {/* Joining Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', borderTop: '1px solid var(--hairline-soft)', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', marginBottom: '4px' }}>Joining Date</span>
                  <strong>{selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--steel)', display: 'block', marginBottom: '4px' }}>Last Updated</span>
                  <strong>{selectedClient.updated_at ? new Date(selectedClient.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</strong>
                </div>
              </div>

            </div>

            {/* Bottom Actions strip */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--hairline)', backgroundColor: 'var(--canvas-dark)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {adminRole === 'monitor' ? (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--steel)' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Monitor Mode: Client details are read-only
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Toggle Verified Badge Button */}
                    <button 
                      onClick={toggleVerification} 
                      className={`admin-btn ${selectedClient.verified ? 'admin-btn-secondary' : 'admin-btn-primary'}`} 
                      style={{ flex: 1 }}
                      disabled={submittingAction}
                    >
                      {selectedClient.verified ? 'Remove Verified' : 'Give Verified Badge'}
                    </button>

                    {/* Suspend button */}
                    <button 
                      onClick={toggleSuspension} 
                      className={`admin-btn ${selectedClient.suspended ? 'admin-btn-primary' : 'admin-btn-secondary'}`} 
                      style={{ flex: 1 }}
                      disabled={submittingAction}
                    >
                      {selectedClient.suspended ? <><UserCheck size={12} /> Lift Ban</> : <><UserX size={12} /> Suspend</>}
                    </button>
                  </div>

                  {/* Super admin account deletion */}
                  {adminRole === 'super_admin' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={handleDeleteAccount} 
                        className="admin-btn admin-btn-danger" 
                        style={{ flex: 1 }}
                        disabled={submittingAction}
                      >
                        <Trash2 size={12} /> Delete Account
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}
