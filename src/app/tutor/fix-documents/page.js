'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Button } from '../../../components/ui/Button';
import { 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowLeft,
  ShieldAlert,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function FixDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(null); // 'cnic_front' | 'cnic_back' | 'degree'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.push('/login?next=/tutor/fix-documents');
        return;
      }
      setUser(u);

      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (!cancelled) {
        if (data) {
          setProfile(data);
        } else {
          setErrorMsg('Tutor profile not found.');
        }
        setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [router]);

  const handleFileUpload = async (e, docKey) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    setUploadingDoc(docKey);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const path = `${user.id}/kyc/${docKey}_${timestamp}.${ext}`;

      // Upload file to Supabase storage bucket
      const { error: upErr } = await supabase.storage
        .from('teacher-files')
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      // Update tutor_profiles kyc_docs
      const updatedDocs = { ...(profile.kyc_docs || {}), [docKey]: path };
      
      // Update kyc_verifications for this document back to pending
      const updatedVerifs = { ...(profile.kyc_verifications || {}) };
      updatedVerifs[docKey] = {
        ...(updatedVerifs[docKey] || {}),
        status: 'pending',
        reason: '',
        annotations: [],
        resubmitted_at: new Date().toISOString()
      };

      // Determine overall kyc_status (if resubmitting, set to pending if not already)
      const updatePayload = {
        kyc_docs: updatedDocs,
        kyc_verifications: updatedVerifs,
        kyc_status: 'pending'
      };

      const { error: dbErr } = await supabase
        .from('tutor_profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      setProfile(prev => ({
        ...prev,
        ...updatePayload
      }));

      setSuccessMsg(`Successfully uploaded ${docKey.replace('_', ' ')}. Your document is now under review!`);
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMsg(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)' }}>
        Loading document verification details...
      </div>
    );
  }

  const verifs = profile?.kyc_verifications || {};
  const kycStatus = profile?.kyc_status || 'pending';
  const objections = profile?.kyc_objections || {};

  // Find flagged/rejected documents
  const allDocKeys = ['cnic_front', 'cnic_back', 'degree'];
  const flaggedDocKeys = allDocKeys.filter(key => {
    const v = verifs[key];
    const isRejected = v?.status === 'rejected';
    const isFlaggedInObjections = objections?.flagged_documents?.includes(key);
    const isNotUploaded = !profile?.kyc_docs?.[key];
    return isRejected || isFlaggedInObjections || (kycStatus === 'rejected' && isNotUploaded);
  });

  // If no specific flagged doc keys found but overall status is rejected, show all
  const docsToFix = flaggedDocKeys.length > 0 
    ? flaggedDocKeys 
    : (kycStatus === 'rejected' ? allDocKeys : []);

  const isApproved = kycStatus === 'approved';

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '40px 20px 80px 20px' }}>
      
      {/* Back button link */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/tutor/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--steel)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isApproved ? 'var(--brand-green-soft)' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isApproved ? <CheckCircle2 size={22} color="var(--brand-green-dark)" /> : <ShieldAlert size={22} color="#EF4444" />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>
              {isApproved ? 'Identity & Credentials Verified' : 'Fix Document Verification'}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--slate)' }}>
              {isApproved 
                ? 'All your submitted documents have been approved by our moderation team.' 
                : 'Please review the requested updates below and re-upload the flagged documents.'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ backgroundColor: 'var(--brand-green-soft)', border: '1px solid var(--brand-green-dark)', borderRadius: 'var(--rounded-lg)', padding: '16px', marginBottom: '24px', color: 'var(--brand-green-dark)', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 'var(--rounded-lg)', padding: '16px', marginBottom: '24px', color: '#991B1B', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Approved State */}
      {isApproved ? (
        <div style={{ backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-lg)', padding: '32px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--brand-green-dark)" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'var(--ink)' }}>Your Profile is Complete and Live!</h3>
          <p style={{ color: 'var(--slate)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            No document updates are required at this time. Parents and students can view your verified profile badge.
          </p>
          <Link href="/tutor/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Admin General Comment if present */}
          {objections?.comment && (
            <div style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFD566', borderRadius: 'var(--rounded-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#B45309', marginBottom: '8px' }}>
                <AlertCircle size={18} /> Moderator Instructions:
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#78350F', lineHeight: 1.5 }}>
                {objections.comment}
              </p>
            </div>
          )}

          {/* List of Documents requiring action */}
          {docsToFix.length === 0 ? (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-lg)', padding: '24px', textAlign: 'center' }}>
              <Clock size={32} color="#F59E0B" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Verification Pending Review</h4>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--steel)' }}>
                Your documents are currently being reviewed by our moderation team. Check back soon!
              </p>
            </div>
          ) : (
            docsToFix.map(docKey => {
              const v = verifs[docKey] || {};
              const reason = v.reason || '';
              const annotations = v.annotations || [];
              const isUploading = uploadingDoc === docKey;

              const docLabel = docKey === 'cnic_front' 
                ? 'CNIC Front Image' 
                : docKey === 'cnic_back' 
                  ? 'CNIC Back Image' 
                  : 'Degree / Certificate Document';

              return (
                <div 
                  key={docKey}
                  style={{
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid #FCA5A5',
                    borderRadius: 'var(--rounded-lg)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', color: 'var(--ink)' }}>{docLabel}</h3>
                      <span style={{ fontSize: '12px', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'inline-block' }}>
                        Action Required
                      </span>
                    </div>
                  </div>

                  {/* Objection details & notes */}
                  {reason && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                      <strong style={{ fontSize: '13px', color: '#991B1B', display: 'block', marginBottom: '4px' }}>
                        Objection Note:
                      </strong>
                      <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', lineHeight: 1.4 }}>
                        {reason}
                      </p>
                    </div>
                  )}

                  {/* Pinned annotations list if any */}
                  {annotations.length > 0 && (
                    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase' }}>
                        Pinned Correction Details:
                      </span>
                      {annotations.map((ann, idx) => (
                        <div key={idx} style={{ padding: '8px 12px', border: '1px solid #FFCDD2', borderRadius: '6px', backgroundColor: '#FFF5F5', fontSize: '12px', color: '#B71C1C' }}>
                          <strong>Area {idx + 1}:</strong> {ann.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Re-upload Area */}
                  <div style={{ border: '2px dashed var(--hairline-strong)', borderRadius: 'var(--rounded-md)', padding: '24px', textAlign: 'center', backgroundColor: 'var(--surface-soft)' }}>
                    <Upload size={28} color="var(--steel)" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                      Upload New {docLabel}
                    </div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--steel)' }}>
                      Supports JPG, PNG, or PDF up to 10MB
                    </p>

                    <label style={{ display: 'inline-block' }}>
                      <input 
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, docKey)}
                        disabled={isUploading}
                      />
                      <Button variant="primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }} disabled={isUploading}>
                        {isUploading ? 'Uploading & Processing...' : `Choose & Re-upload ${docLabel}`}
                      </Button>
                    </label>
                  </div>

                </div>
              );
            })
          )}

        </div>
      )}

    </div>
  );
}
