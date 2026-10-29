import type { BrandProfile, BrandRule, RuleCategory, RuleSeverity, CommunicationTone, ReviewItem, ReviewDecisionRecord } from '../types';
import { evaluateDraft, calculateComplianceScore } from './ruleEngine.ts';
import { isValidReviewStateTransition } from './reviewTransitions.ts';

export const STORAGE_KEY_PROFILE = 'brandguard_brand_profile';
export const STORAGE_KEY_RULES = 'brandguard_brand_rules';
export const STORAGE_KEY_REVIEWS = 'brandguard_brand_reviews';
export const STORAGE_KEY_ONBOARDING = 'brandguard_onboarding_state';

export const RULE_CATEGORIES: RuleCategory[] = [
  'Approved Facts',
  'Required Terms',
  'Prohibited Terms',
  'Tone of Voice',
  'Claims & Restrictions',
  'Visual Guidelines',
  'Accessibility',
  'Other'
];

export const RULE_SEVERITIES: RuleSeverity[] = ['Critical', 'High', 'Medium', 'Low'];

export const COMMUNICATION_TONES: CommunicationTone[] = [
  'Professional',
  'Friendly',
  'Conversational',
  'Authoritative',
  'Informative',
  'Custom'
];

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Check if browser localStorage is available and writable
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__brandguard_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate HTTP / HTTPS URL format
 */
