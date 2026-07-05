import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  style = {},
  ...props 
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: 1.3,
    padding: '10px 22px',
    borderRadius: 'var(--rounded-full)',
    transition: 'all 0.15s ease',
    textDecoration: 'none'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--brand-green)',
      color: 'var(--on-primary)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--ink)',
      border: '1px solid var(--hairline-strong)',
    },
    'on-dark': {
      backgroundColor: 'var(--brand-green)',
      color: 'var(--on-primary)',
    },
    'secondary-on-dark': {
      backgroundColor: 'transparent',
      color: 'var(--on-dark)',
      border: '1px solid var(--hairline-dark)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--ink)',
      padding: '8px 12px',
      borderRadius: 'var(--rounded-md)',
    }
  };

  const mergedStyle = { ...baseStyles, ...variants[variant], ...style };

  return (
    <button style={mergedStyle} className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
