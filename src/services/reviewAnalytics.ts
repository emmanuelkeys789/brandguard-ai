import type { ReviewItem, BrandRule } from '../types/index.ts';
import { isSummaryText } from './brandStorage.ts';
import { evaluateDraft } from './ruleEngine.ts';

export interface ChannelStat {
  channel: string;
  totalCount: number;
  auditedCount: number;
  cleanFirstPassCount: number;
  firstPassVerifiableCount: number;
  firstPassUnavailableCount: number;
  cleanRate: number | null; // null if firstPassVerifiableCount === 0 ("First-pass data unavailable")
  totalCurrentIssues: number;
  avgIssues: string;
}

export interface StatusStat {
  status: string;
  count: number;
  percentage: number; // 0 - 100 percentage
}

export interface RuleViolationStat {
  ruleId: string;
  ruleTitle: string;
  category: string;
  severity: string;
  count: number;
}

export interface ReviewAnalytics {
  totalReviews: number;
  totalAuditedReviews: number;
  checkRequiredCount: number;
  cleanFirstPassCount: number;
  firstPassVerifiableCount: number;
  firstPassUnavailableCount: number;
  cleanFirstPassRate: number | null; // null if firstPassVerifiableCount === 0 ("First-pass data unavailable")
  hasVerifiableFirstPassData: boolean;
  totalCurrentIssues: number;
  avgIssuesPerReview: string;
  channelBreakdown: ChannelStat[];
  statusDistribution: StatusStat[];
  topViolations: RuleViolationStat[];
  hasAuditedData: boolean;
}

/**
 * Checks whether a review record has missing or unverified check results.
 * Returns true if both original and current draft are missing/summary and findings are empty.
 */
export function isReviewCheckRequired(review: ReviewItem): boolean {
  if (!review) return true;
  const hasContent = Boolean(
    (review.originalDraft && !isSummaryText(review.originalDraft) && review.originalDraft.trim()) ||
    (review.currentDraft && !isSummaryText(review.currentDraft) && review.currentDraft.trim())
  );
  const hasFindings = Array.isArray(review.findings) && review.findings.length > 0;
  return !hasContent && !hasFindings;
}

/**
 * Derives the original first-pass issues count for a review.
 * Distinguishes the first pass from subsequent revisions so corrected drafts
 * do not falsely count as clean on their first pass.
 * Returns null if first-pass metrics are unverifiable (never infers from revised draft).
 */
export function getFirstPassIssuesCount(review: ReviewItem, rules?: BrandRule[]): number | null {
  if (isReviewCheckRequired(review)) {
    return null;
  }

  // 1. If explicitly stored, use the immutable first-pass count
  if (typeof review.firstPassIssuesCount === 'number') {
    return review.firstPassIssuesCount;
  }

  const activeRules = rules ? rules.filter((r) => r.enabled ?? true) : [];

  // 2. If original draft is available and valid marketing copy, evaluate against rules
  if (review.originalDraft && !isSummaryText(review.originalDraft) && activeRules.length > 0) {
    const evalRes = evaluateDraft(review.originalDraft, activeRules, {
      campaignTitle: review.title
    });
    return evalRes.findings.length;
  }

  // 3. If firstPassFindings is stored, use its length
  if (Array.isArray(review.firstPassFindings)) {
    return review.firstPassFindings.length;
  }

  // 4. Do NOT infer from currentDraft or current findings!
  // If originalDraft and firstPass data are unavailable, return null (unverifiable).
  return null;
}

/**
 * Computes portfolio metrics from actual saved reviews and active brand rules.
 * Does not use fake or demo data.
 * Safely handles empty review datasets without division-by-zero errors.
 */
