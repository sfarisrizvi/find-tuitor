import React from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, Lock, Eye, FileText, Mail, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: "Privacy Policy | TutorOnline.pk",
  description: "Learn how TutorOnline.pk collects, uses, protects, and stores user data and verification credentials for students, parents, and tutors.",
};

export default function PrivacyPolicy() {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Breadcrumb / Back */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/" style={{ color: 'var(--brand-green-dark)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={28} color="var(--brand-green-dark)" />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px' }}>
            Last Updated: January 2026 | Effective for all TutorOnline.pk users
          </p>
        </div>

        <Card style={{ padding: '36px', borderRadius: '20px', backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline-strong)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--ink)', lineHeight: '1.7', fontSize: '15px' }}>
            
            {/* Section 1 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="var(--brand-green-dark)" /> 1. Introduction
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                Welcome to <strong>TutorOnline.pk</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Protecting your privacy and securing your personal information is fundamental to our platform. This Privacy Policy outlines how we collect, use, store, and safeguard the data of parents, students, and educators across Pakistan when you visit or use our website and services.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 2 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="var(--brand-green-dark)" /> 2. Information We Collect
              </h2>
              <p style={{ color: 'var(--steel)', marginBottom: '12px' }}>
                We collect personal information necessary to deliver safe and verified tutoring matches:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--steel)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Account Details:</strong> Full name, email address, phone number, city, and account role (Parent/Student or Educator).</li>
                <li><strong>Tutor Vetting Credentials:</strong> CNIC/CNIC photo, academic degree transcripts, teaching experience details, and profile photo provided during verification onboarding.</li>
                <li><strong>Tuition Posts & Messages:</strong> Requirements posted by parents (grade, subject, location preference) and internal inquiry messages sent through our platform.</li>
                <li><strong>Technical & Analytics Data:</strong> IP address, device browser type, page visits, and cookie preference selections via analytics tools (e.g., PostHog, GA4).</li>
              </ul>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 3 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={20} color="var(--brand-green-dark)" /> 3. How We Use Your Data & Security Protocols
              </h2>
              <p style={{ color: 'var(--steel)', marginBottom: '12px' }}>
                Your data is used strictly for legitimate platform operations:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--steel)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>To connect students and parents with qualified, verified educators matching their subject requirements.</li>
                <li>To conduct identity vetting (CNIC and degree checks). <em>Note: Uploaded CNIC and degree files are strictly private, encrypted, accessible solely to designated verification admins, and NEVER publicly displayed.</em></li>
                <li>To dispatch critical notifications regarding tuition applications, account status, and inquiries.</li>
                <li>To prevent fraud, spam, and unauthorized account access via anti-bot and security protocols.</li>
              </ul>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 4 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                4. Data Sharing & Third Parties
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                We <strong>never sell, rent, or trade</strong> your personal data to third-party advertisers. Information is shared only with trusted infrastructure providers required to operate our service (e.g., Supabase database hosting, Resend transactional email services, and analytics processors) under strict confidentiality agreements.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 5 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                5. Cookies & Tracking Preferences
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                We use cookies and similar technologies to remember your login session and analyze platform performance. You can manage or disable non-essential cookies at any time via our Cookie Banner or your browser settings.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 6 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                6. Your Rights & Data Deletion
              </h2>
              <p style={{ color: 'var(--steel)', marginBottom: '12px' }}>
                You maintain rights over your personal information:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--steel)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Access and update your profile information in your account settings.</li>
                <li>Request permanent deletion of your account and uploaded documents by contacting support.</li>
              </ul>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 7 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={20} color="var(--brand-green-dark)" /> 7. Contacting Us About Privacy
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                If you have questions or concerns regarding this Privacy Policy or your personal data, please contact our data privacy team at:
                <br />
                <strong style={{ color: 'var(--ink)' }}>Email:</strong> support@tutoronline.pk
                <br />
                <strong style={{ color: 'var(--ink)' }}>WhatsApp Support:</strong> +92 345 5235079
              </p>
            </section>

          </div>
        </Card>

      </div>
    </div>
  );
}
