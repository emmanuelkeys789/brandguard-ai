import type { BrandRule, BrandProfile, RuleCategory, SeverityLevel } from '../types';

export interface ReviewFinding {
  id: string;
  ruleId: string;
  ruleTitle: string;
  ruleCategory: RuleCategory;
  severity: SeverityLevel;
  matchedText?: string;
  location?: {
    startIndex: number;
    endIndex: number;
    line: number;
  };
  explanation: string;
  suggestedCorrection?: string;
  sourceDescription?: string;
  sourceUrl?: string;
  needsHumanVerification?: boolean;
}

export interface RuleEvaluationSummary {
  id: string;
  title: string;
  category: RuleCategory;
  severity: SeverityLevel;
  status: 'passed' | 'flagged' | 'skipped';
  findingCount: number;
}

export interface ReviewEngineResult {
  findings: ReviewFinding[];
  checkedRulesCount: number;
  rulesEvaluated: RuleEvaluationSummary[];
  isCompliant: boolean;
  score: number;
  timestamp: string;
  summaryText: string;
}

export interface ReviewEngineOptions {
  brandProfile?: BrandProfile | null;
  campaignTitle?: string;
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Robust match finder handling punctuation and word boundaries with Unicode support.
 */
export function findMatchesInText(
  text: string,
  phrase: string,
  caseSensitive = false
): { startIndex: number; endIndex: number; matchedText: string }[] {
  if (!phrase || !phrase.trim() || !text) return [];

  const trimmed = phrase.trim();
  // Check if first / last chars are letters or digits
  const startsWithWord = /^[\p{L}\p{N}]/u.test(trimmed);
  const endsWithWord = /[\p{L}\p{N}]$/u.test(trimmed);

  const prefix = startsWithWord ? '(?<=^|[^\\p{L}\\p{N}])' : '';
  const suffix = endsWithWord ? '(?=$|[^\\p{L}\\p{N}])' : '';
  const pattern = `${prefix}${escapeRegex(trimmed)}${suffix}`;

  try {
    const flags = `gu${caseSensitive ? '' : 'i'}`;
    const regex = new RegExp(pattern, flags);
    const results: { startIndex: number; endIndex: number; matchedText: string }[] = [];

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        matchedText: match[0]
      });

      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
    return results;
  } catch (err) {
    console.warn(`Error running regex for phrase "${trimmed}":`, err);
    return [];
  }
}

/**
 * Calculate 1-indexed line number for a character offset in text.
 */
export function getLineNumber(text: string, index: number): number {
  if (index <= 0) return 1;
  const sliced = text.slice(0, index);
  return (sliced.match(/\n/g) || []).length + 1;
}

/**
 * Extracts explicit target phrases, terms, or claims configured inside a rule.
 */
