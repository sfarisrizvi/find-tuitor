import React from 'react';

export function Card({ children, className = '', variant = 'base', style = {}, ...props }) {
  const baseStyles = {
    borderRadius: 'var(--rounded-lg)',
    backgroundColor: 'var(--canvas)',
    border: '1px solid var(--hairline)',
  };

  const variants = {
    base: {
      padding: 'var(--spacing-xl)',
    },
    feature: {
      padding: 'var(--spacing-xxl)',
    },
    'feature-dark': {
      backgroundColor: 'var(--brand-teal-deep)',
      color: 'var(--on-dark)',
      border: 'none',
      padding: 'var(--spacing-xxl)',
    },
  };

  const mergedStyle = { ...baseStyles, ...variants[variant], ...style };

  return (
    <div style={mergedStyle} className={`card card-${variant} ${className}`} {...props}>
      {children}
    </div>
  );
}
