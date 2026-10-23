'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Upload,
  X,
  FileText,
  ShieldCheck,
  Building,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';

const OFFICIAL_BANK_DETAILS = {
  bankName: 'NayaPay',
  accountTitle: 'Fahad Suleman',
  accountNumber: '03333480179'
};

export function WalletHub({ userRole = 'client' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'credit' | 'debit'

  // Buy Credits Modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [bankTransferredFrom, setBankTransferredFrom] = useState('Meezan Bank');
  const [transactionRef, setTransactionRef] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Copy helper
  const [copiedField, setCopiedField] = useState('');
  const fileInputRef = useRef(null);

  const handleCopy = (text, fieldName) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const loadWalletData = async () => {
    const supabase = createClient();
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      // 1. Fetch or create wallet
      let { data: wData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!wData) {
        // Initialize wallet if not exists
        const { data: createdW } = await supabase
          .from('wallets')
          .insert({
            user_id: currentUser.id,
            user_role: userRole,
            balance: 0.00
          })
          .select()
          .single();
        wData = createdW;
      }
      setWallet(wData);

      // 2. Fetch pending / in_review credit requests
      const { data: reqs } = await supabase
        .from('credit_requests')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setPendingRequests(reqs || []);

      // 3. Fetch transaction history
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setTransactions(txs || []);
    } catch (err) {
      console.error('Error loading wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [userRole]);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file (PNG, JPG, JPEG).');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setUploadError('Image size exceeds 8MB limit.');
        return;
      }
      setUploadError('');
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Submit manual bank deposit request
  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) {
      setUploadError('Please enter a valid deposit amount in PKR.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Please upload your payment transfer receipt screenshot.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    const supabase = createClient();

    try {
      // 1. Upload screenshot to payment-slips bucket
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_receipt.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadErr) throw uploadErr;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(fileName);

      // 3. Insert into credit_requests
      const { error: reqErr } = await supabase
        .from('credit_requests')
        .insert({
          user_id: user.id,
          user_role: userRole,
          amount_pkr: amountNum,
          credits_requested: Math.round(amountNum), // 1 PKR = 1 Credit
          bank_name: OFFICIAL_BANK_DETAILS.bankName,
          transaction_ref: transactionRef.trim() || `TRX-${Date.now().toString().slice(-6)}`,
          screenshot_url: publicUrl,
          status: 'pending'
        });

      if (reqErr) throw reqErr;

      setUploadSuccess('Your payment receipt has been submitted! Our admin team will verify and credit your wallet shortly.');
      setDepositAmount('');
      setTransactionRef('');
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload wallet data
      await loadWalletData();

      // Close modal after brief delay
      setTimeout(() => {
        setShowBuyModal(false);
        setUploadSuccess('');
      }, 2500);
    } catch (err) {
      console.error('Deposit submission failed:', err);
      setUploadError(err.message || 'Error submitting deposit. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'credit') return Number(t.amount) > 0;
    if (filterType === 'debit') return Number(t.amount) < 0;
    return true;
  });

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'signup_bonus':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#E3FCF7', color: '#00684A' }}>Signup Bonus</span>;
      case 'onboarding_bonus':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#E3FCF7', color: '#00684A' }}>Onboarding Bonus</span>;
      case 'kyc_verified_bonus':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#E0F2FE', color: '#0369A1' }}>Verified Bonus</span>;
      case 'bank_deposit':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#DCFCE7', color: '#15803D' }}>Bank Deposit</span>;
      case 'chat_initiation':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#FEF3C7', color: '#B45309' }}>Chat Start</span>;
      case 'contact_unlock':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#F3E8FF', color: '#7E22CE' }}>Contact Unlock</span>;
      case 'contract_escrow_lock':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#E0F2FE', color: '#0284C7' }}>Escrow Hold</span>;
      case 'contract_tutor_fee':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#FFE4E6', color: '#BE123C' }}>Platform Fee (10%)</span>;
      case 'contract_refund':
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#D1FAE5', color: '#047857' }}>Escrow Refund</span>;
      default:
        return <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#F1F5F9', color: '#475569' }}>Transaction</span>;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--steel)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <p>Loading your wallet & credits...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 16px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: 'var(--ink)' }}>
              Credits & Wallet
            </h2>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'var(--surface-feature)',
              color: 'var(--brand-green-dark)'
            }}>
              1 Credit = 1 PKR
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--steel)', fontSize: '14px' }}>
            Manage your balance, purchase credits via direct bank transfer, and track secure escrow milestones.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowBuyModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontWeight: 600,
            borderRadius: 'var(--rounded-md)',
            boxShadow: '0 2px 8px rgba(0, 104, 74, 0.2)'
          }}
        >
          <CreditCard size={18} />
          Buy Credits
        </Button>
      </div>

      {/* ── FINANCIAL SNAPSHOT CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Available Balance */}
        <Card style={{ padding: '24px', border: '1px solid var(--hairline)', background: 'var(--canvas)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase' }}>
              Available Balance
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-feature)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="var(--brand-green-dark)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>
              {wallet ? Number(wallet.balance).toLocaleString() : '0'}
            </h1>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--steel)' }}>Credits</span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--stone)' }}>
            ≈ PKR {wallet ? Number(wallet.balance).toLocaleString() : '0'} available for instant use
          </p>
        </Card>

        {/* Escrow Protected */}
        <Card style={{ padding: '24px', border: '1px solid var(--hairline)', background: 'var(--canvas)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase' }}>
              Escrow Protected Hold
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="#0284C7" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#0284C7' }}>
              {wallet ? Number(wallet.escrow_balance).toLocaleString() : '0'}
            </h1>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--steel)' }}>Credits</span>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--stone)' }}>
            Funds locked in active monthly contracts until completion
          </p>
        </Card>

        {/* Total Deposited */}
        <Card style={{ padding: '24px', border: '1px solid var(--hairline)', background: 'var(--canvas)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--steel)', textTransform: 'uppercase' }}>
              Lifetime Bank Deposits
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={18} color="#7E22CE" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: 'var(--ink)' }}>
              PKR {wallet ? Number(wallet.total_deposited).toLocaleString() : '0'}
            </h1>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--stone)' }}>
            Total bank transfers verified by admin
          </p>
        </Card>
      </div>

      {/* ── ESCROW & PRICING RULES BANNER ── */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--rounded-lg)',
        background: 'var(--surface-feature)',
        border: '1px solid rgba(0, 104, 74, 0.15)',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <ShieldCheck size={32} color="var(--brand-green-dark)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: 'var(--brand-green-dark)' }}>
            100% Escrow Protection & Guaranteed Middleman
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--charcoal)', lineHeight: '1.4' }}>
            {userRole === 'client'
              ? 'Parents deposit 100% of the tuition fee into platform escrow. Tutors are paid once 30-day milestones are completed. In case of tutor abandonment, your funds are 100% refunded.'
              : 'Tutors pay only 10% platform fee in credits to accept any contract (valid for 30 days). If a parent defaults, the platform guarantees tutor compensation from escrow.'}
          </p>
        </div>
      </div>

      {/* ── ACTIVE / PENDING REQUESTS SECTION ── */}
      {pendingRequests.some(r => r.status === 'pending' || r.status === 'in_review') && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#D97706" />
            Pending Deposit Confirmations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingRequests.filter(r => r.status === 'pending' || r.status === 'in_review').map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--rounded-md)',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '15px', color: '#92400E' }}>
                      Deposit of PKR {Number(req.amount_pkr).toLocaleString()}
                    </strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#FEF3C7',
                      color: '#B45309',
                      border: '1px solid #FCD34D'
                    }}>
                      {req.status === 'in_review' ? 'In Review' : 'Waiting for Admin Confirmation'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350F' }}>
                    Reference: {req.transaction_ref || 'None'} · Submitted on{' '}
                    {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <a
                  href={req.screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#B45309',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  View Receipt Slip <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRANSACTION LEDGER STATEMENT ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
            Account Statement & History
          </h3>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'credit', 'debit'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterType(mode)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--rounded-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterType === mode ? 'var(--brand-green-dark)' : 'var(--surface-soft)',
                  color: filterType === mode ? '#FFFFFF' : 'var(--steel)'
                }}
              >
                {mode === 'all' ? 'All Transactions' : mode === 'credit' ? 'Credits Added (+)' : 'Debits (-)'}
              </button>
            ))}
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--steel)' }}>
              <FileText size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--charcoal)' }}>No transactions found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                Your wallet statement will appear here once you purchase credits or start an engagement.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="desktop-ledger-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--hairline)', color: 'var(--steel)', fontSize: '12px' }}>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const isCredit = Number(tx.amount) > 0;
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--steel)', whiteSpace: 'nowrap' }}>
                            {new Date(tx.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {getTransactionBadge(tx.type)}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--charcoal)', fontWeight: 500 }}>
                            {tx.description}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isCredit ? '#00875A' : '#E11D48', whiteSpace: 'nowrap' }}>
                            {isCredit ? `+${Number(tx.amount).toLocaleString()}` : Number(tx.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                            {Number(tx.balance_after).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Native Card View */}
              <div className="mobile-ledger-cards" style={{ padding: '12px' }}>
                {filteredTransactions.map((tx) => {
                  const isCredit = Number(tx.amount) > 0;
                  return (
                    <div
                      key={tx.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--canvas)',
                        borderRadius: '12px',
                        border: '1px solid var(--hairline)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          {getTransactionBadge(tx.type)}
                          <span style={{ fontSize: '11px', color: 'var(--stone)' }}>
                            {new Date(tx.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
                          {tx.description}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: isCredit ? '#00875A' : '#E11D48' }}>
                          {isCredit ? `+${Number(tx.amount).toLocaleString()}` : Number(tx.amount).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--stone)', marginTop: '2px' }}>
                          Bal: {Number(tx.balance_after).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── BUY CREDITS MODAL ── */}
      {showBuyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--canvas)',
            borderRadius: 'var(--rounded-lg)',
            width: '600px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--hairline)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={20} color="var(--brand-green-dark)" />
                  Buy Credits via Bank Deposit
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--steel)' }}>
                  1 PKR = 1 Credit · Guaranteed manual verification
                </span>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitDeposit} style={{ padding: '24px' }}>
              {uploadSuccess && (
                <div style={{
                  padding: '14px',
                  borderRadius: 'var(--rounded-md)',
                  background: 'var(--surface-feature)',
                  color: 'var(--brand-green-dark)',
                  marginBottom: '20px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={18} />
                  {uploadSuccess}
                </div>
              )}

              {uploadError && (
                <div style={{
                  padding: '14px',
                  borderRadius: 'var(--rounded-md)',
                  background: '#FFE4E6',
                  color: '#BE123C',
                  marginBottom: '20px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} />
                  {uploadError}
                </div>
              )}

              {/* Bank Account Info Card */}
              <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--rounded-md)',
                padding: '16px',
                border: '1px solid var(--hairline)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={16} color="var(--brand-green-dark)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                      Step 1: Transfer Funds via NayaPay
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--brand-green-dark)', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    Instant Transfer
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '13px' }}>
                  {/* Bank / Wallet Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--canvas)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                    <div>
                      <span style={{ color: 'var(--steel)', fontSize: '11px', display: 'block', fontWeight: 500 }}>Bank / Wallet</span>
                      <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{OFFICIAL_BANK_DETAILS.bankName}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(OFFICIAL_BANK_DETAILS.bankName, 'bankName')}
                      style={{
                        background: copiedField === 'bankName' ? '#ecfdf5' : 'transparent',
                        border: copiedField === 'bankName' ? '1px solid #10b981' : 'none',
                        color: copiedField === 'bankName' ? '#047857' : 'var(--brand-green-dark)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {copiedField === 'bankName' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'bankName' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Account Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--canvas)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                    <div>
                      <span style={{ color: 'var(--steel)', fontSize: '11px', display: 'block', fontWeight: 500 }}>Account Title</span>
                      <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{OFFICIAL_BANK_DETAILS.accountTitle}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(OFFICIAL_BANK_DETAILS.accountTitle, 'title')}
                      style={{
                        background: copiedField === 'title' ? '#ecfdf5' : 'transparent',
                        border: copiedField === 'title' ? '1px solid #10b981' : 'none',
                        color: copiedField === 'title' ? '#047857' : 'var(--brand-green-dark)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {copiedField === 'title' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'title' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Account Number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--canvas)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--hairline)' }}>
                    <div>
                      <span style={{ color: 'var(--steel)', fontSize: '11px', display: 'block', fontWeight: 500 }}>NayaPay Account Number</span>
                      <strong style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: '15px', letterSpacing: '0.5px' }}>{OFFICIAL_BANK_DETAILS.accountNumber}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(OFFICIAL_BANK_DETAILS.accountNumber, 'accountNumber')}
                      style={{
                        background: copiedField === 'accountNumber' ? '#ecfdf5' : 'transparent',
                        border: copiedField === 'accountNumber' ? '1px solid #10b981' : 'none',
                        color: copiedField === 'accountNumber' ? '#047857' : 'var(--brand-green-dark)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {copiedField === 'accountNumber' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'accountNumber' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload Receipt Form */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '12px' }}>
                  Step 2: Enter Deposit Details & Upload Screenshot
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate)', marginBottom: '4px' }}>
                      Deposit Amount (PKR) *
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      placeholder="e.g. 5000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--rounded-sm)',
                        border: '1px solid var(--hairline-strong)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--steel)' }}>
                      You will receive: {depositAmount ? Number(depositAmount).toLocaleString() : '0'} Credits
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate)', marginBottom: '4px' }}>
                      Transaction Reference / ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TRX982741"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--rounded-sm)',
                        border: '1px solid var(--hairline-strong)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--steel)' }}>
                      From your bank receipt slip
                    </span>
                  </div>
                </div>

                {/* Screenshot Uploader */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate)', marginBottom: '6px' }}>
                    Payment Screenshot Receipt *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {filePreview ? (
                    <div style={{
                      position: 'relative',
                      borderRadius: 'var(--rounded-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--hairline)',
                      maxHeight: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#000'
                    }}>
                      <img src={filePreview} alt="Preview" style={{ maxHeight: '180px', objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          padding: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--hairline-strong)',
                        borderRadius: 'var(--rounded-md)',
                        padding: '28px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--surface)',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <Upload size={28} color="var(--steel)" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--charcoal)' }}>
                        Click to upload payment screenshot
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--steel)' }}>
                        PNG, JPG, JPEG up to 8MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBuyModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={uploading || !selectedFile}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Submitting Slip...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Submit Receipt for Verification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