export function calculateReviewAnalytics(
  reviews: ReviewItem[],
  rules: BrandRule[] = []
): ReviewAnalytics {
  const totalReviews = Array.isArray(reviews) ? reviews.length : 0;
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      totalAuditedReviews: 0,
      checkRequiredCount: 0,
      cleanFirstPassCount: 0,
      firstPassVerifiableCount: 0,
      firstPassUnavailableCount: 0,
      cleanFirstPassRate: 0,
      hasVerifiableFirstPassData: false,
      totalCurrentIssues: 0,
      avgIssuesPerReview: '0.0',
      channelBreakdown: [],
      statusDistribution: [],
      topViolations: [],
      hasAuditedData: false
    };
  }

  const activeRules = rules.filter((r) => r.enabled ?? true);

  // Separate audited reviews from those requiring check
  const checkRequiredReviews: ReviewItem[] = [];
  const auditedReviews: ReviewItem[] = [];

  for (const r of reviews) {
    if (isReviewCheckRequired(r)) {
      checkRequiredReviews.push(r);
    } else {
      auditedReviews.push(r);
    }
  }

  const totalAuditedReviews = auditedReviews.length;
  const checkRequiredCount = checkRequiredReviews.length;

  // Clean First-Pass Rate:
  // Evaluates only reviews with verifiable first-pass data.
  // Reviews with missing or unverifiable first-pass metrics are excluded from calculation.
  let cleanFirstPassCount = 0;
  let firstPassVerifiableCount = 0;
  let firstPassUnavailableCount = 0;

  for (const r of reviews) {
    const firstPassCount = getFirstPassIssuesCount(r, activeRules);
    if (firstPassCount === null) {
      firstPassUnavailableCount += 1;
    } else {
      firstPassVerifiableCount += 1;
      if (firstPassCount === 0) {
        cleanFirstPassCount += 1;
      }
    }
  }

  const hasVerifiableFirstPassData = firstPassVerifiableCount > 0;
  const cleanFirstPassRate =
    hasVerifiableFirstPassData
      ? Math.round((cleanFirstPassCount / firstPassVerifiableCount) * 100)
      : null;

  // Average issues per review across audited reviews
  const totalCurrentIssues = auditedReviews.reduce((sum, r) => {
    const count = Array.isArray(r.findings)
      ? r.findings.length
      : typeof r.issuesCount === 'number'
      ? r.issuesCount
      : 0;
    return sum + count;
  }, 0);

  const avgIssuesPerReview =
    totalAuditedReviews > 0
      ? (totalCurrentIssues / totalAuditedReviews).toFixed(1)
      : '0.0';

  // Channel Breakdown
  const channelMap = new Map<string, {
    totalCount: number;
    auditedCount: number;
    cleanFirstPassCount: number;
    firstPassVerifiableCount: number;
    firstPassUnavailableCount: number;
    totalCurrentIssues: number;
  }>();

  for (const r of reviews) {
    const ch = r.channel || 'Unspecified';
    if (!channelMap.has(ch)) {
      channelMap.set(ch, {
        totalCount: 0,
        auditedCount: 0,
        cleanFirstPassCount: 0,
        firstPassVerifiableCount: 0,
        firstPassUnavailableCount: 0,
        totalCurrentIssues: 0
      });
    }
    const stat = channelMap.get(ch)!;
    stat.totalCount += 1;

    const firstPassCount = getFirstPassIssuesCount(r, activeRules);
    if (firstPassCount !== null) {
      stat.firstPassVerifiableCount += 1;
      if (firstPassCount === 0) {
        stat.cleanFirstPassCount += 1;
      }
    } else {
      stat.firstPassUnavailableCount += 1;
    }

    if (!isReviewCheckRequired(r)) {
      stat.auditedCount += 1;
      const issues = Array.isArray(r.findings)
        ? r.findings.length
        : typeof r.issuesCount === 'number'
        ? r.issuesCount
        : 0;
      stat.totalCurrentIssues += issues;
    }
  }

  const channelBreakdown: ChannelStat[] = Array.from(channelMap.entries()).map(
    ([channel, data]) => ({
      channel,
      totalCount: data.totalCount,
      auditedCount: data.auditedCount,
      cleanFirstPassCount: data.cleanFirstPassCount,
      firstPassVerifiableCount: data.firstPassVerifiableCount,
      firstPassUnavailableCount: data.firstPassUnavailableCount,
      cleanRate:
        data.firstPassVerifiableCount > 0
          ? Math.round((data.cleanFirstPassCount / data.firstPassVerifiableCount) * 100)
          : null,
      totalCurrentIssues: data.totalCurrentIssues,
      avgIssues:
        data.auditedCount > 0
          ? (data.totalCurrentIssues / data.auditedCount).toFixed(1)
          : '0.0'
    })
  );

  // Status Distribution
  const statusMap = new Map<string, number>();
  for (const r of reviews) {
    const status = r.status || 'Draft';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }

  const statusDistribution: StatusStat[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({
      status,
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    })
  );

  // Top Recurring Policy Violations across all audited reviews
  const violationMap = new Map<string, {
    ruleId: string;
    ruleTitle: string;
    category: string;
    severity: string;
    count: number;
  }>();

  for (const r of auditedReviews) {
    if (Array.isArray(r.findings)) {
      for (const finding of r.findings) {
        const key = finding.ruleId || finding.ruleTitle;
        if (!violationMap.has(key)) {
          violationMap.set(key, {
            ruleId: finding.ruleId,
            ruleTitle: finding.ruleTitle || 'Brand Guideline Rule',
            category: finding.ruleCategory || 'General',
            severity: finding.severity || 'Medium',
            count: 0
          });
        }
        violationMap.get(key)!.count += 1;
      }
    }
  }

  const topViolations: RuleViolationStat[] = Array.from(violationMap.values())
    .sort((a, b) => b.count - a.count);

  return {
    totalReviews,
    totalAuditedReviews,
    checkRequiredCount,
    cleanFirstPassCount,
    firstPassVerifiableCount,
    firstPassUnavailableCount,
    cleanFirstPassRate,
    hasVerifiableFirstPassData,
    totalCurrentIssues,
    avgIssuesPerReview,
    channelBreakdown,
    statusDistribution,
    topViolations,
    hasAuditedData: totalAuditedReviews > 0
  };
}
