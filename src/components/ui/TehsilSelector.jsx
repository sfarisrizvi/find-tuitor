'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Check,
  X,
  ChevronDown,
  Loader2,
  Building2,
  CheckCircle2,
  Compass,
  Sparkles
} from 'lucide-react';
import {
  ALL_PAKISTAN_TEHSILS,
  TEHSILS_BY_LETTER,
  ALPHABET_INDEX,
  searchTehsils,
  findNearestTehsil,
  formatLocationDisplay
} from '../../lib/pakistan-tehsils';

/**
 * Modern Tehsil-first Location Selector with:
 * 1. A-Z Alphabetical Indexing and fast search across all 704 Tehsils
 * 2. One-click Live GPS Detection
 * 3. Verification Dialog with specific Region/Town input (e.g. Mehria Town)
 * 4. Direct DB save hook / callback support
 * 5. Dual-mode support (Compact filter topbar OR full form picker)
 */
export function TehsilSelector({
  value,                    // Can be string "Attock", array of strings, or object { tehsil, area, formattedAddress }
  onChange,                 // Returns (object, formattedAddressString) or string / array
  onSave,                   // Optional async function (payload) => Promise<void> for direct DB save
  mode = 'filter',          // 'filter' (search topbar) or 'form' (onboarding / job posting)
  multiple = false,         // Allow selecting multiple tehsils
  placeholder = 'Select Tehsil / City',
  allowAll = false,
  allOptionLabel = 'Any Tehsil / City',
  label,
  required = false,
  error,
  disabled = false,
  showQuickGps = true,      // Show quick GPS icon right in the input trigger
  triggerStyle = {},
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState(null);

  // Verification state for live GPS detection
  const [isDetecting, setIsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [detectedTehsil, setDetectedTehsil] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAreaInput, setVerifyAreaInput] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbSavedNotice, setDbSavedNotice] = useState(false);

  // Region / Area input (e.g. Mehria Town)
  const initialArea = typeof value === 'object' && value ? (value.area || '') : '';
  const initialTehsil = typeof value === 'object' && value ? (value.tehsil || '') : (typeof value === 'string' ? value : '');
  const [areaInput, setAreaInput] = useState(initialArea);
  const [selectedTehsil, setSelectedTehsil] = useState(() => {
    if (!initialTehsil) return null;
    return ALL_PAKISTAN_TEHSILS.find(t => t.name.toLowerCase() === initialTehsil.toLowerCase()) || {
      name: initialTehsil,
      district: '',
      division: '',
      province: ''
    };
  });

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const letterRefs = useRef({});

  // Adjust state when value prop changes (React recommended pattern)
  const [prevValueProp, setPrevValueProp] = useState(value);
  if (value !== prevValueProp) {
    setPrevValueProp(value);
    if (typeof value === 'string') {
      if (!value) {
        setSelectedTehsil(null);
      } else {
        const found = ALL_PAKISTAN_TEHSILS.find(t => t.name.toLowerCase() === value.toLowerCase());
        setSelectedTehsil(found || { name: value, district: '', division: '', province: '' });
      }
    } else if (typeof value === 'object' && value) {
      if (value.tehsil) {
        const found = ALL_PAKISTAN_TEHSILS.find(t => t.name.toLowerCase() === value.tehsil.toLowerCase());
        setSelectedTehsil(found || { name: value.tehsil, district: value.district || '', division: value.division || '', province: value.province || '' });
      } else if (!value.tehsil) {
        setSelectedTehsil(null);
      }
      if (value.area !== undefined) {
        setAreaInput(value.area || '');
      }
    }
  }

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Do not auto-close verification modal on outside click if detecting was intentional
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filtered tehsils
  const filteredList = useMemo(() => {
    return searchTehsils(searchQuery);
  }, [searchQuery]);

  // Group filtered results by A-Z letter
  const groupedResults = useMemo(() => {
    if (searchQuery.trim()) {
      return { Results: filteredList };
    }
    const groups = {};
    ALPHABET_INDEX.forEach(letter => {
      if (TEHSILS_BY_LETTER[letter]?.length > 0) {
        groups[letter] = TEHSILS_BY_LETTER[letter];
      }
    });
    return groups;
  }, [searchQuery, filteredList]);

  // Scroll to selected letter
  const handleJumpToLetter = (letter) => {
    setActiveLetter(letter);
    setSearchQuery('');
    const targetEl = letterRefs.current[letter];
    if (targetEl && listContainerRef.current) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── LIVE LOCATION DETECTION ──
  const handleDetectLocation = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setGpsError('');

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestTehsil(latitude, longitude);
        setIsDetecting(false);

        if (nearest) {
          setDetectedTehsil({
            ...nearest,
            detectedLat: latitude,
            detectedLng: longitude
          });
          setVerifyAreaInput(areaInput || '');
          setShowVerifyModal(true);
          setIsOpen(false);
        } else {
          setGpsError('Could not match coordinates to a known Tehsil.');
        }
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === 1) {
          setGpsError('Location access denied. Please enable GPS permissions or select manually.');
        } else {
          setGpsError('Unable to retrieve location. Please search manually from the list.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  };

  // Apply selection and trigger onChange & optional DB save
  const applyTehsilSelection = async (tehsilObj, customArea = areaInput) => {
    setSelectedTehsil(tehsilObj);
    const formatted = formatLocationDisplay(customArea, tehsilObj.name, tehsilObj.district);
    
    const payload = {
      tehsil: tehsilObj.name,
      area: customArea || '',
      district: tehsilObj.district || '',
      division: tehsilObj.division || '',
      province: tehsilObj.province || '',
      lat: tehsilObj.detectedLat || tehsilObj.lat || null,
      lng: tehsilObj.detectedLng || tehsilObj.lng || null,
      formattedAddress: formatted
    };

    if (onChange) {
      onChange(payload, formatted);
    }

    if (onSave) {
      try {
        setIsSavingDb(true);
        await onSave(payload);
        setDbSavedNotice(true);
        setTimeout(() => setDbSavedNotice(false), 2500);
      } catch (err) {
        console.error('Error saving location to DB:', err);
      } finally {
        setIsSavingDb(false);
      }
    }

    return payload;
  };

  // Confirm detected Tehsil & save region in tehsil
  const handleConfirmDetected = async () => {
    if (!detectedTehsil) return;
    setAreaInput(verifyAreaInput);
    await applyTehsilSelection(detectedTehsil, verifyAreaInput);
    setShowVerifyModal(false);
  };

  const multipleSelected = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return [];
  }, [value, multiple]);

  const handleSelectTehsilItem = (tehsilObj) => {
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : [];
      const exists = current.includes(tehsilObj.name);
      const next = exists ? current.filter(x => x !== tehsilObj.name) : [...current, tehsilObj.name];
      if (onChange) {
        onChange(next);
      }
      return;
    }
    applyTehsilSelection(tehsilObj, areaInput);
    if (mode === 'filter') {
      setIsOpen(false);
    }
  };

  const handleAreaChange = (e) => {
    const newArea = e.target.value;
    setAreaInput(newArea);
    if (selectedTehsil) {
      applyTehsilSelection(selectedTehsil, newArea);
    }
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    if (multiple) {
      if (onChange) onChange([]);
      return;
    }
    setSelectedTehsil(null);
    setAreaInput('');
    if (onChange) {
      onChange(null, '');
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      if (!multipleSelected || multipleSelected.length === 0) return placeholder;
      if (multipleSelected.length === 1) return multipleSelected[0];
      return `${multipleSelected.length} Tehsils selected (${multipleSelected.slice(0, 2).join(', ')}${multipleSelected.length > 2 ? '...' : ''})`;
    }
    if (selectedTehsil) {
      return formatLocationDisplay(areaInput, selectedTehsil.name, selectedTehsil.district);
    }
    return placeholder;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', textAlign: 'left', ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0f172a)', marginBottom: '6px' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {/* ── TRIGGER BUTTON ── */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--canvas, #ffffff)',
          border: error ? '1.5px solid #ef4444' : '1px solid var(--hairline-strong, #cbd5e1)',
          borderRadius: '999px',
          padding: '8px 14px',
          minHeight: '42px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(5, 150, 105, 0.15)' : 'none',
          ...triggerStyle
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          <MapPin size={16} color="var(--brand-green-dark, #059669)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '13.5px',
              color: selectedTehsil ? 'var(--ink, #0f172a)' : 'var(--steel, #94a3b8)',
              fontWeight: selectedTehsil ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {getDisplayText()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Quick GPS detect button inside trigger */}
          {showQuickGps && !selectedTehsil && (
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              title="Detect my current location with GPS"
              style={{
                background: 'rgba(5, 150, 105, 0.08)',
                border: 'none',
                borderRadius: '999px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--brand-green-dark, #059669)',
                cursor: isDetecting ? 'wait' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isDetecting ? (
                <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Compass size={13} color="#059669" />
              )}
              <span className="hidden sm:inline">GPS</span>
            </button>
          )}

          {selectedTehsil && !required && (
            <button
              type="button"
              onClick={handleClearSelection}
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

      {/* ── SAVED NOTICE ── */}
      {dbSavedNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          color: 'var(--brand-green-dark, #065f46)',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={14} /> Location saved to database!
        </div>
      )}

      {/* ── OPTIONAL REGION INPUT IN FORM MODE ── */}
      {mode === 'form' && selectedTehsil && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={15} color="var(--stone, #64748b)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink, #1e293b)' }}>
              Area / Town / Neighborhood (Optional)
            </span>
          </div>
          <input
            type="text"
            placeholder="e.g. Mehria Town, Attock City or DHA Phase 5"
            value={areaInput}
            onChange={handleAreaChange}
            style={{
              marginTop: '4px',
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--hairline-strong, #cbd5e1)',
              background: 'var(--canvas, #ffffff)',
              fontSize: '13px',
              outline: 'none',
              color: 'var(--ink, #0f172a)'
            }}
          />
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--stone, #64748b)' }}>
            Card format: <strong style={{ color: 'var(--brand-green-dark, #065f46)' }}>{formatLocationDisplay(areaInput, selectedTehsil.name, selectedTehsil.district)}</strong>
          </div>
        </div>
      )}

      {/* ── DROPDOWN POPOVER ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1200,
            background: 'var(--canvas, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--hairline-strong, #cbd5e1)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.16)',
            width: '320px',
            maxWidth: '90vw',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            textAlign: 'left',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* 1. Live Search Input */}
          <div
            style={{
              padding: '10px 14px',
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
              placeholder="Search Tehsil, District, or Province..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
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

          {/* 2. Live Location Detector Button */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--hairline, #e2e8f0)',
              background: 'rgba(5, 150, 105, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--brand-green-dark, #065f46)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isDetecting ? 'wait' : 'pointer',
                padding: '4px 6px',
                borderRadius: '6px'
              }}
            >
              {isDetecting ? (
                <>
                  <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Detecting GPS Location...
                </>
              ) : (
                <>
                  <Compass size={14} color="#059669" />
                  Detect Live Location (GPS)
                </>
              )}
            </button>
            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTehsil(null);
                  if (onChange) onChange(null, '');
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--steel, #64748b)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {allOptionLabel}
              </button>
            )}
          </div>

          {gpsError && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#b91c1c', fontSize: '11px', borderBottom: '1px solid #fee2e2' }}>
              {gpsError}
            </div>
          )}

          {/* 3. Tehsils List */}
          <div
            ref={listContainerRef}
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '4px 0'
            }}
          >
            {filteredList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--steel, #64748b)', fontSize: '13px' }}>
                No tehsils found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredList.map((t) => {
                const isSelected = multiple
                  ? multipleSelected.includes(t.name)
                  : selectedTehsil?.name?.toLowerCase() === t.name.toLowerCase();
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTehsilItem(t)}
                    style={{
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                      transition: 'background-color 0.1s ease',
                      borderBottom: '1px solid rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: 'var(--ink, #0f172a)' }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--stone, #64748b)' }}>
                        {t.district} District • {t.province}
                      </span>
                    </div>

                    {isSelected && <Check size={16} color="var(--brand-green-dark, #059669)" strokeWidth={2.5} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── VERIFY DETECTED LOCATION MODAL WITH REGION INPUT & DB SAVE ── */}
      {showVerifyModal && detectedTehsil && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVerifyModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--canvas, #ffffff)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--hairline-strong, #e2e8f0)',
              animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Navigation size={18} color="#059669" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                    Verify Detected Location
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--stone, #64748b)' }}>
                    Live GPS Geolocation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--steel, #94a3b8)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Detected Tehsil Card */}
            <div style={{
              backgroundColor: 'rgba(5, 150, 105, 0.05)',
              border: '1.5px solid rgba(5, 150, 105, 0.2)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nearest Tehsil Detected
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink, #0f172a)', marginTop: '2px' }}>
                  {detectedTehsil.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--stone, #64748b)' }}>
                  {detectedTehsil.district} District • {detectedTehsil.province}
                  {detectedTehsil.distanceKm ? ` (~${detectedTehsil.distanceKm} km away)` : ''}
                </div>
              </div>
              <CheckCircle2 size={24} color="#059669" />
            </div>

            {/* Region / Town Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #0f172a)', marginBottom: '6px' }}>
                Specify Area / Town / Sector (in {detectedTehsil.name})
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Mehria Town, Attock City"
                value={verifyAreaInput}
                onChange={(e) => setVerifyAreaInput(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--hairline-strong, #cbd5e1)',
                  fontSize: '14px',
                  outline: 'none',
                  color: 'var(--ink, #0f172a)',
                  background: 'var(--canvas, #ffffff)'
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--stone, #64748b)' }}>
                Display on frontend: <strong style={{ color: 'var(--brand-green-dark, #065f46)' }}>{formatLocationDisplay(verifyAreaInput, detectedTehsil.name, detectedTehsil.district)}</strong>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmDetected}
                disabled={isSavingDb}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--brand-green-dark, #065f46)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: isSavingDb ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {isSavingDb ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    Confirm & Save Location
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setIsOpen(true);
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: 'var(--slate, #475569)',
                  border: '1px solid var(--hairline-strong, #cbd5e1)',
                  borderRadius: '12px',
                  padding: '9px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Pick a Different Tehsil from List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TehsilSelector;
