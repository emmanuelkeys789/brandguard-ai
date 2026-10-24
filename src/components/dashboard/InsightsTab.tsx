import React from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Layers, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBrand } from '../../context/useBrand';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { calculateReviewAnalytics } from '../../services/reviewAnalytics';
import type { DashboardTab, ReviewStatus } from '../../types';

interface InsightsTabProps {
  onNavigateTab?: (tab: DashboardTab) => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ onNavigateTab }) => {
  const { reviews, rules } = useBrand();

  // Compute analytics strictly from actual saved reviews and brand rules
  const analytics = calculateReviewAnalytics(reviews, rules);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div className="glass-pill glass-pill-accent" style={{ marginBottom: '10px' }}>
          <span>PORTFOLIO INTELLIGENCE</span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Trends & Insights
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Understand recurring issues using actual review data.
        </p>
      </div>

      {analytics.totalReviews === 0 ? (
        /* Helpful Empty State when there is insufficient data */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(214, 255, 112, 0.08)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <BarChart3 size={24} color="var(--accent-lime)" />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Insufficient review data for insights
            </h2>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.55 }}>
              Insights become useful after real reviews are recorded. Once you check and save drafts against your brand rules, recurring violations, channel health, and compliance trends will automatically calculate here.
            </p>

            {onNavigateTab && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigateTab('review')}
                iconRight={<ArrowRight size={15} />}
                id="insights-check-content-btn"
              >
                Go to Check Content
              </Button>
            )}
          </div>

          {/* Educational overview cards explaining what will be tracked */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px'
            }}
          >
            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <ShieldAlert size={18} color="var(--accent-amber)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Recurring Policy Violations
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Aggregates frequent violations across unbacked superlatives, prohibited terms, and missing trademark notations across all team members.
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Layers size={18} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Channel Compliance Health
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Compares policy adherence across different communication channels: press releases, landing pages, newsletters, and social copy.
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <TrendingUp size={18} color="#60A5FA" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  First-Pass Accuracy Trends
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Tracks the proportion of drafts that pass review cleanly over time without requiring revisions or policy exceptions.
              </p>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Real Insights Calculated from Actual Saved Reviews */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Missing or Outdated Checks Banner */}
          {/* Missing or Outdated Checks Banner */}
          {(analytics.checkRequiredCount > 0 || analytics.firstPassUnavailableCount > 0) && (
            <div
              className="glass-panel"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--accent-amber-border)',
                background: 'rgba(251, 191, 36, 0.05)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <AlertTriangle size={18} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {analytics.checkRequiredCount > 0 && (
                  <div>
                    <strong style={{ color: '#FBBF24' }}>
                      {analytics.checkRequiredCount} review{analytics.checkRequiredCount > 1 ? 's require' : ' requires'} check:
                    </strong>{' '}
                    Draft submissions with missing content or unverified results are displayed as "Check required" and excluded from compliance rates until audited.
                  </div>
                )}
                {analytics.firstPassUnavailableCount > 0 && (
                  <div style={{ marginTop: analytics.checkRequiredCount > 0 ? '4px' : '0' }}>
                    <strong style={{ color: '#FBBF24' }}>
                      {analytics.firstPassUnavailableCount} legacy review{analytics.firstPassUnavailableCount > 1 ? 's' : ''}:
                    </strong>{' '}
                    Marked "First-pass data unavailable" and excluded from first-pass compliance calculations rather than assuming zero issues.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top 3 KPI Cards based on actual review data */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px'
            }}
          >
            <GlassCard style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '6px' }}>
                TOTAL AUDITED REVIEWS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {analytics.totalAuditedReviews}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-lime)' }}>
                {analytics.checkRequiredCount > 0
                  ? `${analytics.checkRequiredCount} pending check (${analytics.totalReviews} total)`
                  : `Across ${analytics.totalReviews} saved submission${analytics.totalReviews === 1 ? '' : 's'}`}
              </div>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '6px' }}>
                CLEAN FIRST-PASS RATE
              </div>
              <div
                style={{
                  fontSize: analytics.cleanFirstPassRate !== null ? '28px' : '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color:
                    analytics.cleanFirstPassRate !== null
                      ? 'var(--accent-lime)'
                      : 'var(--text-tertiary)',
                  marginBottom: '4px'
                }}
              >
                {analytics.cleanFirstPassRate !== null
                  ? `${analytics.cleanFirstPassRate}%`
                  : 'First-pass data unavailable'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {analytics.hasVerifiableFirstPassData
                  ? `${analytics.cleanFirstPassCount} of ${analytics.firstPassVerifiableCount} drafts clean on initial check` +
                    (analytics.firstPassUnavailableCount > 0
                      ? ` (${analytics.firstPassUnavailableCount} unavailable)`
                      : '')
                  : 'Legacy records lack verified initial check data'}
              </div>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '6px' }}>
                AVG ISSUES PER DRAFT
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: analytics.hasAuditedData ? '#FBBF24' : 'var(--text-tertiary)',
                  marginBottom: '4px'
                }}
              >
                {analytics.hasAuditedData ? analytics.avgIssuesPerReview : 'Check required'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {analytics.hasAuditedData
                  ? `${analytics.totalCurrentIssues} active issue${analytics.totalCurrentIssues === 1 ? '' : 's'} across drafts`
                  : 'No active findings'}
              </div>
            </GlassCard>
          </div>

          {/* Two Column: Channel Compliance and Status Distribution */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px'
            }}
          >
            {/* Channel Performance Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Distribution Channel Breakdown
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '18px' }}>
                First-pass compliance segmented by distribution medium
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {analytics.channelBreakdown.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px' }}>
                    No channels recorded yet.
                  </div>
                ) : (
                  analytics.channelBreakdown.map((stat) => (
                    <div
                      key={stat.channel}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stat.channel}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {stat.firstPassVerifiableCount > 0
                              ? `${stat.cleanFirstPassCount} clean of ${stat.firstPassVerifiableCount} verified initial check${stat.firstPassVerifiableCount === 1 ? '' : 's'}` +
                                (stat.firstPassUnavailableCount > 0 ? ` (${stat.firstPassUnavailableCount} unavailable)` : '')
                              : `${stat.totalCount} submission${stat.totalCount === 1 ? '' : 's'} (First-pass data unavailable)`}
                          </div>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color:
                              stat.cleanRate === null
                                ? 'var(--text-tertiary)'
                                : stat.cleanRate >= 90
                                ? 'var(--accent-lime)'
                                : '#FBBF24',
                            fontSize: stat.cleanRate === null ? '11px' : '13px'
                          }}
                        >
                          {stat.cleanRate !== null ? `${stat.cleanRate}%` : 'First-pass data unavailable'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${stat.cleanRate !== null ? stat.cleanRate : 0}%`,
                            background:
                              (stat.cleanRate ?? 0) >= 90 ? 'var(--accent-lime)' : '#FBBF24',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status Breakdown Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Review Status Distribution
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '18px' }}>
                Governance outcomes for saved drafts
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {analytics.statusDistribution.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px' }}>
                    No review statuses recorded yet.
                  </div>
                ) : (
                  analytics.statusDistribution.map((item) => (
                    <div
                      key={item.status}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Badge status={item.status as ReviewStatus} size="sm" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {item.percentage}%
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: 'var(--accent-lime)',
                              background: 'var(--accent-lime-dim)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {item.count}
                          </span>
                        </div>
                      </div>

                      {/* Status Proportion Bar */}
                      <div
                        style={{
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${item.percentage}%`,
                            background: 'var(--accent-lime)',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top Recurring Policy Violations Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--accent-amber)" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Recurring Policy Violations
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {analytics.topViolations.length} active rule{analytics.topViolations.length === 1 ? '' : 's'} violated
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '18px' }}>
              Violations detected across verified drafts against active brand guidelines
            </p>

            {analytics.topViolations.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(214, 255, 112, 0.04)',
                  border: '1px solid var(--accent-lime-border)',
                  fontSize: '13px',
                  color: 'var(--accent-lime)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>0 active policy violations detected across saved drafts. All audited drafts are currently compliant.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics.topViolations.map((v) => (
                  <div
                    key={v.ruleId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.ruleTitle}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span>Category: {v.category}</span>
                        <span>•</span>
                        <span style={{ color: v.severity === 'Critical' ? '#F87171' : 'var(--accent-amber)' }}>
                          {v.severity}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#FBBF24',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {v.count} violation{v.count === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
