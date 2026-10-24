import React, { useState } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import type { BrandProfile, CommunicationTone } from '../../types';
import { COMMUNICATION_TONES } from '../../services/brandStorage';
import { Button } from '../ui/Button';

interface BrandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => boolean;
  initialData?: BrandProfile | null;
}

export const BrandProfileModal: React.FC<BrandProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || '');
  const [communicationTone, setCommunicationTone] = useState<CommunicationTone>(initialData?.communicationTone || 'Professional');
  const [toneCustomDetails, setToneCustomDetails] = useState(initialData?.toneCustomDetails || '');
  const [preferredLanguage, setPreferredLanguage] = useState(initialData?.preferredLanguage || 'English (US)');
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');

  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isDirty, setIsDirty] = useState(false);

  const handleFieldChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setIsDirty(true);
    if (errors.name) {
      setErrors({});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrors({ name: 'Brand name is required to configure a governance profile.' });
      return;
    }

    const success = onSave({
      id: initialData?.id,
      name: name.trim(),
      description: description.trim(),
      industry: industry.trim(),
      targetAudience: targetAudience.trim(),
      communicationTone,
      toneCustomDetails: communicationTone === 'Custom' ? toneCustomDetails.trim() : undefined,
      preferredLanguage: preferredLanguage.trim() || 'English (US)',
      additionalNotes: additionalNotes.trim()
    });

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 7, 10, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel glass-specular"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(13, 16, 25, 0.96)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-lime-dim)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building2 size={16} color="var(--accent-lime)" />
            </div>
            <div>
              <h2 id="brand-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {initialData ? 'Edit Brand Profile' : 'Create Brand Profile'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Defines brand identity, audience, and baseline editorial tone.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDirty && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent-amber)',
                  background: 'var(--accent-amber-dim)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(251, 191, 36, 0.25)'
                }}
              >
                Unsaved changes
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Brand Name (Required) */}
            <div>
              <label
                htmlFor="brand-name"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Brand Name <span style={{ color: 'var(--accent-lime)' }}>*</span>
              </label>
              <input
                id="brand-name"
                type="text"
                placeholder="e.g. BrandGuard AI or Axiom Global"
                value={name}
                onChange={(e) => handleFieldChange(setName, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${errors.name ? 'var(--accent-rose)' : 'var(--border-medium)'}`,
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: errors.name ? '0 0 0 1px var(--accent-rose)' : undefined
                }}
              />
              {errors.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--accent-rose)', fontSize: '12px' }}>
                  <AlertCircle size={13} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Short Brand Description */}
            <div>
              <label
                htmlFor="brand-description"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Short Brand Description
              </label>
              <textarea
                id="brand-description"
                rows={3}
                placeholder="Core mission, product offering, and market positioning..."
                value={description}
                onChange={(e) => handleFieldChange(setDescription, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  lineHeight: 1.5,
                  outline: 'none'
                }}
              />
            </div>

            {/* Two Column: Industry and Target Audience */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label
                  htmlFor="brand-industry"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
                >
                  Industry / Business Category
                </label>
                <input
                  id="brand-industry"
                  type="text"
                  placeholder="e.g. Enterprise Cloud Infrastructure"
                  value={industry}
                  onChange={(e) => handleFieldChange(setIndustry, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="brand-audience"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
                >
                  Target Audience
                </label>
                <input
                  id="brand-audience"
                  type="text"
                  placeholder="e.g. Marketing Directors & Security Leads"
                  value={targetAudience}
                  onChange={(e) => handleFieldChange(setTargetAudience, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Preferred Communication Tone */}
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}
              >
                Preferred Communication Tone
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {COMMUNICATION_TONES.map((tone) => (
                  <button
                    type="button"
                    key={tone}
                    onClick={() => handleFieldChange(setCommunicationTone, tone)}
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: communicationTone === tone ? 'var(--accent-lime-dim)' : 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid',
                      borderColor: communicationTone === tone ? 'var(--accent-lime-border)' : 'var(--border-subtle)',
                      color: communicationTone === tone ? 'var(--accent-lime)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              {communicationTone === 'Custom' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Describe custom tone nuance (e.g. Warm yet mathematically rigorous)"
                    value={toneCustomDetails}
                    onChange={(e) => handleFieldChange(setToneCustomDetails, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Preferred Language */}
            <div>
              <label
                htmlFor="brand-language"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Preferred Language
              </label>
              <input
                id="brand-language"
                type="text"
                placeholder="e.g. English (US), English (UK), German"
                value={preferredLanguage}
                onChange={(e) => handleFieldChange(setPreferredLanguage, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Additional Brand Notes */}
            <div>
              <label
                htmlFor="brand-notes"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Additional Brand Notes / Directives
              </label>
              <textarea
                id="brand-notes"
                rows={3}
                placeholder="Exceptions, compliance obligations, or specific legal disclaimers..."
                value={additionalNotes}
                onChange={(e) => handleFieldChange(setAdditionalNotes, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  lineHeight: 1.5,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(7, 8, 11, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {initialData ? 'Save Changes' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
