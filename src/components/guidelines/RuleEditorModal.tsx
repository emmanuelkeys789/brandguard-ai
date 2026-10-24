import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, Link2, FileCheck2, HelpCircle } from 'lucide-react';
import type { BrandRule, RuleCategory, RuleSeverity } from '../../types';
import { RULE_CATEGORIES, RULE_SEVERITIES, isValidHttpUrl } from '../../services/brandStorage';
import { Button } from '../ui/Button';

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => boolean;
  initialRule?: BrandRule | null;
  brandId: string;
}

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
  brandId
}) => {
  const [title, setTitle] = useState(initialRule?.title || '');
  const [category, setCategory] = useState<RuleCategory>(initialRule?.category || 'Approved Facts');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [example, setExample] = useState(initialRule?.example || initialRule?.exampleViolation || '');
  const [severity, setSeverity] = useState<RuleSeverity>((initialRule?.severity as RuleSeverity) || 'Medium');
  const [sourceDescription, setSourceDescription] = useState(initialRule?.sourceDescription || initialRule?.sourceDocument || '');
  const [sourceUrl, setSourceUrl] = useState(initialRule?.sourceUrl || '');
  const [enabled, setEnabled] = useState(initialRule?.enabled !== undefined ? initialRule.enabled : initialRule?.isActive ?? true);

  const [errors, setErrors] = useState<{ title?: string; description?: string; sourceUrl?: string }>({});
  const [isDirty, setIsDirty] = useState(false);

  const handleFieldChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setIsDirty(true);
  };

  const getCategoryHelper = (cat: RuleCategory): string => {
    switch (cat) {
      case 'Approved Facts':
        return 'Define an established factual truth, certified price, release date, or organizational metric.';
      case 'Required Terms':
        return 'Specify mandatory naming, capitalization, trademark symbols, or required phrasing.';
      case 'Prohibited Terms':
        return 'Specify deprecated product names, banned words, slang, or unsupported buzzwords.';
      case 'Tone of Voice':
        return 'Establish stylistic voice boundaries, clarity directives, and rhythm standards.';
      case 'Claims & Restrictions':
        return 'Define restrictions on performance claims, legal warranties, or regulatory disclaimers.';
      case 'Visual Guidelines':
        return 'Define logo usage rules, typography standards, or color palette mandates.';
      case 'Accessibility':
        return 'Specify contrast, alt-text, readable typography, and universal usability requirements.';
      case 'Other':
      default:
        return 'General governance rule or policy directive.';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; description?: string; sourceUrl?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Rule title is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Rule description / requirement is required.';
    }
    if (sourceUrl.trim() && !isValidHttpUrl(sourceUrl)) {
      newErrors.sourceUrl = 'Source URL must be a valid web address starting with http:// or https://';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const saved = onSave({
      id: initialRule?.id,
      brandId: brandId || 'default-brand',
      title: title.trim(),
      category,
      description: description.trim(),
      example: example.trim() || undefined,
      severity,
      sourceDescription: sourceDescription.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      enabled
    });

    if (saved) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-modal-title"
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
          maxWidth: '680px',
          maxHeight: '92vh',
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
              <FileCheck2 size={16} color="var(--accent-lime)" />
            </div>
            <div>
              <h2 id="rule-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {initialRule ? 'Edit Brand Rule' : 'New Brand Rule'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Configure deterministic policies and approved knowledge references.
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Rule Title (Required) */}
            <div>
              <label
                htmlFor="rule-title"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Rule Title <span style={{ color: 'var(--accent-lime)' }}>*</span>
              </label>
              <input
                id="rule-title"
                type="text"
                placeholder="e.g. Official Product Pricing or Superlative Claim Substantiation"
                value={title}
                onChange={(e) => {
                  handleFieldChange(setTitle, e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${errors.title ? 'var(--accent-rose)' : 'var(--border-medium)'}`,
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              {errors.title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--accent-rose)', fontSize: '12px' }}>
                  <AlertCircle size={13} />
                  <span>{errors.title}</span>
                </div>
              )}
            </div>

            {/* Category and Severity Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Category */}
              <div>
                <label
                  htmlFor="rule-category"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
                >
                  Rule Category <span style={{ color: 'var(--accent-lime)' }}>*</span>
                </label>
                <select
                  id="rule-category"
                  value={category}
                  onChange={(e) => handleFieldChange(setCategory, e.target.value as RuleCategory)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#12151E',
                    border: '1px solid var(--border-medium)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {RULE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#12151E', color: '#F4F4F6' }}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                  {getCategoryHelper(category)}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label
                  htmlFor="rule-severity"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
                >
                  Audit Severity
                </label>
                <select
                  id="rule-severity"
                  value={severity}
                  onChange={(e) => handleFieldChange(setSeverity, e.target.value as RuleSeverity)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#12151E',
                    border: '1px solid var(--border-medium)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {RULE_SEVERITIES.map((sev) => (
                    <option key={sev} value={sev} style={{ background: '#12151E', color: '#F4F4F6' }}>
                      {sev} {sev === 'Critical' ? '(Blocks publication)' : sev === 'High' ? '(Requires review)' : '(Advisory)'}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '5px' }}>
                  Determines the audit threshold in review pipelines.
                </div>
              </div>
            </div>

            {/* Rule Description / Requirement (Required) */}
            <div>
              <label
                htmlFor="rule-description"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Rule Requirement or Approved Statement <span style={{ color: 'var(--accent-lime)' }}>*</span>
              </label>
              <textarea
                id="rule-description"
                rows={3}
                placeholder="State the exact approved fact, terminology requirement, or prohibited wording..."
                value={description}
                onChange={(e) => {
                  handleFieldChange(setDescription, e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${errors.description ? 'var(--accent-rose)' : 'var(--border-medium)'}`,
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  lineHeight: 1.5,
                  outline: 'none'
                }}
              />
              {errors.description && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--accent-rose)', fontSize: '12px' }}>
                  <AlertCircle size={13} />
                  <span>{errors.description}</span>
                </div>
              )}
            </div>

            {/* Example or Explanation (Optional) */}
            <div>
              <label
                htmlFor="rule-example"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
              >
                Example or Editorial Guidance <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                id="rule-example"
                rows={2}
                placeholder="e.g. Do not use 'best' or 'number one' unless audited evidence supports the specific claim."
                value={example}
                onChange={(e) => handleFieldChange(setExample, e.target.value)}
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

            {/* Source Information Header Box */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={15} color="var(--accent-lime)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Supporting Source & Evidence Reference <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
                </span>
              </div>

              {/* Source Description */}
              <div>
                <label
                  htmlFor="rule-source-desc"
                  style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}
                >
                  Source Document or Standard Name
                </label>
                <input
                  id="rule-source-desc"
                  type="text"
                  placeholder="e.g. Corporate Pricing Document FY2026 or Brand Standards Manual v3"
                  value={sourceDescription}
                  onChange={(e) => handleFieldChange(setSourceDescription, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Source URL */}
              <div>
                <label
                  htmlFor="rule-source-url"
                  style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}
                >
                  Source URL
                </label>
                <input
                  id="rule-source-url"
                  type="url"
                  placeholder="https://internal.yourcompany.com/standards/pricing"
                  value={sourceUrl}
                  onChange={(e) => {
                    handleFieldChange(setSourceUrl, e.target.value);
                    if (errors.sourceUrl) setErrors((prev) => ({ ...prev, sourceUrl: undefined }));
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${errors.sourceUrl ? 'var(--accent-rose)' : 'var(--border-subtle)'}`,
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                {errors.sourceUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--accent-rose)', fontSize: '12px' }}>
                    <AlertCircle size={13} />
                    <span>{errors.sourceUrl}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                <HelpCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Source descriptions and links provide references for editorial governance. BrandGuard AI stores these citations to substantiate reviewer decisions.
                </span>
              </div>
            </div>

            {/* Active Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active for Future Reviews
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  When enabled, this rule is actively evaluated during content audits.
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleFieldChange(setEnabled, e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    inset: 0,
                    borderRadius: '24px',
                    background: enabled ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.15)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: enabled ? '23px' : '3px',
                      bottom: '3px',
                      background: enabled ? '#07080B' : '#FFFFFF',
                      borderRadius: '50%',
                      transition: 'var(--transition-fast)'
                    }}
                  />
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
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
            <Button type="submit" variant="primary" size="sm" iconLeft={<ShieldAlert size={15} />}>
              {initialRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