export function isValidHttpUrl(string: string): boolean {
  if (!string || !string.trim()) return true; // Optional field
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const DEFAULT_INITIAL_PROFILE: BrandProfile = {
  id: 'brand_axiom_01',
  name: 'BrandGuard AI',
  description: 'Autonomous enterprise brand governance and pre-publication compliance platform.',
  industry: 'Enterprise Software & Brand Governance',
  targetAudience: 'Global marketing directors, legal teams, and brand leads',
  communicationTone: 'Professional',
  toneCustomDetails: '',
  preferredLanguage: 'English (US)',
  additionalNotes: 'Requires verified third-party citations for all superlative and performance claims.',
  createdAt: '2026-04-01T12:00:00.000Z',
  updatedAt: '2026-10-22T08:00:00.000Z'
};

export const DEFAULT_UNSUPPORTED_CLAIMS_RULE: BrandRule = {
  id: 'rule-unsupported-claims',
  brandId: 'brand_axiom_01',
  title: 'Unsupported Marketing Claims',
  category: 'Claims & Restrictions',
  severity: 'Critical',
  description: 'Absolute claims and unsubstantiated superlatives (e.g. "most trusted", "fastest", "first in market", "100% immunity", "outperforming all") must not be made without citing registered third-party audit benchmarks.',
  example: '"BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity."',
  exampleViolation: '"guarantees 100% immunity from PR disasters"',
  remedyRecommendation: 'Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.',
  sourceDescription: 'Marketing Governance & Claim Substantiation Policy §4.2',
  sourceUrl: 'https://brandguard.internal/policies/claim-substantiation',
  enabled: true,
  createdAt: '2026-04-01T12:00:00.000Z',
  updatedAt: '2026-10-22T08:00:00.000Z'
};

export const SAMPLE_DEMO_REVIEW_IDS = [
  'rev_spring_announcement_01',
  'rev_enterprise_overview_02'
] as const;

/**
 * Checks whether a given review ID corresponds to a seeded demo sample review
 * that should not be automatically treated as an authoritative cloud record.
 */
export function isSampleDemoReview(id?: string | null): boolean {
  if (!id) return false;
  return id === 'rev_spring_announcement_01' || id === 'rev_enterprise_overview_02';
}

export const DEFAULT_INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_spring_announcement_01',
    isSample: true,
    title: 'Spring Campaign Announcement Draft',
    author: 'Workspace Reviewer',
    channel: 'Press Release',
    status: 'Needs review',
    updatedAt: '12 minutes ago',
    wordCount: 42,
    issuesCount: 1,
    confidenceScore: 80,
    summary: 'Flagged 1 unsupported marketing claim ("most trusted and fastest brand platform").',
    originalDraft: 'BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity. Our enterprise suite provides complete oversight across channels.',
    currentDraft: 'BrandGuard AI is the most trusted and fastest brand platform, guaranteeing 100% immunity. Our enterprise suite provides complete oversight across channels.',
    rulesCheckedCount: 1,
    firstPassIssuesCount: 1,
    firstPassScore: 80,
    firstPassFindings: [
      {
        id: 'finding_rule-unsupported-claims_21',
        ruleId: 'rule-unsupported-claims',
        ruleTitle: 'Unsupported Marketing Claims',
        ruleCategory: 'Claims & Restrictions',
        severity: 'Critical',
        matchedText: 'most trusted',
        location: {
          startIndex: 21,
          endIndex: 33,
          line: 1
        },
        explanation: 'Unsupported marketing claim or superlative detected: "most trusted". Rule "Unsupported Marketing Claims" requires verifiable benchmark citations.',
        suggestedCorrection: 'Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.',
        sourceDescription: 'Marketing Governance & Claim Substantiation Policy §4.2',
        sourceUrl: 'https://brandguard.internal/policies/claim-substantiation'
      }
    ],
    findings: [
      {
        id: 'finding_rule-unsupported-claims_21',
        ruleId: 'rule-unsupported-claims',
        ruleTitle: 'Unsupported Marketing Claims',
        ruleCategory: 'Claims & Restrictions',
        severity: 'Critical',
        matchedText: 'most trusted',
        location: {
          startIndex: 21,
          endIndex: 33,
          line: 1
        },
        explanation: 'Unsupported marketing claim or superlative detected: "most trusted". Rule "Unsupported Marketing Claims" requires verifiable benchmark citations.',
        suggestedCorrection: 'Replace with specific, verifiable performance metrics and cite audited third-party benchmarks.',
        sourceDescription: 'Marketing Governance & Claim Substantiation Policy §4.2',
        sourceUrl: 'https://brandguard.internal/policies/claim-substantiation'
      }
    ],
    decisionHistory: [
      {
        id: 'dec_init_01',
        action: 'Save Draft',
        reviewerName: 'Workspace Reviewer',
        reviewerComment: 'Initial submission pending editorial review.',
        timestamp: '2026-10-23T06:00:00.000Z',
        previousStatus: 'Draft',
        newStatus: 'Needs review'
      }
    ]
  },
  {
    id: 'rev_enterprise_overview_02',
    isSample: true,
    title: 'Enterprise Brand Governance Overview',
    author: 'Workspace Reviewer',
    channel: 'Product Overview',
    status: 'In review',
    updatedAt: '1 hour ago',
    wordCount: 48,
    issuesCount: 0,
    confidenceScore: 100,
    summary: '0 rule violations detected across active brand guidelines.',
    originalDraft: 'BrandGuard™ helps cross-functional marketing and legal teams review public-facing copy prior to release. By auditing draft statements against verified policies, reviewers maintain complete editorial authority with full audit traceability.',
    currentDraft: 'BrandGuard™ helps cross-functional marketing and legal teams review public-facing copy prior to release. By auditing draft statements against verified policies, reviewers maintain complete editorial authority with full audit traceability.',
    rulesCheckedCount: 1,
    firstPassIssuesCount: 0,
    firstPassScore: 100,
    firstPassFindings: [],
    findings: [],
    decisionHistory: [
      {
        id: 'dec_init_02',
        action: 'Save Draft',
        reviewerName: 'Workspace Reviewer',
        reviewerComment: 'Draft submitted with clean rule compliance. Awaiting human reviewer sign-off.',
        timestamp: '2026-10-23T05:15:00.000Z',
        previousStatus: 'Draft',
        newStatus: 'In review'
      }
    ]
  }
];

/**
 * Detects whether a string is a system summary sentence rather than actual marketing copy.
 */
export function isSummaryText(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('Flagged ') ||
    trimmed.startsWith('Checked ') ||
    trimmed.startsWith('0 rule violations') ||
    trimmed.startsWith('Empty or invalid draft') ||
    /^(?:Flagged|Checked)\s+\d+/i.test(trimmed)
  );
}

