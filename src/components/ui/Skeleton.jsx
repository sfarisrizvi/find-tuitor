'use client';
import React from 'react';

export function Skeleton({ variant = 'text', width, height, style }) {
  const baseStyle = {
    backgroundColor: 'var(--hairline-strong)',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
    width: width || '100%',
    height: height || '20px',
    ...style
  };

  if (variant === 'circle') {
    baseStyle.borderRadius = '50%';
  } else if (variant === 'card') {
    baseStyle.borderRadius = '8px';
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
      <div style={baseStyle} />
    </>
  );
}

export function TutorCardSkeleton() {
  return (
    <CardSkeleton>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Skeleton variant="circle" width="64px" height="64px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <Skeleton width="40%" height="18px" />
          <Skeleton width="60%" height="14px" />
        </div>
      </div>
      <Skeleton width="100%" height="12px" style={{ marginBottom: '8px' }} />
      <Skeleton width="90%" height="12px" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Skeleton width="60px" height="24px" style={{ borderRadius: '12px' }} />
        <Skeleton width="80px" height="24px" style={{ borderRadius: '12px' }} />
        <Skeleton width="50px" height="24px" style={{ borderRadius: '12px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--hairline)', paddingTop: '16px' }}>
        <div>
          <Skeleton width="50px" height="10px" style={{ marginBottom: '4px' }} />
          <Skeleton width="80px" height="18px" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="90px" height="36px" style={{ borderRadius: '18px' }} />
          <Skeleton width="90px" height="36px" style={{ borderRadius: '18px' }} />
        </div>
      </div>
    </CardSkeleton>
  );
}

export function CardSkeleton({ children, style }) {
  return (
    <div style={{
      backgroundColor: 'var(--canvas)',
      border: '1px solid var(--hairline)',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      ...style
    }}>
      {children}
    </div>
  );
}

export function PageSkeleton({ type = 'dashboard' }) {
  if (type === 'dashboard') {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '40%' }}>
            <Skeleton width="80%" height="32px" style={{ marginBottom: '8px' }} />
            <Skeleton width="50%" height="16px" />
          </div>
          <Skeleton width="180px" height="40px" style={{ borderRadius: '20px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <CardSkeleton>
            <Skeleton width="30%" height="14px" style={{ marginBottom: '12px' }} />
            <Skeleton width="60%" height="36px" style={{ marginBottom: '20px' }} />
            <Skeleton width="120px" height="28px" style={{ borderRadius: '14px' }} />
          </CardSkeleton>
          <CardSkeleton>
            <Skeleton width="30%" height="14px" style={{ marginBottom: '12px' }} />
            <Skeleton width="20%" height="36px" style={{ marginBottom: '20px' }} />
            <Skeleton width="100px" height="20px" />
          </CardSkeleton>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Skeleton width="200px" height="24px" />
          <Skeleton width="120px" height="36px" style={{ borderRadius: '18px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CardSkeleton>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <Skeleton width="40%" height="20px" style={{ marginBottom: '8px' }} />
                <Skeleton width="25%" height="14px" />
              </div>
              <Skeleton width="100px" height="24px" />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Skeleton width="80px" height="24px" style={{ borderRadius: '12px' }} />
              <Skeleton width="100px" height="36px" style={{ marginLeft: 'auto', borderRadius: '18px' }} />
            </div>
          </CardSkeleton>
          <CardSkeleton>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <Skeleton width="35%" height="20px" style={{ marginBottom: '8px' }} />
                <Skeleton width="30%" height="14px" />
              </div>
              <Skeleton width="90px" height="24px" />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Skeleton width="80px" height="24px" style={{ borderRadius: '12px' }} />
              <Skeleton width="100px" height="36px" style={{ marginLeft: 'auto', borderRadius: '18px' }} />
            </div>
          </CardSkeleton>
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="container" style={{ maxWidth: '800px', padding: '40px 20px' }}>
        <Skeleton width="40%" height="36px" style={{ marginBottom: '8px' }} />
        <Skeleton width="60%" height="16px" style={{ marginBottom: '32px' }} />

        <CardSkeleton style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Skeleton width="200px" height="24px" />
            <Skeleton width="60px" height="20px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div>
              <Skeleton width="80px" height="12px" style={{ marginBottom: '8px' }} />
              <Skeleton width="150px" height="18px" />
            </div>
            <div>
              <Skeleton width="80px" height="12px" style={{ marginBottom: '8px' }} />
              <Skeleton width="180px" height="18px" />
            </div>
            <div>
              <Skeleton width="80px" height="12px" style={{ marginBottom: '8px' }} />
              <Skeleton width="120px" height="18px" />
            </div>
            <div>
              <Skeleton width="80px" height="12px" style={{ marginBottom: '8px' }} />
              <Skeleton width="200px" height="18px" />
            </div>
          </div>
        </CardSkeleton>

        <CardSkeleton>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Skeleton width="220px" height="24px" />
            <Skeleton width="80px" height="20px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <CardSkeleton style={{ borderStyle: 'dashed' }}>
              <Skeleton width="60%" height="20px" style={{ marginBottom: '12px' }} />
              <Skeleton width="40%" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="50%" height="14px" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <Skeleton width="60px" height="22px" style={{ borderRadius: '4px' }} />
                <Skeleton width="50px" height="22px" style={{ borderRadius: '4px' }} />
              </div>
            </CardSkeleton>
            <CardSkeleton style={{ borderStyle: 'dashed' }}>
              <Skeleton width="50%" height="20px" style={{ marginBottom: '12px' }} />
              <Skeleton width="45%" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="55%" height="14px" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <Skeleton width="70px" height="22px" style={{ borderRadius: '4px' }} />
                <Skeleton width="60px" height="22px" style={{ borderRadius: '4px' }} />
              </div>
            </CardSkeleton>
          </div>
        </CardSkeleton>
      </div>
    );
  }

  if (type === 'tutor-details') {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
          <div>
            <CardSkeleton style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
                <Skeleton variant="circle" width="100px" height="100px" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="30%" height="28px" style={{ marginBottom: '8px' }} />
                  <Skeleton width="50%" height="16px" style={{ marginBottom: '12px' }} />
                  <Skeleton width="40%" height="20px" />
                </div>
              </div>
              <Skeleton width="150px" height="24px" style={{ marginBottom: '16px', borderRadius: '12px' }} />
              <Skeleton width="100%" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="100%" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="60%" height="14px" />
            </CardSkeleton>
          </div>
          <div>
            <CardSkeleton>
              <Skeleton width="60%" height="14px" style={{ marginBottom: '8px' }} />
              <Skeleton width="80%" height="32px" style={{ marginBottom: '24px' }} />
              <Skeleton width="100%" height="40px" style={{ borderRadius: '20px', marginBottom: '12px' }} />
              <Skeleton width="100%" height="40px" style={{ borderRadius: '20px' }} />
            </CardSkeleton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Skeleton width="50%" height="32px" style={{ marginBottom: '24px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="60px" />
        <Skeleton width="100%" height="60px" />
      </div>
    </div>
  );
}
