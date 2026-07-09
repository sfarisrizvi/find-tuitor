import React from 'react';

export function Badge({ children, variant = 'green', className = '', style = {}, ...props }) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 600,
    fontSize: '13px',
    lineHeight: 1.4,
  };

  const variants = {
    green: {
      backgroundColor: 'var(--brand-green)',
      color: 'var(--on-primary)',
      padding: '2px 8px',
      borderRadius: 'var(--rounded-sm)',
    },
    'green-soft': {
      backgroundColor: 'var(--brand-green-soft)',
      color: 'var(--brand-green-dark)',
      padding: '4px 10px',
      borderRadius: 'var(--rounded-full)',
    },
    purple: {
      backgroundColor: 'var(--accent-purple)',
      color: 'var(--on-dark)',
      padding: '2px 8px',
      borderRadius: 'var(--rounded-sm)',
    },
    orange: {
      backgroundColor: 'var(--accent-orange)',
      color: 'var(--on-dark)',
      padding: '2px 8px',
      borderRadius: 'var(--rounded-sm)',
    },
    popular: {
      backgroundColor: 'var(--brand-teal-deep)',
      color: 'var(--brand-green)',
      padding: '4px 10px',
      borderRadius: 'var(--rounded-full)',
    }
  };

  const mergedStyle = { ...baseStyles, ...variants[variant], ...style };

  return (
    <span style={mergedStyle} className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}
