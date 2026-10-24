import React, { useState } from 'react';
import {
  ChevronRight,
  AlertCircle,
  Plus,
  CheckCircle2,
  Circle,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useBrand } from '../../context/useBrand';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { DashboardTab } from '../../types';

interface OverviewTabProps {
  onNavigateTab: (tab: DashboardTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab }) => {
  const {
    brandProfile,
    rules,
    reviews,
    hasReviewedContent,
    hasUnderstoodResults,
    markUnderstoodResults,
    isOnboardingDismissed,
    setIsOnboardingDismissed
  } = useBrand();

  const [resultsGuideOpen, setResultsGuideOpen] = useState(false);

  const activeRulesCount = rules.filter(
    (r) => (r.enabled !== undefined ? r.enabled : r.isActive ?? true)
  ).length;

  // Onboarding steps completion determination from actual saved data & completed actions
  const step1Done = Boolean(brandProfile && brandProfile.name?.trim());
  const step2Done = rules.length > 0;
  const step3Done = Boolean(hasReviewedContent || reviews.length > 0);
  const step4Done = Boolean(hasUnderstoodResults || (hasReviewedContent && reviews.length > 0));

  const completedStepsCount = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const progressPercentage = Math.round((completedStepsCount / 4) * 100);

  const handleOpenResultsGuide = () => {
    setResultsGuideOpen(true);
    markUnderstoodResults();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header with requested title and description */}
      <div>
        <div className="glass-pill glass-pill-accent" style={{ marginBottom: '10px' }}>
          <span>GOVERNANCE WORKSPACE</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5 }}>
          Your brand setup, recent review activity, and next steps.
        </p>
      </div>

      {/* Brand Profile Status Notice if unconfigured */}
      {!brandProfile && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="var(--accent-amber)" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                No Brand Profile Configured
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Set up your brand profile and core communication tone to anchor pre-publication checks.
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab('guidelines')}
            iconLeft={<Plus size={14} />}
          >
            Configure Brand Profile
          </Button>
        </div>
      )}

      {/* FIRST-TIME GETTING STARTED ONBOARDING GUIDE */}
      {!isOnboardingDismissed ? (
        <div
          className="glass-panel"
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(20, 26, 40, 0.6) 0%, rgba(13, 17, 26, 0.8) 100%)',
            border: '1px solid var(--accent-lime-border)',
            boxShadow: 'var(--shadow-glass)'
          }}
        >
          {/* Header of the guide */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
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
                <Sparkles size={16} color="var(--accent-lime)" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Getting Started Guide
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {completedStepsCount} of 4 steps completed ({progressPercentage}%) — updates automatically from your saved data
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Progress pill */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  background: completedStepsCount === 4 ? 'rgba(52, 211, 153, 0.15)' : 'var(--accent-lime-dim)',
                  border: '1px solid',
                  borderColor: completedStepsCount === 4 ? 'rgba(52, 211, 153, 0.35)' : 'var(--accent-lime-border)',
                  color: completedStepsCount === 4 ? '#34D399' : 'var(--accent-lime)'
                }}
              >
                {completedStepsCount === 4 ? 'All Steps Complete' : `${progressPercentage}% Done`}
              </span>

              <button
                type="button"
                onClick={() => setIsOnboardingDismissed(true)}
                title="Dismiss guide"
                aria-label="Dismiss getting started guide"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                className="guide-dismiss-btn"
              >
                <X size={13} />
                <span>Dismiss</span>
              </button>
            </div>
          </div>

          {/* Checklist 4 Steps Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px'
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: step1Done ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: step1Done ? 'rgba(52, 211, 153, 0.25)' : 'var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    STEP 1
                  </span>
                  {step1Done ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34D399', fontSize: '11px', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                      <Circle size={13} /> Pending
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Create your brand profile
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {step1Done
                    ? `Profile configured for "${brandProfile?.name}".`
                    : 'Set brand name, positioning, target audience, and default communication tone.'}
                </p>
              </div>

              <Button
                variant={step1Done ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onNavigateTab('guidelines')}
              >
                {step1Done ? 'View Profile' : 'Create Profile'}
              </Button>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: step2Done ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: step2Done ? 'rgba(52, 211, 153, 0.25)' : 'var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    STEP 2
                  </span>
                  {step2Done ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34D399', fontSize: '11px', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                      <Circle size={13} /> Pending
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Add your brand rules
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {step2Done
                    ? `${rules.length} rule${rules.length === 1 ? '' : 's'} saved (${activeRulesCount} active).`
                    : 'Add approved facts, required terms, prohibited claims, and voice guidelines.'}
                </p>
              </div>

              <Button
                variant={step2Done ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onNavigateTab('guidelines')}
              >
                {step2Done ? 'Manage Rules' : 'Add Brand Rules'}
              </Button>
            </div>

            {/* Step 3 */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: step3Done ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: step3Done ? 'rgba(52, 211, 153, 0.25)' : 'var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    STEP 3
                  </span>
                  {step3Done ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34D399', fontSize: '11px', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                      <Circle size={13} /> Pending
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Review your first piece of content
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {step3Done
                    ? 'Content check initiated in Check Content pipeline.'
                    : 'Submit or paste a draft to evaluate against your configured brand rules.'}
                </p>
              </div>

              <Button
                variant={step3Done ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onNavigateTab('review')}
              >
                {step3Done ? 'Check More Content' : 'Check Content'}
              </Button>
            </div>

            {/* Step 4 */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: step4Done ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: step4Done ? 'rgba(52, 211, 153, 0.25)' : 'var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    STEP 4
                  </span>
                  {step4Done ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34D399', fontSize: '11px', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                      <Circle size={13} /> Pending
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Understand the review results
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {step4Done
                    ? 'Review results structure and approval workflow understood.'
                    : 'Learn what compliance status, rule citations, and suggestions contain.'}
                </p>
              </div>

              <Button
                variant={step4Done ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleOpenResultsGuide}
              >
                {step4Done ? 'Review Guide' : 'Understand Results'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Reopen guide banner when dismissed */
        <div
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color="var(--accent-lime)" />
            <span>
              Getting Started Checklist is hidden ({completedStepsCount}/4 completed)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOnboardingDismissed(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-lime)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={12} /> Reopen Checklist
          </button>
        </div>
      )}

      {/* Real Workspace Overview Status & Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px'
        }}
      >
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '6px' }}>
            ACTIVE BRAND
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '6px'
            }}
            title={brandProfile ? brandProfile.name : 'Not Configured'}
          >
            {brandProfile ? brandProfile.name : 'Not Configured'}
          </div>
          <div style={{ fontSize: '12px', color: brandProfile ? 'var(--accent-lime)' : 'var(--accent-amber)' }}>
            {brandProfile ? `Tone: ${brandProfile.communicationTone}` : 'Needs configuration'}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '6px' }}>
            BRAND RULES
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}
          >
            {rules.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--accent-lime)' }}>
            {activeRulesCount} active for audits
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '6px' }}>
            SAVED REVIEWS
          </div>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}
          >
            {reviews.length}
          </div>
          <div style={{ fontSize: '12px', color: reviews.length > 0 ? 'var(--accent-lime)' : 'var(--text-tertiary)' }}>
            {reviews.length > 0 ? `${reviews.length} reviews recorded` : 'No reviews recorded yet'}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '6px' }}>
            CHECK ENGINE
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--accent-lime)',
              marginBottom: '6px'
            }}
          >
            Frontend Preview
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Deterministic rule matching ready
          </div>
        </GlassCard>
      </div>

      {/* Two Column Layout: Recent Reviews & Configured Brand Rules */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Recent Reviews Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Recent Content Reviews
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {reviews.length > 0 ? `${reviews.length} saved reviews` : 'Saved draft audit history'}
              </span>
            </div>
            {reviews.length > 0 && (
              <button
                onClick={() => onNavigateTab('history')}
                style={{
                  fontSize: '12px',
                  color: 'var(--accent-lime)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                View All <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Helpful Empty State when no reviews saved yet */}
          {reviews.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <FileText size={20} color="var(--text-tertiary)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                No reviews saved yet
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '340px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                Reviews will appear after a review is run and saved. You can check press releases, ad copy, or landing pages against your rules.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab('review')}
                iconLeft={<Plus size={14} />}
              >
                Check Content
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviews.slice(0, 4).map((review) => (
                <div
                  key={review.id}
                  onClick={() => onNavigateTab('history')}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="review-row-item"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '6px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '2px'
                          }}
                        >
                          {review.title}
                        </h4>
                        {(review.id === 'rev_spring_announcement_01' || review.id === 'rev_enterprise_overview_02') && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(214, 255, 112, 0.1)',
                              border: '1px solid var(--accent-lime-border)',
                              color: 'var(--accent-lime)'
                            }}
                          >
                            Sample
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {review.author} · {review.channel}
                      </div>
                    </div>
                    <Badge status={review.status} size="sm" />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)'
                    }}
                  >
                    <span>
                      {review.issuesCount === 0 ? (
                        <span style={{ color: 'var(--accent-lime)' }}>No issues found</span>
                      ) : (
                        <span style={{ color: 'var(--accent-amber)' }}>
                          {review.issuesCount} issue{review.issuesCount > 1 ? 's' : ''} detected
                        </span>
                      )}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {review.updatedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configured Brand Rules Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Configured Brand Rules
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {rules.length} configured ({activeRulesCount} active)
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('guidelines')}
              style={{
                fontSize: '12px',
                color: 'var(--accent-lime)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Manage Rules <ChevronRight size={14} />
            </button>
          </div>

          {/* Helpful Empty State when no rules saved */}
          {rules.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <AlertCircle size={20} color="var(--accent-amber)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Why brand rules are needed
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                Brand rules define approved facts, required terminology, prohibited claims, and brand voice. Content checks evaluate drafts against your active rules.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab('guidelines')}
                iconLeft={<Plus size={14} />}
                id="overview-add-rule-btn"
              >
                Add Your First Rule
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {rules.slice(0, 3).map((rule) => {
                const isActive = rule.enabled !== undefined ? rule.enabled : rule.isActive ?? true;
                return (
                  <div
                    key={rule.id}
                    onClick={() => onNavigateTab('guidelines')}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                    className="review-row-item"
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--accent-lime)',
                            background: 'var(--accent-lime-dim)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          {rule.category}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {rule.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: rule.severity === 'Critical' ? '#F87171' : rule.severity === 'High' ? '#FBBF24' : '#5E9EFF',
                          fontWeight: 500
                        }}
                      >
                        {rule.severity || 'Medium'}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {rule.description}
                    </p>

                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>Source: {rule.sourceDescription || rule.sourceDocument || 'Internal Policy'}</span>
                      <span style={{ color: isActive ? 'var(--accent-lime)' : 'var(--text-tertiary)' }}>
                        {isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Understand Review Results Modal for Onboarding Step 4 */}
      {resultsGuideOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setResultsGuideOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              background: 'rgba(15, 18, 25, 0.96)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Understanding Review Results
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResultsGuideOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              When a draft is evaluated by BrandGuard, the results contain four core elements designed for pre-publication governance:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  1. Compliance Status
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Approved</strong> (ready for publication), <strong>Needs review</strong> (contains flagged claims or terms), or <strong>Rejected</strong> (critical trademark or policy violations).
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  2. Clause-by-Clause Citations
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Every flagged sentence cites the exact Brand Rule requirement (e.g. prohibited terminology or unbacked superlative) and its supporting source document.
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  3. Suggested Corrections
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Recommended compliant phrasing replacing unverified superlatives or informal slang while preserving marketing intent.
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  4. Human Governance Gate
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Automated checks highlight issues, but editorial reviewers retain full control to accept revisions, adjust copy, or sign off.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResultsGuideOpen(false)}
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .review-row-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: var(--border-highlight) !important;
        }
        .guide-dismiss-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
};