/**
 * Deduplicates review audit history entries caused by repeated handler calls or double saves,
 * while preserving distinct legitimate historical decisions, timestamps, and comments.
 */
export function deduplicateDecisionHistory(history: ReviewDecisionRecord[]): ReviewDecisionRecord[] {
  if (!Array.isArray(history) || history.length === 0) return [];
  const result: ReviewDecisionRecord[] = [];
  const seenIds = new Set<string>();

  for (const entry of history) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.id && seenIds.has(entry.id)) {
      continue;
    }

    // Check if an entry with identical action, status transition, and comment
    // was already added within a 10-second window (duplicate event logging)
    const isDuplicate = result.some((existing) => {
      if (existing.id && entry.id && existing.id === entry.id) return true;
      const sameAction = existing.action === entry.action;
      const sameTransition =
        existing.previousStatus === entry.previousStatus &&
        existing.newStatus === entry.newStatus;
      const sameComment =
        (existing.reviewerComment || '').trim() === (entry.reviewerComment || '').trim();

      if (sameAction && sameTransition && sameComment) {
        if (existing.timestamp && entry.timestamp) {
          const diff = Math.abs(
            new Date(existing.timestamp).getTime() - new Date(entry.timestamp).getTime()
          );
          if (diff < 10000) return true;
        } else {
          return true;
        }
      }
      return false;
    });

    if (!isDuplicate) {
      if (entry.id) seenIds.add(entry.id);
      result.push(entry);
    }
  }

  return result;
}

