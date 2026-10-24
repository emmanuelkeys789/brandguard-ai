import React from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Terminal } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '620px',
        margin: '0 auto'
      }}
    >
      {/* -------------------------------------------------------------
          LAYER A: BACKGROUND ATMOSPHERE (Ambient Liquid Light Orbs)
          ------------------------------------------------------------- */}
      {/* Lime ambient liquid orb */}
      <div
        className="animate-liquid-drift-a"
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-30px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(214, 255, 112, 0.14) 0%, rgba(214, 255, 112, 0.04) 45%, transparent 70%)',
          filter: 'blur(65px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Violet ambient liquid orb */}
      <div
        className="animate-liquid-drift-b"
        style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-40px',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157, 140, 255, 0.12) 0%, rgba(157, 140, 255, 0.03) 45%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* -------------------------------------------------------------
          LAYER B: MAIN REVIEW CONTAINER (Translucent Optical Glass)
          ------------------------------------------------------------- */}
      <div
        className="glass-panel glass-specular glass-edge-sheen"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '26px 28px',
          background: 'linear-gradient(145deg, rgba(18, 24, 38, 0.44) 0%, rgba(10, 13, 21, 0.58) 100%)',
          backdropFilter: 'blur(28px) saturate(185%)',
          WebkitBackdropFilter: 'blur(28px) saturate(185%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderTopColor: 'rgba(255, 255, 255, 0.28)',
          borderBottomColor: 'rgba(255, 255, 255, 0.06)',
          boxShadow: 'var(--glass-inner-specular), 0 32px 72px -16px rgba(0, 0, 0, 0.75)'
        }}
      >
        {/* Top Control Room Telemetry Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            marginBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--accent-lime)',
                boxShadow: '0 0 10px var(--accent-lime)'
              }}
            />
            <span style={{ color: 'var(--accent-lime)', fontWeight: 700, letterSpacing: '0.08em' }}>
              CONTROL ROOM STREAM
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)'
            }}
          >
            <Terminal size={12} color="var(--accent-lime)" />
            <span>POLICY EVAL: 18ms</span>
          </div>
        </div>

        {/* -------------------------------------------------------------
            LAYER C: FLOATING REVIEW CARDS (Distinct Glass Sheets)
            ------------------------------------------------------------- */}

        {/* Sheet 1: Ingested Draft Copy */}
        <div
          className="glass-sheet-neutral"
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600
              }}
            >
              01 // SUBMITTED DRAFT COPY
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)'
              }}
            >
              Paragraph 2, Line 4
            </span>
          </div>

          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.55,
              color: 'var(--text-primary)',
              margin: 0
            }}
          >
            “Our enterprise cloud infrastructure is{' '}
            <span
              style={{
                background: 'rgba(251, 191, 36, 0.20)',
                color: '#FCD34D',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px dashed rgba(251, 191, 36, 0.6)',
                fontWeight: 600
              }}
            >
              the most trusted platform in India
            </span>
            , guaranteeing zero downtime across operations.”
          </p>
        </div>

        {/* CONNECTOR 1 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '22px',
            margin: '2px 0 8px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--accent-amber)',
            letterSpacing: '0.08em',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ width: '2px', height: '14px', background: 'var(--accent-amber)' }} />
          <span>↓ FORENSIC PARSER FLAGGED VARIANCE</span>
        </div>

        {/* Sheet 2: Detected Issue (Amber Glass) */}
        <div
          className="glass-sheet-amber"
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(251, 191, 36, 0.18)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={15} color="#FBBF24" />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FCD34D' }}>
                  02 // ISSUE: UNSUBSTANTIATED SUPERLATIVE
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: '#FBBF24',
                    background: 'rgba(251, 191, 36, 0.14)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                >
                  HIGH DRIFT RISK
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Evidence trace reveals no registered third-party audit benchmark or certification in company knowledge base.
              </p>
            </div>
          </div>
        </div>

        {/* CONNECTOR 2 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '22px',
            margin: '2px 0 8px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--accent-violet)',
            letterSpacing: '0.08em',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ width: '2px', height: '14px', background: 'var(--accent-violet)' }} />
          <span>↓ CROSS-REFERENCING APPROVED SOURCE</span>
        </div>

        {/* Sheet 3: Approved Standard §4.2 (Violet Glass) */}
        <div
          className="glass-sheet-violet"
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <BookOpen size={15} color="var(--accent-violet)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-violet)' }}>
              03 // GOVERNING RULE §4.2 (Legal & Brand Standards)
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            “Absolute comparative superlatives are strictly prohibited unless citing audited third-party benchmarks with published methodologies.”
          </p>
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              marginTop: '6px'
            }}
          >
            Source Authority: Corporate Legal Disclosure Standard Ref: 2026-B
          </div>
        </div>

        {/* CONNECTOR 3 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '22px',
            margin: '2px 0 8px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--accent-lime)',
            letterSpacing: '0.08em',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ width: '2px', height: '14px', background: 'var(--accent-lime)' }} />
          <span>↓ SYNTHESIZED VERIFIED REMEDY</span>
        </div>

        {/* Sheet 4: Suggested Audited Correction (Acid Lime Glass) */}
        <div
          className="glass-sheet-lime"
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px 18px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--accent-lime)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-lime)' }}>
                04 // SUGGESTED AUDITED CORRECTION
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-lime)',
                background: 'rgba(214, 255, 112, 0.16)',
                border: '1px solid var(--accent-lime-border)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              1-CLICK READY
            </span>
          </div>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.55,
              color: 'var(--text-primary)',
              margin: '0 0 10px 0'
            }}
          >
            “Serving over{' '}
            <strong style={{ color: 'var(--accent-lime)' }}>
              42,000 verified enterprise brand managers across 18 regional markets
            </strong>
            , delivering 99.98% verified uptime.”
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid rgba(214, 255, 112, 0.18)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Reason: Replaced subjective superlative with audited customer metrics</span>
            <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>Policy Compliant ✓</span>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div
          style={{
            marginTop: '14px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.02em',
            position: 'relative',
            zIndex: 2
          }}
        >
          ✦ Simulation stream demonstrating the 4-point verification pipeline
        </div>
      </div>
    </div>
  );
};
