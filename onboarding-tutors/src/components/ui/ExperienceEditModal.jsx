import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { X, Plus, Trash2 } from 'lucide-react';

export function ExperienceEditModal({ initialExperience, onSave, onCancel }) {
  const [experiences, setExperiences] = useState(() => {
    if (initialExperience && initialExperience.length > 0) {
      return [...initialExperience];
    }
    return [{ institution: '', role: '', year_from: '', year_to: '', description: '', current: false }];
  });

  const updateExp = (idx, field, value) => {
    setExperiences(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'current' && value) {
        copy[idx].year_to = '';
      }
      return copy;
    });
  };

  const addExp = () => {
    setExperiences(prev => [...prev, { institution: '', role: '', year_from: '', year_to: '', description: '', current: false }]);
  };

  const removeExp = (idx) => {
    setExperiences(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    // Filter out empty experiences
    const valid = experiences.filter(e => e.institution && e.role && e.year_from);
    onSave(valid);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--canvas)', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-modal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Edit Experience</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
          {experiences.map((exp, idx) => (
            <div key={idx} style={{ position: 'relative', padding: '20px', backgroundColor: 'var(--surface-soft)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-md)' }}>
              {experiences.length > 1 && (
                <button
                  onClick={() => removeExp(idx)}
                  style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                  title="Remove this experience"
                >
                  <Trash2 size={18} />
                </button>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Institution / Platform</label>
                  <Input value={exp.institution} onChange={e => updateExp(idx, 'institution', e.target.value)} placeholder="e.g. LGS, The City School" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Role / Designation</label>
                  <Input value={exp.role} onChange={e => updateExp(idx, 'role', e.target.value)} placeholder="e.g. A-Level Physics Teacher" />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>From Year</label>
                  <Input type="number" min="1980" max="2030" value={exp.year_from} onChange={e => updateExp(idx, 'year_from', e.target.value)} placeholder="YYYY" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>To Year</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Input type="number" min="1980" max="2030" value={exp.year_to} onChange={e => updateExp(idx, 'year_to', e.target.value)} placeholder="YYYY" disabled={exp.current} style={{ flex: 1, backgroundColor: exp.current ? 'var(--surface)' : 'var(--canvas)' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      <input type="checkbox" checked={exp.current} onChange={e => updateExp(idx, 'current', e.target.checked)} style={{ cursor: 'pointer' }} />
                      Present
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description (Optional)</label>
                <textarea
                  value={exp.description}
                  onChange={e => updateExp(idx, 'description', e.target.value)}
                  placeholder="Briefly describe what you taught..."
                  style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: 'var(--rounded-md)', border: '1px solid var(--hairline-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addExp} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Another Experience
          </Button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Experience</Button>
        </div>
      </div>
    </div>
  );
}
