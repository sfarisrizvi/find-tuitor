import React, { forwardRef } from 'react';

export const Input = forwardRef(({ className = '', style = {}, ...props }, ref) => {
  const defaultStyle = {
    width: '100%',
    backgroundColor: 'var(--canvas)',
    color: 'var(--ink)',
    border: '1px solid var(--hairline-strong)',
    borderRadius: 'var(--rounded-md)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    height: '44px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    ...style
  };

  return (
    <input 
      ref={ref}
      style={defaultStyle} 
      className={`input-field ${className}`}
      onFocus={(e) => e.target.style.border = '2px solid var(--brand-green-dark)'}
      onBlur={(e) => e.target.style.border = '1px solid var(--hairline-strong)'}
      {...props} 
    />
  );
});

Input.displayName = 'Input';
