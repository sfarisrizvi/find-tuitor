'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { createClient } from '../../../utils/supabase/client';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Coins,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  User,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function TutorContractsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'all'
  const [selectedEscrowDetails, setSelectedEscrowDetails] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadContractsData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (cancelled) return;
        if (!currentUser) {
          window.location.href = '/login?next=/tutor/contracts';
          return;
        }
        setUser(currentUser);

        // Fetch wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!cancelled && walletData) {
          setWallet(walletData);
        }

        // Fetch contracts for this tutor
        const { data: contractsList, error: contractsErr } = await supabase
          .from('contracts')
          .select('*')
          .eq('tutor_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (contractsErr) throw contractsErr;

        if (!contractsList || contractsList.length === 0) {
          if (!cancelled) {
            setContracts([]);
            setLoading(false);
          }
          return;
        }

        // Fetch associated escrow contracts
        const contractIds = contractsList.map(c => c.id);
        const clientIds = [...new Set(contractsList.map(c => c.client_id))];

        const [escrowsRes, clientsRes] = await Promise.all([
          supabase.from('escrow_contracts').select('*').in('contract_id', contractIds),
          supabase.from('client_profiles').select('id, full_name, avatar_url, phone, email').in('id', clientIds)
        ]);

        const escrowMap = {};
        escrowsRes.data?.forEach(e => {
          escrowMap[e.contract_id] = e;
        });

        const clientMap = {};
        clientsRes.data?.forEach(c => {
          clientMap[c.id] = c;
        });

        const enriched = contractsList.map(c => ({
          ...c,
          escrow: escrowMap[c.id] || null,
          client: clientMap[c.client_id] || { full_name: 'Parent / Client', avatar_url: null }
        }));

        if (!cancelled) {
          setContracts(enriched);
        }
      } catch (err) {
        console.error('Error loading tutor contracts:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContractsData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter lists
  const activeContracts = contracts.filter(c => c.status === 'approved');
  const pendingContracts = contracts.filter(c => c.status === 'pending' || c.status === 'revision_requested');
  const completedContracts = contracts.filter(c => c.status === 'completed' || c.status === 'cancelled');

  const displayedContracts = activeTab === 'active'
    ? activeContracts
    : activeTab === 'pending'
    ? pendingContracts
    : contracts;

  // Aggregate stats
  const totalSecuredPkr = activeContracts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalFeesPaidCredits = activeContracts.reduce((sum, c) => sum + (c.escrow?.tutor_fee_credits || Math.round(Number(c.amount) * 0.1)), 0);

  // Helper for cycle progress
  const getCycleProgress = (escrow) => {
    if (!escrow || !escrow.cycle_start_date || !escrow.cycle_end_date) {
      return { daysLeft: 30, progressPct: 0, renewalDateStr: 'In 30 days' };
    }
    const start = new Date(escrow.cycle_start_date).getTime();
    const end = new Date(escrow.cycle_end_date).getTime();
    const now = Date.now();
    const totalDuration = end - start;
    const elapsed = Math.max(0, now - start);
    const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const msRemaining = Math.max(0, end - now);
    const daysLeft = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const renewalDateStr = new Date(escrow.next_renewal_date || end).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return { daysLeft, progressPct, renewalDateStr };
  };

  return (
    <div style={{ backgroundColor: 'var(--canvas-subtle)', minHeight: '100vh', padding: '32px 0 64px 0' }}>
      <div className="container" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                Active Tuitions & Escrow Contracts
              </h1>
              <span style={{
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={14} /> 100% Escrow Protected
              </span>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--stone)', margin: 0 }}>
              Track your 30-day billing cycles, secured milestone payouts, and credit renewals.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/tutor/wallet"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--hairline-strong)',
                borderRadius: '12px',
                color: 'var(--ink)',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <Coins size={16} color="#059669" />
              <span>Balance:</span>
              <span style={{ color: '#059669', fontWeight: 800 }}>
                {wallet?.balance !== undefined ? `${Number(wallet.balance).toLocaleString()} Credits` : '...'}
              </span>
            </Link>

            <Link href="/tutor/wallet">
              <Button variant="primary" style={{ backgroundColor: 'var(--brand-green)', borderRadius: '12px', height: '42px', fontWeight: 700, gap: '6px' }}>
                <Coins size={16} /> Buy Credits
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {/* Card 1 */}
          <div style={{
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)' }}>Active Tuitions</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="#059669" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)' }}>
              {activeContracts.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
              Currently ongoing in 30-day cycles
            </div>
          </div>

          {/* Card 2 */}
          <div style={{
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)' }}>Secured in Escrow</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} color="#059669" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>
              PKR {totalSecuredPkr.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
              Funded by parents • Guaranteed payout
            </div>
          </div>

          {/* Card 3 */}
          <div style={{
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)' }}>Platform Fees Paid</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={18} color="#2563EB" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)' }}>
              {totalFeesPaidCredits.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--stone)' }}>Credits</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
              10% fee per 30-day accepted cycle
            </div>
          </div>

          {/* Card 4 */}
          <div style={{
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stone)' }}>Pending Offers</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} color="#D97706" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)' }}>
              {pendingContracts.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--stone)', marginTop: '4px' }}>
              Awaiting parent acceptance
            </div>
          </div>
        </div>

        {/* Escrow Middleman Explainer Banner */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(5, 150, 105, 0.25)',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.7) 0%, rgba(240, 253, 250, 0.9) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 500px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#064E3B', margin: '0 0 4px 0' }}>
                TutorOnline.pk Escrow Protection Guarantee
              </h4>
              <p style={{ fontSize: '13px', color: '#047857', margin: 0, lineHeight: 1.5 }}>
                100% of the tuition fee is collected upfront from parents into platform escrow before lessons begin. You are protected against non-payment and disputes. After each 30-day milestone, tuition renews seamlessly.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedEscrowDetails({
              title: 'How 30-Day Escrow Protection Works',
              body: `1. Upfront Funding: Before a parent sends a tuition offer or accepts your contract, their wallet must have 100% of the contract PKR locked in escrow.
2. Tutor Acceptance: The tutor accepts by contributing a 10% platform fee in credits (e.g., 1,000 credits for a PKR 10,000 contract).
3. 30-Day Cycle: The agreement is active for exactly 30 days. Both parties teach and attend lessons with zero financial friction.
4. Auto-Renewal: At the conclusion of the 30-day cycle, the contract renews for the next month upon agreement. The tutor pays the 10% credit fee again, and the parent funds the new cycle.`
            })}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              color: '#065F46',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Info size={15} /> Learn How Escrow Works
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--hairline-strong)',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: activeTab === 'active' ? 'var(--brand-green)' : 'transparent',
              color: activeTab === 'active' ? '#ffffff' : 'var(--stone)'
            }}
          >
            Active & Secured ({activeContracts.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: activeTab === 'pending' ? 'var(--brand-green)' : 'transparent',
              color: activeTab === 'pending' ? '#ffffff' : 'var(--stone)'
            }}
          >
            Pending Offers ({pendingContracts.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: activeTab === 'all' ? 'var(--brand-green)' : 'transparent',
              color: activeTab === 'all' ? '#ffffff' : 'var(--stone)'
            }}
          >
            All History ({contracts.length})
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                height: '160px',
                backgroundColor: 'var(--canvas)',
                borderRadius: '16px',
                border: '1px solid var(--hairline-strong)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedContracts.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '64px 24px', borderRadius: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#059669'
            }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
              {activeTab === 'active' ? 'No active escrow tuitions yet' : 'No contracts in this view'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--stone)', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              When a parent accepts your contract offer or hires you via direct messaging, their 100% tuition deposit will be held in platform escrow and displayed here with a 30-day countdown timer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/tutor/jobs">
                <Button variant="primary" style={{ backgroundColor: 'var(--brand-green)', borderRadius: '10px' }}>
                  Find Tuition Jobs
                </Button>
              </Link>
              <Link href="/tutor/messages">
                <Button variant="secondary" style={{ borderRadius: '10px' }}>
                  Open Messages
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Contracts List */}
        {!loading && displayedContracts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {displayedContracts.map((contract) => {
              const escrow = contract.escrow;
              const { daysLeft, progressPct, renewalDateStr } = getCycleProgress(escrow);
              const isApproved = contract.status === 'approved';
              const isPending = contract.status === 'pending';
              const requiredFeeCredits = Math.round(Number(contract.amount) * 0.10);

              return (
                <div
                  key={contract.id}
                  style={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline-strong)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top Bar: Client Info & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--brand-green-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '18px',
                        overflow: 'hidden'
                      }}>
                        {contract.client?.avatar_url ? (
                          <img
                            src={contract.client.avatar_url.startsWith('http') ? contract.client.avatar_url : `/api/media/${contract.client_id}/avatar`}
                            alt={contract.client.full_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={22} color="#fff" />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                            {contract.client?.full_name || 'Parent'}
                          </h3>
                          <span style={{ fontSize: '12px', color: 'var(--stone)', backgroundColor: 'var(--canvas-subtle)', padding: '2px 8px', borderRadius: '6px' }}>
                            {contract.mode === 'online' ? '🌐 Online Tuition' : '🏠 Home Tuition'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--stone)', margin: '3px 0 0 0' }}>
                          Created on {new Date(contract.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isApproved ? (
                        <span style={{
                          backgroundColor: 'rgba(5, 150, 105, 0.1)',
                          color: '#059669',
                          border: '1px solid rgba(5, 150, 105, 0.25)',
                          borderRadius: '999px',
                          padding: '6px 14px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <ShieldCheck size={16} /> Escrow Secured & Active
                        </span>
                      ) : isPending ? (
                        <span style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          color: '#D97706',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '999px',
                          padding: '6px 14px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Clock size={16} /> Pending Parent Acceptance
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: 'var(--canvas-subtle)',
                          color: 'var(--stone)',
                          borderRadius: '999px',
                          padding: '6px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {contract.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial & Terms Breakdown */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--canvas-subtle)',
                    borderRadius: '14px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 600 }}>Monthly Tuition Fee</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-green-dark)', marginTop: '2px' }}>
                        PKR {Number(contract.amount).toLocaleString()}
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--stone)' }}> / month</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 600 }}>Tutor Platform Fee (10%)</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>
                        {requiredFeeCredits.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--stone)' }}>Credits</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 600 }}>Current 30-Day Cycle</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>
                        Cycle #{escrow?.cycle_number || 1}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--stone)', fontWeight: 600 }}>Escrow Release Status</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={14} /> 100% Held in Escrow
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Progress Bar (If active) */}
                  {isApproved && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#059669" /> 30-Day Cycle Progress:
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: daysLeft <= 5 ? '#D97706' : '#059669' }}>
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Cycle concluding today'}
                        </span>
                      </div>
                      
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--hairline-strong)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          backgroundColor: daysLeft <= 5 ? '#F59E0B' : '#059669',
                          borderRadius: '999px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12px', color: 'var(--stone)' }}>
                        <span>Started: {escrow?.cycle_start_date ? new Date(escrow.cycle_start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'Day 1'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RefreshCw size={12} /> Next Renewal: {renewalDateStr}
                        </span>
                      </div>

                      {/* Renewal advisory if near end of cycle */}
                      {daysLeft <= 7 && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '10px',
                          fontSize: '13px',
                          color: '#92400E',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <span>
                            ⚠️ <strong>Upcoming 30-day renewal:</strong> Ensure your wallet has {requiredFeeCredits} credits to seamlessly accept the renewal.
                          </span>
                          <Link href="/tutor/wallet" style={{ color: '#B45309', fontWeight: 700, textDecoration: 'underline' }}>
                            Top up wallet &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contract Terms Snippet */}
                  {contract.terms && (
                    <div style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderLeft: '3px solid var(--brand-green)',
                      borderRadius: '0 8px 8px 0',
                      marginBottom: '20px',
                      fontSize: '13px',
                      color: 'var(--stone)',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: 'var(--ink)' }}>Agreed Terms: </strong>
                      {contract.terms.length > 160 ? `${contract.terms.substring(0, 160)}...` : contract.terms}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--hairline-strong)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--stone)' }}>
                      Contract ID: <code style={{ fontSize: '12px', backgroundColor: 'var(--canvas-subtle)', padding: '2px 6px', borderRadius: '4px' }}>{contract.id.substring(0, 8)}</code>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Link href={contract.conversation_id ? `/tutor/messages?id=${contract.conversation_id}` : '/tutor/messages'}>
                        <Button variant="secondary" size="sm" style={{ borderRadius: '10px', gap: '6px' }}>
                          <MessageSquare size={14} /> Open Conversation
                        </Button>
                      </Link>

                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ borderRadius: '10px', gap: '6px' }}
                        onClick={() => setSelectedEscrowDetails({
                          title: `Escrow Security - Contract #${contract.id.substring(0, 8)}`,
                          body: `• Client: ${contract.client?.full_name || 'Parent'}
• Monthly Fee: PKR ${Number(contract.amount).toLocaleString()}
• Escrow Protection: Active (100% of PKR held in platform vault)
• 30-Day Cycle: #${escrow?.cycle_number || 1}
• Renewal Date: ${renewalDateStr}
• Tutor Fee Contribution: ${requiredFeeCredits} credits (Paid for current 30-day term)
• Fraud Protection: Tuition funds will not be refunded to the client without verified mediation.`
                        })}
                      >
                        <ShieldCheck size={14} color="#059669" /> View Escrow Guarantee
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Escrow Details */}
        {selectedEscrowDetails && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--canvas)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                    {selectedEscrowDetails.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>TutorOnline.pk Platform Security Guarantee</span>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--canvas-subtle)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                color: 'var(--ink)',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
                marginBottom: '24px'
              }}>
                {selectedEscrowDetails.body}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button
                  variant="primary"
                  style={{ backgroundColor: 'var(--brand-green)', borderRadius: '10px' }}
                  onClick={() => setSelectedEscrowDetails(null)}
                >
                  I Understand
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
