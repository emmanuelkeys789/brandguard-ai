import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import type { BrandRule } from '../../types';
import { Button } from '../ui/Button';

interface DeleteRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rule: BrandRule | null;
}

export const DeleteRuleModal: React.FC<DeleteRuleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  rule
}) => {
  if (!isOpen || !rule) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(5, 7, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 18, 27, 0.98)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(248, 113, 113, 0.15)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={18} color="var(--accent-rose)" />
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <h3 id="delete-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Delete Brand Rule?
        </h3>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
          Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>"{rule.title}"</strong> ({rule.category})? This will immediately remove this rule from future automated audits and cannot be undone.
        </p>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {rule.title}
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', lineClamp: 2 }}>
            {rule.description}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(248, 113, 113, 0.18)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              color: '#F87171',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
            className="delete-confirm-btn"
          >
            <Trash2 size={14} />
            <span>Delete Rule</span>
          </button>
        </div>

        <style>{`
          .delete-confirm-btn:hover {
            background: rgba(248, 113, 113, 0.28) !important;
            border-color: rgba(248, 113, 113, 0.6) !important;
          }
        `}</style>
      </div>
    </div>
  );
};
