import React from 'react';
import { ShieldCheck, ArrowUpRight, Activity } from 'lucide-react';

interface FooterProps {
  onNavigateToApp: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToApp }) => {
  const handleOpenWorkspace = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateToApp();
  };

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 8, 11, 0.95)',
        paddingTop: '64px',
        paddingBottom: '40px',
        marginTop: '80px',
        position: 'relative'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '48px'
          }}
        >
          {/* Brand Info */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--accent-lime-dim)',
                  border: '1px solid var(--accent-lime-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={16} color="var(--accent-lime)" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>
                BrandGuard <span style={{ color: 'var(--accent-lime)', fontSize: '12px' }}>AI</span>
              </span>
            </div>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: 1.6,
                maxWidth: '320px',
                marginBottom: '20px'
              }}
            >
              The Brand Control Room. Autonomous pre-publication compliance: every claim has a source, every correction has a reason.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            >
              <Activity size={13} color="var(--accent-lime)" />
              <span>Control Room Engine: Online</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)',
                marginBottom: '16px',
                fontWeight: 600
              }}
            >
              Platform
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a
                  href="#product"
                  style={{ color: 'var(--text-secondary)', fontSize: '14px', transition: 'color 150ms' }}
                >
                  Brand Intelligence Ingestion
                </a>
              </li>
              <li>
                <a
                  href="#product"
                  style={{ color: 'var(--text-secondary)', fontSize: '14px', transition: 'color 150ms' }}
                >
                  Forensic Evidence Trace
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  style={{ color: 'var(--text-secondary)', fontSize: '14px', transition: 'color 150ms' }}
                >
                  Governance Workflow
                </a>
              </li>
              <li>
                <a
                  href="/app"
                  onClick={handleOpenWorkspace}
                  style={{
                    color: 'var(--accent-lime)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  Open workspace <ArrowUpRight size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Principles */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)',
                marginBottom: '16px',
                fontWeight: 600
              }}
            >
              Trust Architecture
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <a href="#trust" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Zero Hallucination Standard
                </a>
              </li>
              <li>
                <a href="#trust" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Sovereign Human Reviewer Veto
                </a>
              </li>
              <li>
                <a href="#trust" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Confidential Isolated Storage
                </a>
              </li>
              <li>
                <a href="#trust" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Audit Trail Traceability
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: '24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-tertiary)'
          }}
        >
          <div>
            © 2026 BrandGuard AI (Axiom Platform). Precision governance before publishing.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Art Direction: The Brand Control Room</span>
            <span>Release: v1.1-Production-Foundation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