export function extractConfiguredTargets(rule: BrandRule): {
  prohibitedTerms: string[];
  requiredTerms: string[];
  approvedFacts: string[];
  claims: string[];
} {
  const prohibitedTerms = new Set<string>();
  const requiredTerms = new Set<string>();
  const approvedFacts = new Set<string>();
  const claims = new Set<string>();

  const textsToScan = [
    rule.title,
    rule.description,
    rule.example || '',
    rule.exampleViolation || ''
  ];

  // 1. Extract explicit quoted strings: "...", '...', “...”, ‘...’, `...`
  const quoteRegex = /["'“‘`"]([^"'”’`"]{2,120})["'”’`"]/g;
  for (const text of textsToScan) {
    if (!text) continue;
    let qm: RegExpExecArray | null;
    while ((qm = quoteRegex.exec(text)) !== null) {
      const candidate = qm[1].trim();
      if (candidate.length > 1) {
        if (
          rule.category === 'Required Terms' ||
          rule.category === 'Required Terminology'
        ) {
          requiredTerms.add(candidate);
        } else if (
          rule.category === 'Approved Facts'
        ) {
          approvedFacts.add(candidate);
        } else if (
          rule.category === 'Claims & Restrictions' ||
          rule.category === 'Claims and Restrictions' ||
          rule.category === 'Claims & Evidence'
        ) {
          claims.add(candidate);
        } else {
          prohibitedTerms.add(candidate);
        }
      }
    }
  }

  // 2. Extract parenthesized lists: e.g. (e.g., term1, term2, term3) or (e.g. "term1", "term2")
  const egRegex = /\((?:e\.g\.|such as|including)\s*[:]?\s*([^)]+)\)/i;
  for (const text of [rule.description, rule.example || '']) {
    const egMatch = egRegex.exec(text);
    if (egMatch && egMatch[1]) {
      const items = egMatch[1]
        .split(/[,;]/)
        .map((s) => s.replace(/["'“‘”’`]/g, '').trim())
        .filter((s) => s.length > 1 && !s.toLowerCase().startsWith('and '));

      for (const item of items) {
        const cleaned = item.replace(/^and\s+/i, '').trim();
        if (cleaned.length > 1) {
          if (
            rule.category === 'Claims & Restrictions' ||
            rule.category === 'Claims and Restrictions' ||
            rule.category === 'Claims & Evidence'
          ) {
            claims.add(cleaned);
          } else {
            prohibitedTerms.add(cleaned);
          }
        }
      }
    }
  }

  // 3. Category-specific fallbacks if no quoted targets were found
  const normCat = rule.category.toLowerCase();

  // If Required Terms has no targets, check title or description
  if (
    (normCat.includes('required') || normCat.includes('trademark')) &&
    requiredTerms.size === 0
  ) {
    // Check if title has e.g. "Required Term: BrandGuard™"
    const colonIdx = rule.title.indexOf(':');
    if (colonIdx >= 0) {
      const part = rule.title.slice(colonIdx + 1).replace(/["'“‘”’`]/g, '').trim();
      if (part.length > 1) requiredTerms.add(part);
    } else if (rule.description.length <= 40) {
      requiredTerms.add(rule.description.trim());
    }
  }

  // If Prohibited Terms has no targets, check colon in title or comma-separated description
  if (
    (normCat.includes('prohibited') || normCat.includes('terminology')) &&
    prohibitedTerms.size === 0
  ) {
    const colonIdx = rule.title.indexOf(':');
    if (colonIdx >= 0) {
      const part = rule.title.slice(colonIdx + 1).replace(/["'“‘”’`]/g, '').trim();
      if (part.length > 1) prohibitedTerms.add(part);
    } else {
      const desc = rule.description || (rule as { guidelines?: string }).guidelines || '';
      if (desc.includes(',')) {
        // Possible comma-separated list
        const parts = desc.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 1 && p.length < 50);
        if (parts.length > 1) {
          for (const p of parts) prohibitedTerms.add(p);
        }
      }
    }
  }

  // If Claims / Unsupported Marketing Claims has no explicit targets yet, check description text
  if (
    (normCat.includes('claim') || rule.title.toLowerCase().includes('marketing claim') || rule.title.toLowerCase().includes('superlative')) &&
    claims.size === 0
  ) {
    // Check for common superlative markers mentioned in description
    const knownSuperlatives = [
      'most trusted',
      'fastest',
      '#1',
      'undisputed #1',
      'first in market',
      '100% immunity',
      '100% guaranteed',
      'outperforming all'
    ];
    const descText = (rule.description || (rule as { guidelines?: string }).guidelines || '').toLowerCase();
    for (const sup of knownSuperlatives) {
      if (descText.includes(sup.toLowerCase())) {
        claims.add(sup);
      }
    }
  }

  return {
    prohibitedTerms: Array.from(prohibitedTerms),
    requiredTerms: Array.from(requiredTerms),
    approvedFacts: Array.from(approvedFacts),
    claims: Array.from(claims)
  };
}

/**
 * Deterministically evaluates a draft against a list of saved Brand Rules.
 */
export function evaluateDraft(
  draftContent: string,
  rules: BrandRule[],
  options?: ReviewEngineOptions
): ReviewEngineResult {
  const timestamp = new Date().toISOString();

  // Safe handling of empty or invalid drafts
  if (!draftContent || typeof draftContent !== 'string' || !draftContent.trim()) {
    return {
      findings: [],
      checkedRulesCount: 0,
      rulesEvaluated: [],
      isCompliant: true,
      score: 100,
      timestamp,
      summaryText: 'Empty or invalid draft provided. No content was checked.'
    };
  }

  const rawText = draftContent;
  const findings: ReviewFinding[] = [];
  const rulesEvaluated: RuleEvaluationSummary[] = [];

  // Track findings deduplication key: `${ruleId}:${startIndex}:${endIndex}`
  const seenMatches = new Set<string>();

  let checkedCount = 0;

  for (const rule of rules) {
    // Rule that is disabled is strictly not checked
    const isEnabled = rule.enabled !== undefined ? rule.enabled : rule.isActive ?? true;
    if (!isEnabled) {
      rulesEvaluated.push({
        id: rule.id,
        title: rule.title,
        category: rule.category,
        severity: rule.severity || 'Medium',
        status: 'skipped',
        findingCount: 0
      });
      continue;
    }

    checkedCount++;
    const ruleFindingsBefore = findings.length;
    const targets = extractConfiguredTargets(rule);

    const normCat = rule.category.toLowerCase();
    const isProhibitedCategory =
      normCat.includes('prohibited') ||
      normCat.includes('terminology') ||
      normCat.includes('jargon');

    const isRequiredCategory =
      normCat.includes('required');

    const isClaimsCategory =
      normCat.includes('claim') ||
      rule.title.toLowerCase().includes('superlative') ||
      rule.title.toLowerCase().includes('marketing claim');

    const isApprovedFactsCategory =
      normCat.includes('fact');

    const isToneCategory =
      normCat.includes('tone') || normCat.includes('voice');

    const isTrademarkCategory =
      normCat.includes('trademark') || normCat.includes('legal');

    // --- CHECK 1: Prohibited Terminology ---
    if (isProhibitedCategory || isToneCategory || targets.prohibitedTerms.length > 0) {
      for (const term of targets.prohibitedTerms) {
        const matches = findMatchesInText(rawText, term, false);
        for (const m of matches) {
          const dedupeKey = `${rule.id}:${m.startIndex}:${m.endIndex}`;
          if (seenMatches.has(dedupeKey)) continue;
          seenMatches.add(dedupeKey);

          findings.push({
            id: `finding_${rule.id}_${m.startIndex}`,
            ruleId: rule.id,
            ruleTitle: rule.title,
            ruleCategory: rule.category,
            severity: rule.severity || 'Medium',
            matchedText: m.matchedText,
            location: {
              startIndex: m.startIndex,
              endIndex: m.endIndex,
              line: getLineNumber(rawText, m.startIndex)
            },
            explanation: `Flagged by rule "${rule.title}": Prohibited word or phrase "${m.matchedText}" detected. ${rule.description}`,
            suggestedCorrection: rule.remedyRecommendation || `Remove or rephrase "${m.matchedText}".`,
            sourceDescription: rule.sourceDescription || rule.sourceDocument,
            sourceUrl: rule.sourceUrl
          });
        }
      }
    }

    // --- CHECK 2: Required Terminology ---
    if (isRequiredCategory || targets.requiredTerms.length > 0) {
      for (const reqTerm of targets.requiredTerms) {
        // Check exact match or case-insensitive presence
        const caseInsensitiveMatches = findMatchesInText(rawText, reqTerm, false);

        if (caseInsensitiveMatches.length === 0) {
          // Term is completely missing from draft
          const dedupeKey = `${rule.id}:missing:${reqTerm}`;
          if (!seenMatches.has(dedupeKey)) {
            seenMatches.add(dedupeKey);
            findings.push({
              id: `finding_${rule.id}_missing`,
              ruleId: rule.id,
              ruleTitle: rule.title,
              ruleCategory: rule.category,
              severity: rule.severity || 'Medium',
              matchedText: undefined,
              location: undefined,
              explanation: `Missing required terminology: Draft must include "${reqTerm}". ${rule.description}`,
              suggestedCorrection: `Include "${reqTerm}" where appropriate in the draft copy.`,
              sourceDescription: rule.sourceDescription || rule.sourceDocument,
              sourceUrl: rule.sourceUrl
            });
          }
        } else {
          // Term is present, but verify exact casing/trademark symbol if required
          const exactMatches = findMatchesInText(rawText, reqTerm, true);
          if (exactMatches.length === 0 && caseInsensitiveMatches.length > 0) {
            // Found with wrong casing
            for (const m of caseInsensitiveMatches) {
              const dedupeKey = `${rule.id}:${m.startIndex}:${m.endIndex}`;
              if (seenMatches.has(dedupeKey)) continue;
              seenMatches.add(dedupeKey);

              findings.push({
                id: `finding_${rule.id}_${m.startIndex}`,
                ruleId: rule.id,
                ruleTitle: rule.title,
                ruleCategory: rule.category,
                severity: rule.severity || 'Warning',
                matchedText: m.matchedText,
                location: {
                  startIndex: m.startIndex,
                  endIndex: m.endIndex,
                  line: getLineNumber(rawText, m.startIndex)
                },
                explanation: `Terminology casing / formatting mismatch: found "${m.matchedText}", but rule "${rule.title}" requires exact form "${reqTerm}".`,
                suggestedCorrection: reqTerm,
                sourceDescription: rule.sourceDescription || rule.sourceDocument,
                sourceUrl: rule.sourceUrl
              });
            }
          }
        }
      }
    }

    // --- CHECK 3: Claims and Restrictions ---
    if (isClaimsCategory || targets.claims.length > 0) {
      for (const claim of targets.claims) {
        const matches = findMatchesInText(rawText, claim, false);
        for (const m of matches) {
          const dedupeKey = `${rule.id}:${m.startIndex}:${m.endIndex}`;
          if (seenMatches.has(dedupeKey)) continue;
          seenMatches.add(dedupeKey);

          findings.push({
            id: `finding_${rule.id}_${m.startIndex}`,
            ruleId: rule.id,
            ruleTitle: rule.title,
            ruleCategory: rule.category,
            severity: rule.severity || 'Critical',
            matchedText: m.matchedText,
            location: {
              startIndex: m.startIndex,
              endIndex: m.endIndex,
              line: getLineNumber(rawText, m.startIndex)
            },
            explanation: `Unsupported marketing claim or superlative detected: "${m.matchedText}". Rule "${rule.title}" requires verifiable benchmark citations.`,
            suggestedCorrection:
              rule.remedyRecommendation ||
              `Replace "${m.matchedText}" with verifiable performance data.`,
            sourceDescription: rule.sourceDescription || rule.sourceDocument,
            sourceUrl: rule.sourceUrl
          });
        }
      }
    }

    // --- CHECK 4: Approved Facts ---
    if (isApprovedFactsCategory && targets.approvedFacts.length > 0) {
      for (const fact of targets.approvedFacts) {
        // If the rule defined an explicit violation example (e.g. "Founded in 2020" when fact is 2024)
        if (rule.exampleViolation) {
          const violMatches = findMatchesInText(rawText, rule.exampleViolation.replace(/["'“”]/g, ''), false);
          for (const m of violMatches) {
            const dedupeKey = `${rule.id}:${m.startIndex}:${m.endIndex}`;
            if (seenMatches.has(dedupeKey)) continue;
            seenMatches.add(dedupeKey);

            findings.push({
              id: `finding_${rule.id}_${m.startIndex}`,
              ruleId: rule.id,
              ruleTitle: rule.title,
              ruleCategory: rule.category,
              severity: rule.severity || 'High',
              matchedText: m.matchedText,
              location: {
                startIndex: m.startIndex,
                endIndex: m.endIndex,
                line: getLineNumber(rawText, m.startIndex)
              },
              explanation: `Statement contradicts approved fact "${rule.title}": found "${m.matchedText}". Approved factual baseline: ${rule.description}`,
              suggestedCorrection: fact,
              sourceDescription: rule.sourceDescription || rule.sourceDocument,
              sourceUrl: rule.sourceUrl
            });
          }
        }
      }
    }

    // --- CHECK 5: Trademark Casing Specific Checks ---
    if (isTrademarkCategory && targets.requiredTerms.length === 0 && rule.exampleViolation) {
      const violMatches = findMatchesInText(rawText, rule.exampleViolation.replace(/["'“”]/g, ''), false);
      for (const m of violMatches) {
        const dedupeKey = `${rule.id}:${m.startIndex}:${m.endIndex}`;
        if (seenMatches.has(dedupeKey)) continue;
        seenMatches.add(dedupeKey);

        findings.push({
          id: `finding_${rule.id}_${m.startIndex}`,
          ruleId: rule.id,
          ruleTitle: rule.title,
          ruleCategory: rule.category,
          severity: rule.severity || 'Medium',
          matchedText: m.matchedText,
          location: {
            startIndex: m.startIndex,
            endIndex: m.endIndex,
            line: getLineNumber(rawText, m.startIndex)
          },
          explanation: `Trademark / Nomenclature discrepancy: "${m.matchedText}" violates rule "${rule.title}". ${rule.description}`,
          suggestedCorrection: rule.remedyRecommendation || rule.example,
          sourceDescription: rule.sourceDescription || rule.sourceDocument,
          sourceUrl: rule.sourceUrl
        });
      }
    }

    const ruleFindingsCount = findings.length - ruleFindingsBefore;
    rulesEvaluated.push({
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity || 'Medium',
      status: ruleFindingsCount > 0 ? 'flagged' : 'passed',
      findingCount: ruleFindingsCount
    });
  }

  // Calculate score deterministically based on findings severity
  const score = calculateComplianceScore(findings);
  const isCompliant = findings.length === 0;

  const brandName = options?.brandProfile?.name || 'Active Brand';
  const summaryText = isCompliant
    ? `Checked ${checkedCount} active brand rules for ${brandName}. All deterministic checks passed with 0 findings.`
    : `Checked ${checkedCount} active brand rules for ${brandName}. Detected ${findings.length} issue${findings.length === 1 ? '' : 's'} requiring editorial review.`;

  return {
    findings,
    checkedRulesCount: checkedCount,
    rulesEvaluated,
    isCompliant,
    score,
    timestamp,
    summaryText
  };
}

/**
 * Calculates a deterministic rule compliance score (0-100%).
 * 
 * METHODOLOGY & LIMITATIONS:
 * - Starts at 100 base score.
 * - Deducts points for each deterministic rule finding based on configured severity:
 *     Critical: -20 points
 *     High:     -12 points
 *     Medium/Warning: -8 points
 *     Low/Advisory:   -4 points
 * - Clamped between 0 and 100.
 * 
 * TRANSPARENCY NOTICE:
 * This score represents adherence strictly against active, configured brand rules.
 * It is NOT an AI confidence score, factual truth verification, or legal guarantee.
 */
export function calculateComplianceScore(findings: { severity?: SeverityLevel }[]): number {
  if (!findings || findings.length === 0) return 100;
  let deduction = 0;
  for (const f of findings) {
    switch (f.severity) {
      case 'Critical':
        deduction += 20;
        break;
      case 'High':
        deduction += 12;
        break;
      case 'Medium':
      case 'Warning':
        deduction += 8;
        break;
      case 'Low':
      case 'Advisory':
      default:
        deduction += 4;
        break;
    }
  }
  return Math.max(0, Math.min(100, 100 - deduction));
}

export interface FindingRuleMetadata {
  isRuleAvailable: boolean;
  ruleTitle: string;
  category: RuleCategory | 'Unavailable Rule';
  severity: SeverityLevel;
  sourceDescription?: string;
  sourceUrl?: string;
}

/**
 * Derives finding category, severity, and title dynamically from the exact saved rule ID.
 * If the rule has been removed or is unavailable, clearly indicates unavailable status
 * without inventing or guessing metadata.
 */
export function getFindingRuleMetadata(
  finding: {
    ruleId: string;
    ruleTitle?: string;
    ruleCategory?: RuleCategory;
    severity?: SeverityLevel;
    sourceDescription?: string;
    sourceUrl?: string;
  },
  rules: BrandRule[]
): FindingRuleMetadata {
  const matchedRule = rules.find((r) => r.id === finding.ruleId);
  if (!matchedRule) {
    return {
      isRuleAvailable: false,
      ruleTitle: finding.ruleTitle || 'Unavailable Rule',
      category: 'Unavailable Rule',
      severity: finding.severity || 'Medium',
      sourceDescription: finding.sourceDescription,
      sourceUrl: finding.sourceUrl
    };
  }

  return {
    isRuleAvailable: true,
    ruleTitle: matchedRule.title,
    category: matchedRule.category,
    severity: (matchedRule.severity as SeverityLevel) || 'Medium',
    sourceDescription: matchedRule.sourceDescription || matchedRule.sourceDocument,
    sourceUrl: matchedRule.sourceUrl
  };
}

