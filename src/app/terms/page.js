import React from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, FileCheck, AlertCircle, HelpCircle, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: "Terms & Conditions | TutorOnline.pk",
  description: "Terms of Service and user agreement guidelines for students, parents, and verified tutors using TutorOnline.pk platform.",
};

export default function TermsAndConditions() {
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
            <FileCheck size={28} color="var(--brand-green-dark)" />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Terms & Conditions</h1>
          <p style={{ color: 'var(--steel)', fontSize: '15px' }}>
            Last Updated: January 2026 | User Agreement for TutorOnline.pk
          </p>
        </div>

        <Card style={{ padding: '36px', borderRadius: '20px', backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline-strong)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--ink)', lineHeight: '1.7', fontSize: '15px' }}>
            
            {/* Section 1 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                1. Acceptance of Terms
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                By creating an account, posting tuition requirements, applying for tutoring opportunities, or accessing the services provided by <strong>TutorOnline.pk</strong>, you agree to comply with and be bound by these Terms & Conditions. If you do not agree with any portion of these terms, you should immediately cease platform use.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 2 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                2. Nature of Platform & Services
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                TutorOnline.pk is an educational marketplace connecting families, parents, and students with independent home and online tutors across Pakistan. While TutorOnline verifies tutor credentials and identity documents, tutors operate as independent educators and not direct employees of TutorOnline.pk.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 3 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="var(--brand-green-dark)" /> 3. Tutor Verification & Responsibilities
              </h2>
              <p style={{ color: 'var(--steel)', marginBottom: '12px' }}>
                Tutors registered on TutorOnline.pk agree to:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--steel)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Provide genuine, accurate CNIC identity information, academic degree qualifications, and teaching history during onboarding.</li>
                <li>Maintain strict professionalism, punctuality, and ethical conduct during all physical and online tuition sessions.</li>
                <li>Understand that uploading fraudulent certificates, impersonating identity, or misrepresenting credentials results in immediate permanent account termination and potential legal escalation under local laws.</li>
              </ul>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 4 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                4. Parent & Student Responsibilities
              </h2>
              <p style={{ color: 'var(--steel)', marginBottom: '12px' }}>
                Parents and students using the platform agree to:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--steel)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Provide accurate tuition requirement specifications (subject level, city/neighborhood, expected fee, mode of instruction).</li>
                <li>Treat educators with respect and ensure a safe, appropriate environment for home tuition sessions.</li>
                <li>Report any misconduct or safety concerns to platform support immediately.</li>
              </ul>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 5 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="#EF4444" /> 5. Safety, Zero Tolerance & Account Termination
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                TutorOnline.pk maintains zero tolerance for harassment, abuse, illegal activities, or non-academic exploitation. We reserve the right to suspend or permanently delete any user account (parent or tutor) found violating safety protocols, without prior notice.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 6 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
                6. Limitation of Liability
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                To the fullest extent permitted by law, TutorOnline.pk shall not be liable for direct, indirect, incidental, or consequential damages resulting from tutor-student interactions outside the scope of platform administration. Parents and tutors are advised to follow standard safety precautions during initial trial sessions.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            {/* Section 7 */}
            <section>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={20} color="var(--brand-green-dark)" /> 7. Governance & Contact
              </h2>
              <p style={{ color: 'var(--steel)', margin: 0 }}>
                These Terms & Conditions are governed by the laws of the Islamic Republic of Pakistan. For inquiries regarding our terms or platform policies, reach out to our team at:
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
