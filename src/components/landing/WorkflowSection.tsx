import React from 'react';
import { BookOpen, Send, Search, CheckCircle2 } from 'lucide-react';
import { WORKFLOW_STAGES } from '../../data/demoData';
import { GlassCard } from '../ui/GlassCard';

export const WorkflowSection: React.FC = () => {
  const getStageIcon = (step: string) => {
    switch (step) {
      case '01':
        return <BookOpen size={20} color="var(--accent-violet)" />;
      case '02':
        return <Send size={20} color="var(--accent-blue)" />;
      case '03':
        return <Search size={20} color="var(--accent-amber)" />;
      case '04':
      default:
        return <CheckCircle2 size={20} color="var(--accent-lime)" />;
    }
  };

  return (
    <section
      id="workflow"
      style={{
        padding: '96px 0',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 60px auto' }}>
          <div className="glass-pill glass-pill-accent" style={{ marginBottom: '16px' }}>
            <span>GOVERNANCE LIFECYCLE</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(30px, 4.5vw, 44px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              color: 'var(--text-primary)'
            }}
          >
            How content flows through BrandGuard.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
            A four-step cycle that safeguards reputation and maintains message integrity without bottlenecking campaign velocity.
          </p>
        </div>

        {/* 4-Stage Workflow Grid with Connectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            position: 'relative'
          }}
        >
          {WORKFLOW_STAGES.map((stage) => (
            <GlassCard
              key={stage.step}
              interactive
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                position: 'relative'
              }}
            >
              <div>
                {/* Step number and icon header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getStageIcon(stage.step)}
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-tertiary)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    STAGE {stage.step}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-lime)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '6px'
                  }}
                >
                  {stage.tag}
                </div>

                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: 'var(--text-primary)'
                  }}
                >
                  {stage.title}
                </h3>

                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '14px'
                  }}
                >
                  {stage.subtitle}
                </h4>

                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: '24px'
                  }}
                >
                  {stage.description}
                </p>
              </div>

              {/* Bottom deliverable token */}
              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>Output artifact:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {stage.deliverable}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
