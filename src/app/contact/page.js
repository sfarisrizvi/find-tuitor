'use client';
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'parent_student',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit form.');
      }

      setStatus(data.message || 'Message sent successfully! We will get back to you shortly.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'parent_student',
        message: ''
      });
    } catch (err) {
      setStatus(`Submission failed: ${err.message}`);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: 'calc(100vh - 64px)', padding: 'var(--spacing-xxl) 0' }}>
      <title>Contact Us | TutorOnline.pk</title>
      <meta name="description" content="Get in touch with TutorOnline.pk. Ask questions about billing, security escrow, academic vetting, or support." />
      <link rel="canonical" href="https://tutoronline.pk/contact" />
      <meta property="og:site_name" content="TutorOnline.pk" />
      <meta property="og:title" content="Contact Us | TutorOnline.pk" />
      <meta property="og:description" content="Get in touch with TutorOnline.pk. Ask questions about billing, security escrow, academic vetting, or support." />
      <meta property="og:url" content="https://tutoronline.pk/contact" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://tutoronline.pk/featured-image.jpg" />
      <meta property="og:image:secure_url" content="https://tutoronline.pk/featured-image.jpg" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Contact Us | TutorOnline.pk" />
      <meta name="twitter:description" content="Get in touch with TutorOnline.pk. Ask questions about billing, security escrow, academic vetting, or support." />
      <meta name="twitter:image" content="https://tutoronline.pk/featured-image.jpg" />
      <div className="container" style={{ maxWidth: '1000px' }}>

        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 700 }}>Get In Touch</h1>
          <p style={{ color: 'var(--steel)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            Have questions about payments, trial lessons, or academic verification? Drop us a line.
          </p>
        </div>

        <div className="grid-split" style={{ gap: 'var(--spacing-xxl)', alignItems: 'start' }}>
          
          {/* Left Side: Contact Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Contact Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} color="var(--brand-green-dark)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--stone)', display: 'block' }}>EMAIL US</span>
                    <strong style={{ fontSize: '15px', color: 'var(--charcoal)' }}>support@tutoronline.pk</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} color="var(--brand-green-dark)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--stone)', display: 'block' }}>CALL / WHATSAPP</span>
                    <a href="https://wa.me/923455235079" target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px', color: 'var(--charcoal)', fontWeight: 600, textDecoration: 'none' }}>
                      +92 345 5235079
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} color="var(--brand-green-dark)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--stone)', display: 'block' }}>HEADQUARTERS</span>
                    <strong style={{ fontSize: '15px', color: 'var(--charcoal)' }}>DHA Phase 5, Lahore, Pakistan</strong>
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Follow Our Community</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a 
                  href="https://www.facebook.com/mytutoronline" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--rounded-full)', backgroundColor: '#1877F2', color: '#ffffff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                >
                  Facebook
                </a>
                <a 
                  href="https://www.instagram.com/tutoronline.pk_/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--rounded-full)', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#ffffff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                >
                  Instagram
                </a>
                <a 
                  href="https://wa.me/923455235079" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--rounded-full)', backgroundColor: '#25D366', color: '#ffffff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <Card style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Send Us a Message</h3>
            
            {status && (
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: 'var(--rounded-md)', 
                backgroundColor: status.includes('successfully') ? 'var(--brand-green-soft)' : 'var(--surface-soft)', 
                color: status.includes('successfully') ? 'var(--brand-green-dark)' : 'var(--charcoal)',
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                {status}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Name</label>
                <Input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Email Address</label>
                <Input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Phone Number</label>
                <Input type="tel" name="phone" placeholder="e.g. 03001234567" value={formData.phone} onChange={handleChange} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>I am a...</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                  className="input-field"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: 'var(--rounded-md)',
                    border: '1px solid var(--hairline-strong)',
                    backgroundColor: 'var(--canvas)',
                    fontSize: '15px'
                  }}
                >
                  <option value="parent_student">Parent or Student</option>
                  <option value="tutor">Tutor / Teacher</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Message</label>
                <textarea 
                  name="message" 
                  rows={4} 
                  placeholder="How can we help you?" 
                  value={formData.message} 
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--rounded-md)',
                    border: '1px solid var(--hairline-strong)',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    resize: 'none'
                  }}
                />
              </div>

              <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                Send Message
              </Button>
            </form>
          </Card>

        </div>
      </div>
    </div>
  );
}
