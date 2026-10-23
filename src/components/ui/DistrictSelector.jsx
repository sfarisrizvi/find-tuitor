'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import {
  PAKISTAN_LOCATIONS,
  POPULAR_CITIES,
  searchLocations,
  getLocationMeta
} from '../../lib/pakistan-locations';

/**
 * All-in-One Smart District Selector with Search and Province/Division Accordion.
 * Supports both single-select (string) and multi-select (array of strings).
 */
export function DistrictSelector({
  value,
  onChange,
  multiple = false,
  placeholder = 'Select City / District',
  label,
  required = false,
  error,
  disabled = false,
  showQuickPicks = true,
  allowAll = false,
  allOptionLabel = 'All Cities',
  style,
  triggerStyle
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProvinces, setExpandedProvinces] = useState(() => {
    // If a value is provided, pre-expand that province; otherwise expand Punjab
    if (value && typeof value === 'string') {
      const meta = getLocationMeta(value);
      if (meta?.province) return { [meta.province]: true };
    }
    return { Punjab: true, 'Islamabad Capital Territory': true };
  });

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize selected values as an array
  const selectedValues = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return value ? [value] : [];
  }, [value, multiple]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered locations based on search query
  const filteredLocations = useMemo(() => {
    return searchLocations(searchQuery);
  }, [searchQuery]);

  // Total matching districts count during search
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return filteredLocations.reduce(
      (sum, p) => sum + p.divisions.reduce((divSum, d) => divSum + d.districts.length, 0),
      0
    );
  }, [filteredLocations, searchQuery]);

  const toggleProvince = (provinceName) => {
    setExpandedProvinces((prev) => ({
      ...prev,
      [provinceName]: !prev[provinceName]
    }));
  };

  const handleSelect = (districtName) => {
    if (multiple) {
      const next = selectedValues.includes(districtName)
        ? selectedValues.filter((c) => c !== districtName)
        : [...selectedValues, districtName];
      onChange?.(next);
    } else {
      onChange?.(districtName);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelectAllOption = () => {
    if (multiple) {
      onChange?.([]);
    } else {
      onChange?.('');
      setIsOpen(false);
    }
  };

  const handleRemoveChip = (e, districtName) => {
    e.stopPropagation();
    if (multiple) {
      onChange?.(selectedValues.filter((c) => c !== districtName));
    }
  };

  const handleClearSingle = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  // Determine label for trigger button
  const getTriggerText = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      return null; // Will render chips
    }
    if (!value) return allowAll ? allOptionLabel : placeholder;
    return value;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--ink, #0f172a)',
            marginBottom: '6px'
          }}
        >
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        style={{
          minHeight: '44px',
          padding: multiple && selectedValues.length > 0 ? '6px 12px' : '10px 14px',
          borderRadius: 'var(--rounded-sm, 6px)',
          border: `1px solid ${error ? '#ef4444' : isOpen ? 'var(--brand-green, #10b981)' : 'var(--hairline-strong, #cbd5e1)'}`,
          background: disabled ? 'var(--surface-subtle, #f1f5f9)' : 'var(--canvas, #ffffff)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxShadow: isOpen ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          ...triggerStyle
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          <MapPin size={16} color="var(--brand-green-dark, #059669)" style={{ flexShrink: 0 }} />

          {multiple ? (
            selectedValues.length === 0 ? (
              <span style={{ fontSize: '14px', color: 'var(--steel, #94a3b8)' }}>{placeholder}</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedValues.map((city) => (
                  <span
                    key={city}
                    style={{
                      background: '#ecfdf5',
                      color: 'var(--brand-green-dark, #047857)',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #a7f3d0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {city}
                    <X
                      size={12}
                      onClick={(e) => handleRemoveChip(e, city)}
                      style={{ cursor: 'pointer', strokeWidth: 3 }}
                    />
                  </span>
                ))}
              </div>
            )
          ) : (
            <span
              style={{
                fontSize: '14px',
                color: value ? 'var(--ink, #0f172a)' : 'var(--steel, #94a3b8)',
                fontWeight: value ? 500 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {getTriggerText()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {!multiple && value && !required && (
            <button
              type="button"
              onClick={handleClearSingle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--steel, #94a3b8)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            color="var(--steel, #64748b)"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </div>

      {error && (
        <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
          {error}
        </span>
      )}

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1100,
            background: 'var(--canvas, #ffffff)',
            borderRadius: 'var(--rounded-md, 8px)',
            border: '1px solid var(--hairline-strong, #cbd5e1)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
            maxHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* ── SEARCH INPUT ── */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--hairline, #e2e8f0)',
              background: 'var(--surface, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={16} color="var(--steel, #64748b)" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search district, division, or province..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: 'var(--ink, #0f172a)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--steel, #94a3b8)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Result Counter (if searching) */}
          {searchQuery.trim() && (
            <div
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                color: 'var(--steel, #64748b)',
                background: 'var(--surface-subtle, #f1f5f9)',
                borderBottom: '1px solid var(--hairline, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>Matches for &ldquo;{searchQuery}&rdquo;</span>
              <strong>{matchCount} district{matchCount === 1 ? '' : 's'}</strong>
            </div>
          )}

          {/* ── QUICK PICKS (Top Metropolitan Cities) ── */}
          {showQuickPicks && !searchQuery.trim() && (
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid var(--hairline, #e2e8f0)',
                background: 'var(--surface-feature, #f0fdf4)'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-green-dark, #065f46)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}
              >
                <Sparkles size={12} /> Popular Cities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {allowAll && (
                  <button
                    type="button"
                    onClick={handleSelectAllOption}
                    style={{
                      background: (!value || (multiple && selectedValues.length === 0)) ? 'var(--brand-green-dark, #059669)' : '#ffffff',
                      color: (!value || (multiple && selectedValues.length === 0)) ? '#ffffff' : 'var(--slate, #334155)',
                      border: '1px solid var(--hairline-strong, #cbd5e1)',
                      borderRadius: '12px',
                      padding: '3px 9px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {allOptionLabel}
                  </button>
                )}
                {POPULAR_CITIES.map((city) => {
                  const isSelected = selectedValues.includes(city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelect(city)}
                      style={{
                        background: isSelected ? 'var(--brand-green-dark, #059669)' : '#ffffff',
                        color: isSelected ? '#ffffff' : 'var(--slate, #334155)',
                        border: isSelected ? '1px solid var(--brand-green-dark, #059669)' : '1px solid var(--hairline, #e2e8f0)',
                        borderRadius: '12px',
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ACCORDION LIST: Province -> Division -> District ── */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '6px 0'
            }}
          >
            {filteredLocations.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: 'var(--steel, #64748b)',
                  fontSize: '13px'
                }}
              >
                No districts found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredLocations.map((prov) => {
                const isSearching = Boolean(searchQuery.trim());
                const isExpanded = isSearching || Boolean(expandedProvinces[prov.province]);
                const totalDistrictsInProvince = prov.divisions.reduce(
                  (sum, d) => sum + d.districts.length,
                  0
                );

                return (
                  <div key={prov.province} style={{ borderBottom: '1px solid var(--hairline, #f1f5f9)' }}>
                    {/* Province Header Accordion Trigger */}
                    <div
                      onClick={() => !isSearching && toggleProvince(prov.province)}
                      style={{
                        padding: '8px 14px',
                        background: isExpanded ? 'var(--surface, #f8fafc)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: isSearching ? 'default' : 'pointer',
                        userSelect: 'none',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!isSearching && (
                          <ChevronRight
                            size={14}
                            color="var(--steel, #64748b)"
                            style={{
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                          {prov.province}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--steel, #64748b)',
                          background: 'var(--canvas, #ffffff)',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          border: '1px solid var(--hairline, #e2e8f0)',
                          fontWeight: 600
                        }}
                      >
                        {totalDistrictsInProvince}
                      </span>
                    </div>

                    {/* Divisions & Districts inside Province */}
                    {isExpanded && (
                      <div style={{ padding: '4px 12px 10px 16px', background: 'var(--surface-subtle, #fbfcfe)' }}>
                        {prov.divisions.map((div) => (
                          <div key={div.division} style={{ marginTop: '8px' }}>
                            {/* Bold Division Header */}
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: 'var(--brand-green-dark, #065f46)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '4px 6px',
                                borderLeft: '2px solid var(--brand-green, #10b981)',
                                marginBottom: '4px'
                              }}
                            >
                              {div.division}
                            </div>

                            {/* Districts Grid / List */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '4px',
                                paddingLeft: '8px'
                              }}
                            >
                              {div.districts.map((district) => {
                                const isSelected = selectedValues.includes(district);
                                return (
                                  <div
                                    key={district}
                                    onClick={() => handleSelect(district)}
                                    role="button"
                                    tabIndex={0}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: isSelected ? 700 : 500,
                                      color: isSelected ? 'var(--brand-green-dark, #047857)' : 'var(--slate, #334155)',
                                      background: isSelected ? '#ecfdf5' : 'transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      transition: 'all 0.1s ease',
                                      border: isSelected ? '1px solid #a7f3d0' : '1px solid transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {district}
                                    </span>
                                    {isSelected && <Check size={13} color="var(--brand-green-dark, #047857)" strokeWidth={3} />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Multi-Select Footer Done button */}
          {multiple && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--hairline, #e2e8f0)',
                background: 'var(--canvas, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--steel, #64748b)' }}>
                {selectedValues.length} selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'var(--brand-green-dark, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default DistrictSelector;
