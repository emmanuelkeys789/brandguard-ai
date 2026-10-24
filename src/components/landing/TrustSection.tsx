import React from 'react';
import { ShieldCheck, UserCheck, Lock, Info, CheckCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const TrustSection: React.FC = () => {
  return (
    <section
      id="trust"
      style={{
        padding: '96px 0',
        position: 'relative',
        background: 'rgba(9, 10, 13, 0.85)'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ maxWidth: '640px', marginBottom: '56px' }}>
          <div className="glass-pill glass-pill-accent" style={{ marginBottom: '14px' }}>
            <span>RESPONSIBLE AI ARCHITECTURE</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(30px, 4.5vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              color: 'var(--text-primary)'
            }}
          >
            Built on verifiable truth, not synthetic guesswork.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
            Brand governance demands strict determinism. We reject opaque black-box recommendations in favour of clear evidence, human veto authority, and data privacy.
          </p>
        </div>

        {/* 3 Core Principles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}
        >
          {/* Principle 1 */}
          <GlassCard interactive>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(214, 255, 112, 0.1)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <ShieldCheck size={22} color="var(--accent-lime)" />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
              1. Evidence before assumptions
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              Every flagged issue references a specific corporate guideline, legal restriction, or missing benchmark document. If an assertion cannot be traced to a verifiable standard, it is never flagged as a violation.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-lime)' }}>
              <CheckCircle size={14} />
              <span>Zero-hallucination citation mandate</span>
            </div>
          </GlassCard>

          {/* Principle 2 */}
          <GlassCard interactive>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(157, 140, 255, 0.1)',
                border: '1px solid rgba(157, 140, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <UserCheck size={22} color="var(--accent-violet)" />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
              2. AI recommendations with human control
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              AI models propose corrections and explain trade-offs, but human editors maintain absolute veto power. No content is published, altered, or blocked without an authenticated human sign-off record.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-violet)' }}>
              <CheckCircle size={14} />
              <span>Sovereign reviewer override</span>
            </div>
          </GlassCard>

          {/* Principle 3 */}
          <GlassCard interactive>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(94, 158, 255, 0.1)',
                border: '1px solid rgba(94, 158, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <Lock size={22} color="var(--accent-blue)" />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
              3. Confidential content handled responsibly
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              Pre-publication campaign drafts, unpublished earnings releases, and proprietary guidelines are treated as strictly confidential. Client copy is never used to train generalized foundation models.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-blue)' }}>
              <CheckCircle size={14} />
              <span>Isolated governance boundaries</span>
            </div>
          </GlassCard>
        </div>

        {/* Prototype Transparency Notice Box */}
        <div
          className="glass-panel"
          style={{
            padding: '20px 24px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <Info size={20} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              Prototype Transparency Notice
            </span>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              This interface represents the frontend foundation and interaction architecture for BrandGuard AI. Active LLM inference, enterprise security certifications, and database synchronization will be integrated in subsequent engineering phases.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
