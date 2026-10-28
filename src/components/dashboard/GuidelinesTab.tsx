import React, { useState } from 'react';
import { Plus, Download, ShieldCheck, Lock } from 'lucide-react';
import { useBrand } from '../../context/useBrand';
import { useAuth } from '../../context/useAuth';
import { BrandProfileCard } from '../guidelines/BrandProfileCard';
import { BrandProfileModal } from '../guidelines/BrandProfileModal';
import { RuleList } from '../guidelines/RuleList';
import { RuleEditorModal } from '../guidelines/RuleEditorModal';
import { DeleteRuleModal } from '../guidelines/DeleteRuleModal';
import { ToastNotification } from '../guidelines/ToastNotification';
import { Button } from '../ui/Button';
import type { BrandRule } from '../../types';

export const GuidelinesTab: React.FC = () => {
  const {
    brandProfile,
    rules,
    saveProfile,
    saveRule,
    deleteRule,
    toggleRuleEnabled,
    toast,
    dismissToast,
    showToast
  } = useBrand();
  const { can } = useAuth();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingRule, setEditingRule] = useState<BrandRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<BrandRule | null>(null);

  const handleOpenAddRule = () => {
    if (!can('manage_rules')) {
      showToast('error', 'Permission Denied', 'Only workspace Admins can create new brand rules.');
      return;
    }
    setEditingRule(null);
    setRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: BrandRule) => {
    if (!can('manage_rules')) {
      showToast('error', 'Permission Denied', 'Only workspace Admins can edit brand rules.');
      return;
    }
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const handleOpenDeleteRule = (rule: BrandRule) => {
    if (!can('manage_rules')) {
      showToast('error', 'Permission Denied', 'Only workspace Admins can delete brand rules.');
      return;
    }
    setRuleToDelete(rule);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete.id);
      setRuleToDelete(null);
    }
  };

  // Export rules to JSON file
  const handleExportBible = () => {
    const exportData = {
      profile: brandProfile,
      rules: rules,
      exportedAt: new Date().toISOString(),
      generator: 'BrandGuard AI Governance Suite'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandguard-${brandProfile?.name ? brandProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'policy'}-guidelines.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Policy Export Complete', 'Brand guidelines and rules exported to JSON file.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-lime-dim)',
              border: '1px solid var(--accent-lime-border)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-lime)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '10px'
            }}
          >
            <ShieldCheck size={12} color="var(--accent-lime)" />
            <span>ORGANIZATIONAL GOVERNANCE REPOSITORY</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 3.5vw, 30px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}
          >
            Brand Rules
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '720px', lineHeight: 1.5 }}>
            Manage approved facts, required terminology, prohibited claims, and brand voice.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportBible}
            iconLeft={<Download size={14} />}
            title="Download active brand rules as JSON"
          >
            Export Policy JSON
          </Button>

          {can('manage_rules') ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddRule}
              iconLeft={<Plus size={14} />}
              id="guidelines-add-rule-btn"
            >
              New Rule
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              iconLeft={<Lock size={14} />}
              id="guidelines-add-rule-btn-disabled"
              title="Admin role required to configure brand rules"
            >
              New Rule (Admin Only)
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 1: Brand Profile Card */}
      <section aria-labelledby="brand-profile-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 id="brand-profile-heading" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Brand Identity & Positioning
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Baseline organizational metadata
          </span>
        </div>

        <BrandProfileCard
          profile={brandProfile}
          onEdit={() => {
            if (!can('manage_profile')) {
              showToast('error', 'Permission Denied', 'Only workspace Admins can edit the brand profile.');
              return;
            }
            setProfileModalOpen(true);
          }}
          onCreate={() => {
            if (!can('manage_profile')) {
              showToast('error', 'Permission Denied', 'Only workspace Admins can configure the brand profile.');
              return;
            }
            setProfileModalOpen(true);
          }}
          canManageProfile={can('manage_profile')}
        />
      </section>

      {/* SECTION 2: Brand Rules Module */}
      <section aria-labelledby="brand-rules-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 id="brand-rules-heading" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Governance Rules & Approved Knowledge
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {rules.length} configured rules
          </span>
        </div>

        <RuleList
          rules={rules}
          onAddRule={handleOpenAddRule}
          onEditRule={handleOpenEditRule}
          onDeleteRule={handleOpenDeleteRule}
          onToggleRule={toggleRuleEnabled}
          canManageRules={can('manage_rules')}
        />
      </section>

      {/* Modals & Dialogs (Rendered when open) */}
      {profileModalOpen && (
        <BrandProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onSave={saveProfile}
          initialData={brandProfile}
        />
      )}

      {ruleModalOpen && (
        <RuleEditorModal
          isOpen={ruleModalOpen}
          onClose={() => setRuleModalOpen(false)}
          onSave={saveRule}
          initialRule={editingRule}
          brandId={brandProfile?.id || 'default-brand'}
        />
      )}

      {deleteModalOpen && (
        <DeleteRuleModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setRuleToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          rule={ruleToDelete}
        />
      )}

      {/* Toast Feedback */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </div>
  );
};
