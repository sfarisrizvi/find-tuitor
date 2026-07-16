'use client';
import React, { useEffect, useRef } from 'react';

export function AuthSidebar() {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadLottie = async () => {
      // Dynamically load lottie-web from CDN to keep package size minimal and avoid SSR issues
      if (!window.lottie) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
          script.async = true;
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      if (isMounted && containerRef.current && window.lottie) {
        // Destroy existing animation before creating a new one
        if (animRef.current) {
          animRef.current.destroy();
        }
        
        animRef.current = window.lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/Study discussion.json'
        });
      }
    };

    loadLottie();

    return () => {
      isMounted = false;
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(135deg, #eafcf5 0%, #cff5e5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#0b1a24',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '90vh'
    }}>
      {/* Dynamic background circles */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(0,104,74,0.02)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(0,104,74,0.02)', pointerEvents: 'none' }} />
      
      <div style={{ maxWidth: '480px', textAlign: 'center', zIndex: 10 }}>
        {/* Lottie Animation Container */}
        <div ref={containerRef} style={{ width: '100%', height: '560px', margin: '-90px auto 0' }} />
        
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 16px 0', color: '#0b1a24', letterSpacing: '-0.5px' }}>
          Connect with Expert Tutors
        </h2>
        <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
          Find the perfect tutor for your academic needs. Real-time chat, verified profiles, and seamless online/physical sessions.
        </p>
      </div>
    </div>
  );
}
