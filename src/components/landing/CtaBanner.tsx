import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CtaBannerProps {
  onNavigateToApp: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onNavigateToApp }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateToApp();
  };

  return (
    <section style={{ padding: '80px 0 20px 0' }}>
      <div className="container">
        <div
          className="liquid-glass-elevated glass-edge-sheen"
          style={{
            padding: 'clamp(36px, 6vw, 64px) clamp(24px, 5vw, 56px)',
            background: 'linear-gradient(135deg, rgba(20, 26, 40, 0.56) 0%, rgba(10, 13, 20, 0.70) 100%)',
            borderTop: '1px solid rgba(214, 255, 112, 0.35)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)'
          }}
        >
          {/* Subtle lime glow orb */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              height: '240px',
              background: 'radial-gradient(ellipse, rgba(214, 255, 112, 0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-lime-dim)',
                border: '1px solid var(--accent-lime-border)',
                marginBottom: '20px'
              }}
            >
              <Sparkles size={14} color="var(--accent-lime)" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--accent-lime)',
                  textTransform: 'uppercase'
                }}
              >
                THE BRAND CONTROL ROOM
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 4.5vw, 44px)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}
            >
              Protect your brand before publication.
            </h2>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '32px'
              }}
            >
              Enter the BrandGuard governance workspace. Audit copy in real time, inspect corporate guidelines, and maintain audit traceability across every channel.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a
                href="/app"
                onClick={handleClick}
                className="btn btn-primary btn-lg"
                id="cta-launch-workspace-btn"
              >
                <span>Open workspace</span>
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
