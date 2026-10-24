import React from 'react';
import {
  Building2,
  Users,
  MessageSquare,
  Globe,
  FileText,
  Edit3,
  Plus
} from 'lucide-react';
import type { BrandProfile } from '../../types';
import { Button } from '../ui/Button';

interface BrandProfileCardProps {
  profile: BrandProfile | null;
  onEdit: () => void;
  onCreate: () => void;
}

export const BrandProfileCard: React.FC<BrandProfileCardProps> = ({
  profile,
  onEdit,
  onCreate
}) => {
  if (!profile) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '32px 28px',
          background: 'rgba(16, 21, 33, 0.45)',
          border: '1px dashed var(--border-medium)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-lime-dim)',
            border: '1px solid var(--accent-lime-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}
        >
          <Building2 size={24} color="var(--accent-lime)" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          No Brand Profile Configured
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            margin: '0 auto 20px auto',
            lineHeight: 1.5
          }}
        >
          Establish your brand identity, target demographic, and communication tone. These parameters anchor all automated pre-publication audits across your workspace.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={onCreate} iconLeft={<Plus size={15} />}>
            Create Brand Profile
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(profile.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      className="glass-panel glass-specular"
      style={{
        padding: '24px 28px',
        background: 'rgba(16, 21, 33, 0.55)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner / Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(214, 255, 112, 0.16) 0%, rgba(18, 21, 30, 0.8) 100%)',
              border: '1px solid var(--accent-lime-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Building2 size={20} color="var(--accent-lime)" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {profile.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-lime-dim)',
                  border: '1px solid var(--accent-lime-border)',
                  color: 'var(--accent-lime)'
                }}
              >
                Active Governance Profile
              </span>
            </div>
            {profile.industry && (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {profile.industry}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="secondary" size="sm" onClick={onEdit} iconLeft={<Edit3 size={14} />}>
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Description */}
      {profile.description && (
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '20px',
            maxWidth: '900px'
          }}
        >
          {profile.description}
        </p>
      )}

      {/* Key Profile Attributes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: profile.additionalNotes ? '18px' : '12px'
        }}
      >
        {/* Communication Tone */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <MessageSquare size={16} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Communication Tone
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {profile.communicationTone}
            </div>
            {profile.toneCustomDetails && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {profile.toneCustomDetails}
              </div>
            )}
          </div>
        </div>

        {/* Target Audience */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <Users size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Target Audience
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {profile.targetAudience || 'General Audience'}
            </div>
          </div>
        </div>

        {/* Preferred Language */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <Globe size={16} color="var(--accent-violet)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preferred Language
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {profile.preferredLanguage || 'English (US)'}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes if any */}
      {profile.additionalNotes && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '14px'
          }}
        >
          <FileText size={15} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Policy Directives: </span>
            {profile.additionalNotes}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)'
        }}
      >
        <span>Profile ID: {profile.id}</span>
        <span>Last saved: {formattedDate}</span>
      </div>

      <style>{`
        .reset-sample-btn:hover {
          color: var(--text-secondary) !important;
        }
      `}</style>
    </div>
  );
};
