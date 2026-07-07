import React, { useState } from 'react';
import { Button } from './Button';
import { X, Check } from 'lucide-react';

const RANGE_LEVELS = ['Kindergarten', 'Primary', 'Secondary', 'Matric', 'Inter', 'BS/MS'];
const LEVEL_SUBJECTS = {
  'Matric': ['Arts', 'Biology', 'Computer'],
  'Inter': ['Arts', 'Pre-Engineering', 'Pre-Medical', 'Commerce', 'ICs', 'O Levels'],
  'BS/MS': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer', 'Urdu', 'AI', 'Digital Marketing', 'Other']
};

export function CategoryEditModal({ initialCategories, onSave, onCancel }) {
  const [activeLevels, setActiveLevels] = useState(() => {
    const state = {};
    RANGE_LEVELS.forEach(l => state[l] = false);
    initialCategories.forEach(cat => {
      if (state[cat.level] !== undefined) state[cat.level] = true;
    });
    return state;
  });

  const [expandedAccordions, setExpandedAccordions] = useState(() => {
    const state = {};
    RANGE_LEVELS.forEach(l => state[l] = false);
    return state;
  });

  const [selectedSubjectsByLevel, setSelectedSubjectsByLevel] = useState(() => {
    const state = {};
    RANGE_LEVELS.forEach(l => state[l] = []);
    initialCategories.forEach(cat => {
      if (cat.subject) {
        if (!state[cat.level]) state[cat.level] = [];
        if (!state[cat.level].includes(cat.subject)) {
          state[cat.level].push(cat.subject);
        }
      }
    });
    return state;
  });

  const toggleLevel = (level) => {
    setActiveLevels(prev => {
      const next = { ...prev, [level]: !prev[level] };
      if (next[level]) {
        setExpandedAccordions(e => ({ ...e, [level]: true }));
      } else {
        setExpandedAccordions(e => ({ ...e, [level]: false }));
        setSelectedSubjectsByLevel(s => ({ ...s, [level]: [] }));
      }
      return next;
    });
  };

  const toggleSubject = (level, subject) => {
    setSelectedSubjectsByLevel(prev => {
      const current = prev[level] || [];
      const isSelected = current.includes(subject);
      const updated = isSelected ? current.filter(s => s !== subject) : [...current, subject];
      return { ...prev, [level]: updated };
    });
  };

  const handleSave = () => {
    // Reconstruct flat categories array
    const newCategories = [];
    RANGE_LEVELS.forEach(level => {
      if (activeLevels[level]) {
        const subjects = selectedSubjectsByLevel[level] || [];
        if (LEVEL_SUBJECTS[level]) {
          subjects.forEach(sub => {
            newCategories.push({ level, subject: sub });
          });
          // If no subjects selected but level is active, still add the level
          if (subjects.length === 0) {
            newCategories.push({ level, subject: null });
          }
        } else {
          newCategories.push({ level, subject: null });
        }
      }
    });
    onSave(newCategories);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--canvas)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Edit Teaching Categories</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {RANGE_LEVELS.map(level => {
            const hasSubjects = !!LEVEL_SUBJECTS[level];
            const isActive = activeLevels[level];
            const isExpanded = expandedAccordions[level];
            const selectedSubjects = selectedSubjectsByLevel[level] || [];

            return (
              <div key={level} style={{ border: `1px solid ${isActive ? 'var(--brand-green-dark)' : 'var(--hairline-strong)'}`, borderRadius: 'var(--rounded-md)', overflow: 'hidden' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: isActive ? 'var(--brand-green-soft)' : 'var(--canvas)', cursor: 'pointer' }}
                  onClick={() => toggleLevel(level)}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isActive ? 'var(--brand-green-dark)' : 'var(--hairline-strong)'}`, backgroundColor: isActive ? 'var(--brand-green-dark)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                    {isActive && <Check size={14} color="#fff" />}
                  </div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>{level}</div>
                  {isActive && hasSubjects && (
                    <div 
                      style={{ padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={(e) => { e.stopPropagation(); setExpandedAccordions(prev => ({ ...prev, [level]: !prev[level] })); }}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--brand-green-dark)', fontWeight: 600, marginRight: '8px' }}>
                        {selectedSubjects.length} subjects
                      </span>
                      <span style={{ fontSize: '18px', color: 'var(--steel)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                    </div>
                  )}
                </div>
                
                {isActive && hasSubjects && isExpanded && (
                  <div style={{ padding: '16px', borderTop: '1px solid var(--brand-green-dark)', backgroundColor: 'var(--surface)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {LEVEL_SUBJECTS[level].map(subject => {
                        const isSubSelected = selectedSubjects.includes(subject);
                        return (
                          <div
                            key={subject}
                            onClick={() => toggleSubject(level, subject)}
                            style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: `1px solid ${isSubSelected ? 'var(--brand-green-dark)' : 'var(--hairline-strong)'}`, backgroundColor: isSubSelected ? 'var(--brand-green-dark)' : 'var(--canvas)', color: isSubSelected ? '#fff' : 'var(--charcoal)', transition: 'all 0.15s' }}
                          >
                            {subject}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Categories</Button>
        </div>
      </div>
    </div>
  );
}