export const brandStorage = {
  /**
   * Retrieve stored brand profile or null if none created yet
   */
  getStoredProfile(): BrandProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (data === null) {
        try {
          localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(DEFAULT_INITIAL_PROFILE));
        } catch {
          // ignore
        }
        return DEFAULT_INITIAL_PROFILE;
      }
      if (!data || data === 'null') return null;
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
        return parsed as BrandProfile;
      }
      return null;
    } catch (e) {
      console.warn('Unable to read brand profile from localStorage:', e);
      return null;
    }
  },

  /**
   * Save or update brand profile to localStorage with verified result
   */
  saveProfile(
    input: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): StorageResult<BrandProfile> {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: 'Brand name is required.' };
    }

    const existing = this.getStoredProfile();
    const now = new Date().toISOString();
    const profile: BrandProfile = {
      id: input.id || existing?.id || `brand_${Date.now()}`,
      name: input.name.trim(),
      description: input.description?.trim() || '',
      industry: input.industry?.trim() || '',
      targetAudience: input.targetAudience?.trim() || '',
      communicationTone: input.communicationTone || 'Professional',
      toneCustomDetails: input.toneCustomDetails?.trim() || '',
      preferredLanguage: input.preferredLanguage?.trim() || 'English (US)',
      additionalNotes: input.additionalNotes?.trim() || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    try {
      const serialized = JSON.stringify(profile);
      localStorage.setItem(STORAGE_KEY_PROFILE, serialized);
      
      // Verify storage was committed
      const verified = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (!verified) {
        return { success: false, error: 'Local storage write verification failed.' };
      }

      return { success: true, data: profile };
    } catch (e) {
      console.error('Failed to save brand profile to localStorage:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to write brand profile to local storage.'
      };
    }
  },

  /**
   * Delete brand profile from localStorage
   */
  deleteProfile(): StorageResult<void> {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, 'null');
      return { success: true };
    } catch (e) {
      console.error('Failed to remove brand profile from localStorage:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to delete brand profile from local storage.'
      };
    }
  },

  /**
   * Retrieve stored rules array or return default initial rule if none created
   */
  getStoredRules(): BrandRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RULES);
      if (data === null) {
        const initial = [DEFAULT_UNSUPPORTED_CLAIMS_RULE];
        try {
          localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(initial));
        } catch {
          // ignore
        }
        return initial;
      }
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed as BrandRule[];
      }
      return [];
    } catch (e) {
      console.warn('Unable to read brand rules from localStorage:', e);
      return [];
    }
  },

  /**
   * Save or update a single rule in localStorage with verified result
   */
  saveRule(
    input: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): StorageResult<BrandRule> {
    if (!input.title || !input.title.trim()) {
      return { success: false, error: 'Rule title is required.' };
    }
    if (!input.description || !input.description.trim()) {
      return { success: false, error: 'Rule description / requirement is required.' };
    }
    if (input.sourceUrl && !isValidHttpUrl(input.sourceUrl)) {
      return { success: false, error: 'Source URL must be a valid http:// or https:// address.' };
    }

    const rules = this.getStoredRules();
    const now = new Date().toISOString();
    let updatedRule: BrandRule;

    if (input.id) {
      const index = rules.findIndex((r) => r.id === input.id);
      if (index >= 0) {
        const existing = rules[index];
        updatedRule = {
          ...existing,
          ...input,
          title: input.title.trim(),
          description: input.description.trim(),
          example: input.example?.trim() || undefined,
          sourceDescription: input.sourceDescription?.trim() || undefined,
          sourceUrl: input.sourceUrl?.trim() || undefined,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: now
        };
        rules[index] = updatedRule;
      } else {
        updatedRule = {
          ...input,
          title: input.title.trim(),
          description: input.description.trim(),
          example: input.example?.trim() || undefined,
          sourceDescription: input.sourceDescription?.trim() || undefined,
          sourceUrl: input.sourceUrl?.trim() || undefined,
          id: input.id,
          createdAt: now,
          updatedAt: now
        };
        rules.unshift(updatedRule);
      }
    } else {
      updatedRule = {
        ...input,
        title: input.title.trim(),
        description: input.description.trim(),
        example: input.example?.trim() || undefined,
        sourceDescription: input.sourceDescription?.trim() || undefined,
        sourceUrl: input.sourceUrl?.trim() || undefined,
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now
      };
      rules.unshift(updatedRule);
    }

    try {
      const serialized = JSON.stringify(rules);
      localStorage.setItem(STORAGE_KEY_RULES, serialized);

      // Verify storage was committed
      const verified = localStorage.getItem(STORAGE_KEY_RULES);
      if (!verified) {
        return { success: false, error: 'Local storage write verification failed for rules.' };
      }

      return { success: true, data: updatedRule };
    } catch (e) {
      console.error('Failed to save rule to localStorage:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to write rule to local storage.'
      };
    }
  },

  /**
   * Delete a rule by id from localStorage
   */
  deleteRule(id: string): StorageResult<boolean> {
    const rules = this.getStoredRules();
    const filtered = rules.filter((r) => r.id !== id);

    if (filtered.length === rules.length) {
      return { success: false, error: 'Rule not found to delete.' };
    }

    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(filtered));
      return { success: true, data: true };
    } catch (e) {
      console.error('Failed to delete rule from localStorage:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to delete rule from local storage.'
      };
    }
  },

  /**
   * Toggle enabled status of a rule in localStorage
   */
  toggleRuleEnabled(id: string): StorageResult<BrandRule> {
    const rules = this.getStoredRules();
    const rule = rules.find((r) => r.id === id);

    if (!rule) {
      return { success: false, error: 'Rule not found.' };
    }

    rule.enabled = !rule.enabled;
    rule.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
      return { success: true, data: rule };
    } catch (e) {
      console.error('Failed to toggle rule in localStorage:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to update rule status in local storage.'
      };
    }
  },

  /**
   * Retrieve stored reviews array or return seeded reviews if first run.
   * Normalizes any reviews to guarantee findings, issuesCount, and score consistency.
   * Never uses summary text as draft content.
   */
  getStoredReviews(): ReviewItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (data === null) {
        try {
          localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(DEFAULT_INITIAL_REVIEWS));
        } catch {
          // ignore
        }
        return DEFAULT_INITIAL_REVIEWS;
      }
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const storedRules = this.getStoredRules().filter((r) => r.enabled ?? true);
        return parsed.map((item: any) => {
          // 1. Resolve authentic original draft without ever using summary text
          let originalDraft = '';
          if (item.originalDraft && !isSummaryText(item.originalDraft)) {
            originalDraft = item.originalDraft;
          } else if (item.currentDraft && !isSummaryText(item.currentDraft)) {
            originalDraft = item.currentDraft;
          } else if (Array.isArray(item.revisions) && item.revisions.length > 0) {
            const firstValidRev = item.revisions.find((r: any) => r && r.text && !isSummaryText(r.text));
            if (firstValidRev) {
              originalDraft = firstValidRev.text;
            }
          }

          // If still empty or corrupted with summary, restore marketing content for known initial reviews or Test Review 1
          if (!originalDraft) {
            const matchedInitial = DEFAULT_INITIAL_REVIEWS.find(
              (init) => init.id === item.id || init.title === item.title
            );
            if (matchedInitial && matchedInitial.originalDraft) {
              originalDraft = matchedInitial.originalDraft;
            } else if (item.title === 'Test Review 1' || item.id === 'rev_test_review_1') {
              originalDraft = DEFAULT_INITIAL_REVIEWS[0].originalDraft || '';
            }
          }

          // 2. Resolve current draft without ever using summary text
          let currentDraft = '';
          if (item.currentDraft && !isSummaryText(item.currentDraft)) {
            currentDraft = item.currentDraft;
          } else if (originalDraft) {
            currentDraft = originalDraft;
          }

          // 3. Resolve findings matching the actual draft
          let findings: any[];
          if (Array.isArray(item.findings) && item.findings.length > 0) {
            findings = item.findings;
          } else if (currentDraft.trim()) {
            const evalRes = evaluateDraft(currentDraft, storedRules, {
              campaignTitle: item.title
            });
            findings = evalRes.findings;
          } else {
            findings = Array.isArray(item.findings) ? item.findings : [];
          }

          const issuesCount = findings.length;
          const confidenceScore = currentDraft.trim() || findings.length > 0
            ? calculateComplianceScore(findings)
            : (typeof item.confidenceScore === 'number' ? item.confidenceScore : 100);

          const rulesCheckedCount =
            typeof item.rulesCheckedCount === 'number'
              ? item.rulesCheckedCount
              : storedRules.length;

          // Deduplicate decision history to remove duplicate actions caused by repeated handler calls
          const decisionHistory = deduplicateDecisionHistory(
            Array.isArray(item.decisionHistory) ? item.decisionHistory : []
          );

          const revisions = Array.isArray(item.revisions) ? item.revisions : [];

          // Resolve first-pass metrics strictly from authentic first-pass data.
          // Never infer first-pass metrics from current draft or current findings!
          let firstPassIssuesCount: number | undefined;
          let firstPassScore: number | undefined;
          let firstPassFindings: any[] | undefined;

          if (typeof item.firstPassIssuesCount === 'number') {
            firstPassIssuesCount = item.firstPassIssuesCount;
            firstPassScore = typeof item.firstPassScore === 'number' ? item.firstPassScore : undefined;
            firstPassFindings = Array.isArray(item.firstPassFindings) ? item.firstPassFindings : undefined;
          } else if (originalDraft && !isSummaryText(originalDraft)) {
            // Authentic original submitted marketing draft is available: evaluate to establish first-pass results
            const origEval = evaluateDraft(originalDraft, storedRules, { campaignTitle: item.title });
            firstPassFindings = origEval.findings;
            firstPassIssuesCount = origEval.findings.length;
            firstPassScore = origEval.score;
          } else if (Array.isArray(item.firstPassFindings)) {
            firstPassFindings = item.firstPassFindings;
            firstPassIssuesCount = item.firstPassFindings.length;
            firstPassScore = calculateComplianceScore(item.firstPassFindings);
          }

          return {
            ...item,
            originalDraft,
            currentDraft,
            findings,
            issuesCount,
            confidenceScore,
            firstPassFindings,
            firstPassIssuesCount,
            firstPassScore,
            rulesCheckedCount,
            decisionHistory,
            revisions
          } as ReviewItem;
        });
      }
      return [];
    } catch (e) {
      console.warn('Unable to read reviews from localStorage:', e);
      return [];
    }
  },

  /**
   * Save or update a review item in localStorage without creating duplicates.
   * Stores original draft, latest revision, actual findings, issue counts, and decisions separately and consistently.
   */
  saveReview(
    input: Omit<ReviewItem, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }
  ): StorageResult<ReviewItem> {
    const reviews = this.getStoredReviews();
    const id = input.id || `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existingIdx = input.id ? reviews.findIndex((r) => r.id === input.id) : -1;
    const existing = existingIdx >= 0 ? reviews[existingIdx] : undefined;

    // Validate review state transition and publishing restrictions
    if (input.status) {
      const transitionCheck = isValidReviewStateTransition(existing?.status, input.status);
      if (!transitionCheck.valid) {
        return {
          success: false,
          error: transitionCheck.reason || 'Invalid review state transition.'
        };
      }

      // Prevent repeated publishing of already published content
      if (existing?.status === 'Published' && input.status === 'Published') {
        const existingPublishCount = (existing.decisionHistory || []).filter((d) => d.action === 'Publish').length;
        const inputPublishCount = (input.decisionHistory || []).filter((d) => d.action === 'Publish').length;
        if (inputPublishCount > existingPublishCount) {
          return {
            success: false,
            error: 'Content has already been published. Repeated publishing is prevented to protect downstream systems from duplicate dispatches.'
          };
        }
      }
    }

    // Preserve original draft immutably - NEVER use summary text
    let originalDraft = '';
    if (existing?.originalDraft && !isSummaryText(existing.originalDraft)) {
      originalDraft = existing.originalDraft;
    } else if (input.originalDraft && !isSummaryText(input.originalDraft)) {
      originalDraft = input.originalDraft;
    } else if (input.currentDraft && !isSummaryText(input.currentDraft)) {
      originalDraft = input.currentDraft;
    } else if (existing?.currentDraft && !isSummaryText(existing.currentDraft)) {
      originalDraft = existing.currentDraft;
    }

    // Determine latest revision currentDraft - NEVER use summary text
    let currentDraft = '';
    if (input.currentDraft !== undefined && !isSummaryText(input.currentDraft)) {
      currentDraft = input.currentDraft;
    } else if (existing?.currentDraft && !isSummaryText(existing.currentDraft)) {
      currentDraft = existing.currentDraft;
    } else if (originalDraft) {
      currentDraft = originalDraft;
    }

    // Resolve findings:
    // 1. If explicitly provided as an array in input, use input.findings
    // 2. Otherwise preserve existing findings
    // 3. If neither exists, evaluate current draft against stored enabled rules
    let resolvedFindings: any[];
    if (Array.isArray(input.findings)) {
      resolvedFindings = input.findings;
    } else if (existing && Array.isArray(existing.findings)) {
      resolvedFindings = existing.findings;
    } else {
      const storedRules = this.getStoredRules().filter((r) => r.enabled ?? true);
      const evalRes = evaluateDraft(currentDraft, storedRules, {
        campaignTitle: input.title || existing?.title
      });
      resolvedFindings = evalRes.findings;
    }

    // Always calculate issue count strictly from stored findings
    const issuesCount = resolvedFindings.length;

    // Always calculate score strictly from documented formula applied to actual findings
    const confidenceScore = calculateComplianceScore(resolvedFindings);

    const rulesCheckedCount =
      typeof input.rulesCheckedCount === 'number'
        ? input.rulesCheckedCount
        : (existing?.rulesCheckedCount ?? this.getStoredRules().filter((r) => r.enabled ?? true).length);

    const rawDecisionHistory = Array.isArray(input.decisionHistory)
      ? input.decisionHistory
      : (existing?.decisionHistory || []);
    const decisionHistory = deduplicateDecisionHistory(rawDecisionHistory);

    const revisions = Array.isArray(input.revisions)
      ? input.revisions
      : (existing?.revisions || []);

    // Capture firstPass metrics exactly once from the original submitted draft.
    // Never overwrite when edited, rechecked, approved, rejected, or sent back for changes.
    // Never infer first-pass result from the current revised draft or current findings!
    let firstPassIssuesCount: number | undefined;
    let firstPassScore: number | undefined;
    let firstPassFindings: any[] | undefined;

    if (typeof existing?.firstPassIssuesCount === 'number') {
      // 1. Existing record already has established first-pass metrics: NEVER OVERWRITE
      firstPassIssuesCount = existing.firstPassIssuesCount;
      firstPassScore = existing.firstPassScore;
      firstPassFindings = existing.firstPassFindings;
    } else if (typeof input.firstPassIssuesCount === 'number') {
      // 2. Input explicitly provided verified first-pass metrics (e.g. from ReviewTab initial check)
      firstPassIssuesCount = input.firstPassIssuesCount;
      firstPassScore = input.firstPassScore;
      firstPassFindings = Array.isArray(input.firstPassFindings) ? input.firstPassFindings : undefined;
    } else if (originalDraft && !isSummaryText(originalDraft)) {
      // 3. Evaluate original submitted marketing draft to establish authentic first-pass check
      const storedRules = this.getStoredRules().filter((r) => r.enabled ?? true);
      const origEval = evaluateDraft(originalDraft, storedRules, { campaignTitle: input.title || existing?.title });
      firstPassFindings = origEval.findings;
      firstPassIssuesCount = origEval.findings.length;
      firstPassScore = origEval.score;
    } else if (Array.isArray(existing?.firstPassFindings)) {
      firstPassFindings = existing.firstPassFindings;
      firstPassIssuesCount = existing.firstPassFindings.length;
      firstPassScore = calculateComplianceScore(existing.firstPassFindings);
    } else if (Array.isArray(input.firstPassFindings)) {
      firstPassFindings = input.firstPassFindings;
      firstPassIssuesCount = input.firstPassFindings.length;
      firstPassScore = calculateComplianceScore(input.firstPassFindings);
    }

    const savedReview: ReviewItem = {
      ...(existing || {}),
      ...input,
      id: existing?.id || id,
      originalDraft,
      currentDraft,
      findings: resolvedFindings,
      issuesCount,
      confidenceScore,
      firstPassFindings,
      firstPassIssuesCount,
      firstPassScore,
      rulesCheckedCount,
      decisionHistory,
      revisions,
      updatedAt: input.updatedAt || 'Just now'
    };

    if (existingIdx >= 0) {
      reviews[existingIdx] = savedReview;
    } else {
      reviews.unshift(savedReview);
    }

    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
      return { success: true, data: savedReview };
    } catch (e) {
      console.error('Failed to save review:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to save review to local storage.'
      };
    }
  },

  /**
   * Delete a review by id from localStorage
   */
  deleteReview(id: string): StorageResult<boolean> {
    const reviews = this.getStoredReviews();
    const filtered = reviews.filter((r) => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(filtered));
      return { success: true, data: true };
    } catch {
      return { success: false, error: 'Failed to delete review' };
    }
  },

  /**
   * Get onboarding state from localStorage
   */
  getOnboardingState(): { hasReviewed: boolean; hasUnderstood: boolean; dismissed: boolean } {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ONBOARDING);
      if (!data) return { hasReviewed: false, hasUnderstood: false, dismissed: false };
      return JSON.parse(data);
    } catch {
      return { hasReviewed: false, hasUnderstood: false, dismissed: false };
    }
  },

  /**
   * Save onboarding progress to localStorage
   */
  saveOnboardingState(state: Partial<{ hasReviewed: boolean; hasUnderstood: boolean; dismissed: boolean }>): void {
    try {
      const current = this.getOnboardingState();
      const updated = { ...current, ...state };
      localStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /**
   * Completely clear all brand profile, rules, and reviews
   */
  clearAllData(): StorageResult<void> {
    try {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      localStorage.removeItem(STORAGE_KEY_RULES);
      localStorage.removeItem(STORAGE_KEY_REVIEWS);
      localStorage.removeItem(STORAGE_KEY_ONBOARDING);
      return { success: true };
    } catch (e) {
      console.error('Failed to clear brand data:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to clear local storage.'
      };
    }
  }
};
