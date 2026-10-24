import React from 'react';
import { ArrowRight, Compass, Shield, CheckCircle } from 'lucide-react';
import { HeroVisual } from './HeroVisual';

interface HeroSectionProps {
  onStartReview: () => void;
  onExploreWorkflow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartReview,
  onExploreWorkflow
}) => {
  const handleStartReviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onStartReview();
  };

  const handleExploreWorkflowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onExploreWorkflow();
  };

  return (
    <section
      id="hero"
      style={{
        paddingTop: '130px',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '50px'
          }}
        >
          {/* Left Column: Typography & CTAs */}
          <div style={{ maxWidth: '580px' }}>
            {/* Understated category label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(214, 255, 112, 0.08)',
                border: '1px solid var(--accent-lime-border)',
                marginBottom: '24px'
              }}
            >
              <Shield size={13} color="var(--accent-lime)" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-lime)'
                }}
              >
                BRAND GOVERNANCE / BEFORE PUBLISHING
              </span>
            </div>

            {/* Display Headline */}
            <h1
              style={{
                fontSize: 'clamp(40px, 5.5vw, 64px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: 'var(--text-primary)',
                marginBottom: '20px'
              }}
            >
              Your brand.
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 20%, #A1A1AA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Without the drift.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
                marginBottom: '28px',
                fontWeight: 400
              }}
            >
              Catch off-brand language, unsupported claims, and inconsistent messaging before they go public.
            </p>

            {/* Core Product Promise Tagline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '32px'
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-lime)'
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.01em'
                }}
              >
                “Every claim has a source. Every correction has a reason.”
              </span>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '36px'
              }}
            >
              <a
                href="/app?tab=review"
                onClick={handleStartReviewClick}
                className="btn btn-primary btn-lg"
                id="hero-start-review-btn"
              >
                <span>Start a review</span>
                <ArrowRight size={18} />
              </a>

              <a
                href="#workflow"
                onClick={handleExploreWorkflowClick}
                className="btn btn-secondary btn-lg"
                id="hero-explore-workflow-btn"
              >
                <Compass size={18} />
                <span>Explore the workflow</span>
              </a>
            </div>

            {/* Micro stats / Trust indicators */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--text-tertiary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="var(--accent-lime)" />
                <span>Zero Hallucination Trace</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="var(--accent-lime)" />
                <span>Deterministic Rule Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="var(--accent-lime)" />
                <span>Human Editorial Veto</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Composition */}
          <div style={{ width: '100%' }}>
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
};
