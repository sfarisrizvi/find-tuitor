import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function Select({ value, onChange, options = [], placeholder = 'Select...', style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || { label: value || placeholder, value };

  const handleSelect = (val) => {
    if (onChange) {
      // simulate event structure if needed, or just pass value
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        ...style 
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--canvas)',
          color: 'var(--ink)',
          border: isOpen ? '2px solid var(--brand-green-dark)' : '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-md)',
          padding: '0 12px',
          height: style.height || '44px',
          fontSize: style.fontSize || '16px',
          cursor: 'pointer',
          userSelect: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ color: value ? 'var(--ink)' : 'var(--stone)' }}>
          {selectedOption.label || placeholder}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: 'var(--stone)', 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.2s ease' 
          }} 
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--canvas)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: 'var(--rounded-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 999,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                padding: '10px 12px',
                fontSize: style.fontSize || '15px',
                color: opt.value === value ? 'var(--brand-green-dark)' : 'var(--ink)',
                backgroundColor: opt.value === value ? 'var(--brand-green-soft)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                fontWeight: opt.value === value ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.target.style.backgroundColor = 'var(--surface-soft)';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.target.style.backgroundColor = 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
