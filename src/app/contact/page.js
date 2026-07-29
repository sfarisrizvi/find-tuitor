'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Phone, ChevronDown, ShieldCheck, Check, ArrowRight, Lock } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'parent_student',
    message: ''
  });

  // Custom Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const roleLabels = {
    parent_student: 'Parent or Student',
    tutor: 'Tutor / Teacher'
  };

  // Anti-Bot Security Layer 1: Time-on-page tracking
  const [pageLoadTime] = useState(() => Date.now());
  
  // Anti-Bot Security Layer 2: Invisible Honeypot Trap (Bots fill this, humans never see it)
  const [honeypot, setHoneypot] = useState('');

  // Anti-Bot Security Layer 3: Interactive Slide-to-Verify Gesture Bar
  const [slideProgress, setSlideProgress] = useState(0); // 0 to 100
  const [isVerified, setIsVerified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderTrackRef = useRef(null);

  const [status, setStatus] = useState('');

  const handleDragStart = () => {
    if (isVerified) return;
    setIsDragging(true);
  };

  const handleDragMove = React.useCallback((clientX) => {
    if (!isDragging || isVerified || !sliderTrackRef.current) return;

    const rect = sliderTrackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const trackWidth = rect.width - 44; // minus slider handle width

    let percentage = Math.max(0, Math.min(100, (offsetX / trackWidth) * 100));
    setSlideProgress(percentage);

    if (percentage >= 90) {
      setSlideProgress(100);
      setIsVerified(true);
      setIsDragging(false);
    }
  }, [isDragging, isVerified]);

  const handleDragEnd = React.useCallback(() => {
    if (isVerified) return;
    setIsDragging(false);
    if (slideProgress < 90) {
      setSlideProgress(0); // reset if user lets go before completing
    }
  }, [isVerified, slideProgress]);

  // Global mouse / touch move listeners while dragging
  useEffect(() => {
    const onMouseMove = (e) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleDragMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Anti-Bot Defense Check 1: Invisible Honeypot Trap
    if (honeypot.trim() !== '') {
      console.warn('Bot detected via honeypot trap.');
      setStatus('Message sent successfully!'); // silent drop for bots
      return;
    }

    // Anti-Bot Defense Check 2: Minimum Time Threshold (2.5s)
    const timeSpentMs = Date.now() - pageLoadTime;
    if (timeSpentMs < 2500) {
      setStatus('Security Warning: Submission too fast. Please review your message.');
      return;
    }

    // Anti-Bot Defense Check 3: Slide to Verify Gesture Requirement
    if (!isVerified) {
      setStatus('Please slide the security verification bar to confirm you are human.');
      return;
    }

    setStatus('Submitting...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isVerified: true,
          timeSpentMs: timeSpentMs,
          honeypot: honeypot
        }),
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
      setIsVerified(false);
      setSlideProgress(0);
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
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 0 }} />

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Follow Our Community</h4>
              
              {/* Branded Social Icons Only (No Names, Site Brand Green Styling) */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {/* Facebook Icon */}
                <a 
                  href="https://www.facebook.com/mytutoronline" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="Facebook"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green-soft)',
                    border: '1px solid var(--hairline-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-green-dark)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = 'var(--brand-green-dark)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--hairline-strong)'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Instagram Icon */}
                <a 
                  href="https://www.instagram.com/tutoronline.pk_/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="Instagram"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green-soft)',
                    border: '1px solid var(--hairline-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-green-dark)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = 'var(--brand-green-dark)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--hairline-strong)'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>

                {/* WhatsApp Icon */}
                <a 
                  href="https://wa.me/923455235079" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="WhatsApp"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green-soft)',
                    border: '1px solid var(--hairline-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-green-dark)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = 'var(--brand-green-dark)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--hairline-strong)'; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <Card style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--rounded-xl)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Send Us a Message</h3>
            
            {status && (
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: 'var(--rounded-full)', 
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
              
              {/* Invisible Honeypot Trap (Hidden from humans, filled by bots) */}
              <input
                type="text"
                name="b_fax_verification"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', opacity: 0, top: '-9999px', left: '-9999px', pointerEvents: 'none' }}
              />

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Name</label>
                <Input 
                  name="name" 
                  placeholder="Your Name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  style={{ borderRadius: 'var(--rounded-full)', padding: '0 20px' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Email Address</label>
                <Input 
                  type="email" 
                  name="email" 
                  placeholder="you@example.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  style={{ borderRadius: 'var(--rounded-full)', padding: '0 20px' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Phone Number</label>
                <Input 
                  type="tel" 
                  name="phone" 
                  placeholder="e.g. 03455235079" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                  style={{ borderRadius: 'var(--rounded-full)', padding: '0 20px' }} 
                />
              </div>

              {/* Custom Branded Dropdown UI Component */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>I am a...</label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 20px',
                      borderRadius: 'var(--rounded-full)',
                      border: '1px solid var(--hairline-strong)',
                      backgroundColor: 'var(--canvas)',
                      color: 'var(--ink)',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{roleLabels[formData.role]}</span>
                    <ChevronDown size={18} color="var(--brand-green-dark)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                  </button>

                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '50px',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--canvas)',
                      border: '1px solid var(--hairline-strong)',
                      borderRadius: 'var(--rounded-lg)',
                      boxShadow: 'var(--shadow-card)',
                      zIndex: 50,
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => { setFormData({ ...formData, role: 'parent_student' }); setDropdownOpen(false); }}
                        style={{
                          padding: '12px 20px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: formData.role === 'parent_student' ? 'var(--brand-green-dark)' : 'var(--charcoal)',
                          backgroundColor: formData.role === 'parent_student' ? 'var(--brand-green-soft)' : 'transparent'
                        }}
                      >
                        Parent or Student
                      </div>
                      <div
                        onClick={() => { setFormData({ ...formData, role: 'tutor' }); setDropdownOpen(false); }}
                        style={{
                          padding: '12px 20px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: formData.role === 'tutor' ? 'var(--brand-green-dark)' : 'var(--charcoal)',
                          backgroundColor: formData.role === 'tutor' ? 'var(--brand-green-soft)' : 'transparent'
                        }}
                      >
                        Tutor / Teacher
                      </div>
                    </div>
                  )}
                </div>
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
                    padding: '14px 20px',
                    borderRadius: 'var(--rounded-lg)',
                    border: '1px solid var(--hairline-strong)',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    resize: 'none'
                  }}
                />
              </div>

              {/* ANTI-BOT SECURITY VERIFICATION: Interactive "Slide to Verify" Gesture Bar */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--charcoal)' }}>
                  <ShieldCheck size={16} color="var(--brand-green-dark)" />
                  Security Verification
                </label>

                <div 
                  ref={sliderTrackRef}
                  style={{
                    position: 'relative',
                    height: '48px',
                    width: '100%',
                    borderRadius: 'var(--rounded-full)',
                    backgroundColor: isVerified ? 'var(--brand-green-soft)' : 'var(--surface-soft)',
                    border: isVerified ? '1.5px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)',
                    overflow: 'hidden',
                    userSelect: 'none',
                    touchAction: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isVerified ? 'default' : 'pointer',
                    transition: 'border-color 0.2s ease, background-color 0.2s ease'
                  }}
                >
                  {/* Filled Progress Bar */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${slideProgress}%`,
                      backgroundColor: 'var(--brand-green-soft)',
                      opacity: 0.8,
                      borderRadius: 'var(--rounded-full)',
                      transition: isDragging ? 'none' : 'width 0.3s ease-out'
                    }}
                  />

                  {/* Text Overlay */}
                  <span style={{
                    position: 'relative',
                    zIndex: 2,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isVerified ? 'var(--brand-green-dark)' : 'var(--stone)',
                    pointerEvents: 'none'
                  }}>
                    {isVerified ? '✓ Verified Human' : 'Slide to verify human →'}
                  </span>

                  {/* Slider Draggable Handle / Knob */}
                  <div
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    style={{
                      position: 'absolute',
                      left: `calc(${slideProgress}% * (100% - 44px) / 100)`,
                      top: '2px',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isVerified ? 'var(--brand-green-dark)' : 'var(--canvas)',
                      color: isVerified ? '#ffffff' : 'var(--brand-green-dark)',
                      border: '1px solid var(--hairline-strong)',
                      boxShadow: 'var(--shadow-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isVerified ? 'default' : 'grab',
                      zIndex: 3,
                      transition: isDragging ? 'none' : 'left 0.3s ease-out, background-color 0.2s'
                    }}
                  >
                    {isVerified ? (
                      <Check size={18} color="#ffffff" />
                    ) : (
                      <ArrowRight size={18} color="var(--brand-green-dark)" />
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                disabled={!isVerified}
                style={{ 
                  width: '100%', 
                  marginTop: '8px', 
                  padding: '14px', 
                  borderRadius: 'var(--rounded-full)',
                  opacity: isVerified ? 1 : 0.6,
                  cursor: isVerified ? 'pointer' : 'not-allowed'
                }}
              >
                Send Message
              </Button>
            </form>
          </Card>

        </div>
      </div>
    </div>
  );
}
