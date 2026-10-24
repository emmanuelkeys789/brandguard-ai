import type { BrandProfile, BrandRule, AiToneSuggestion, AiAnalysisStatus } from '../types/index.ts';

export interface AiToneReviewClientResult {
  status: AiAnalysisStatus;
  suggestions: AiToneSuggestion[];
  provider?: string;
  model?: string;
  error?: string;
}

export interface AiToneReviewRequestOptions {
  content: string;
  brandProfile?: BrandProfile | null;
  brandRules?: BrandRule[];
  channel?: string;
}

export interface TextReplacementResult {
  newText: string;
  success: boolean;
  matchType: 'exact' | 'cleaned' | 'case-insensitive' | 'full-draft' | 'sentence-match' | 'none';
  originalReplacedText?: string;
}

/**
 * Validates that an alternative is a substantive rewrite, not just an empty string or identical repetition.
 */
export function isMeaningfulRewrite(
  original: string | undefined,
  alternative: string | undefined
): boolean {
  if (!alternative || alternative.trim().length === 0) return false;
  if (!original || original.trim().length === 0) return alternative.trim().length >= 4;

  const normOrig = original.trim().toLowerCase().replace(/[\s\p{P}]+/gu, ' ').trim();
  const normAlt = alternative.trim().toLowerCase().replace(/[\s\p{P}]+/gu, ' ').trim();

  if (normOrig === normAlt) return false;
  return true;
}

/**
 * Intelligently applies an alternative suggestion to draft content.
 * Handles exact substrings, trimmed punctuation/quotes, case-insensitivity, whole-draft directives,
 * and sentence-level matching so the draft textarea is guaranteed to update immediately.
 */
export function applyTextReplacement(
  currentText: string,
  quotedText: string | undefined,
  replacement: string
): TextReplacementResult {
  if (!replacement || replacement.trim().length === 0) {
    return { newText: currentText, success: false, matchType: 'none' };
  }

  const trimmedText = currentText;
  const rawQuoted = quotedText?.trim() || '';

  // 1. Exact substring match
  if (rawQuoted && trimmedText.includes(rawQuoted)) {
    return {
      newText: trimmedText.replace(rawQuoted, replacement),
      success: true,
      matchType: 'exact',
      originalReplacedText: rawQuoted
    };
  }

  // 2. Cleaned quotes / punctuation match
  const strippedQuoted = rawQuoted.replace(/^["'“‘`\s]+|["'”’`\s]+$/g, '').trim();
  if (strippedQuoted && trimmedText.includes(strippedQuoted)) {
    return {
      newText: trimmedText.replace(strippedQuoted, replacement),
      success: true,
      matchType: 'cleaned',
      originalReplacedText: strippedQuoted
    };
  }

  // 3. Case-insensitive match for the stripped quoted text
  if (strippedQuoted) {
    const lowerText = trimmedText.toLowerCase();
    const lowerQuoted = strippedQuoted.toLowerCase();
    const idx = lowerText.indexOf(lowerQuoted);
    if (idx !== -1) {
      const before = trimmedText.slice(0, idx);
      const after = trimmedText.slice(idx + strippedQuoted.length);
      const matchedSlice = trimmedText.slice(idx, idx + strippedQuoted.length);
      return {
        newText: before + replacement + after,
        success: true,
        matchType: 'case-insensitive',
        originalReplacedText: matchedSlice
      };
    }
  }

  // 4. Whole-draft replacement directives or equivalent length/content:
  const isOverallDirective =
    !rawQuoted ||
    /^(overall|entire draft|full draft|whole draft|all|overall tone|entire text)$/i.test(rawQuoted);
  const isSimilarLength =
    strippedQuoted.length > 0 && Math.abs(trimmedText.length - strippedQuoted.length) <= 10;
  if (
    isOverallDirective ||
    isSimilarLength ||
    (strippedQuoted && strippedQuoted.toLowerCase() === trimmedText.trim().toLowerCase())
  ) {
    return {
      newText: replacement,
      success: true,
      matchType: 'full-draft',
      originalReplacedText: trimmedText
    };
  }

  // 5. Punctuation-relaxed multi-word sentence/clause match
  if (strippedQuoted.length > 8) {
    const words = strippedQuoted.split(/\s+/).filter((w) => w.length > 0);
    if (words.length >= 2) {
      try {
        const patternStr = words
          .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('[\\s\\p{P}\\p{S}]+');
        const regex = new RegExp(patternStr, 'iu');
        const match = trimmedText.match(regex);
        if (match && match.index !== undefined) {
          const before = trimmedText.slice(0, match.index);
          const after = trimmedText.slice(match.index + match[0].length);
          return {
            newText: before + replacement + after,
            success: true,
            matchType: 'sentence-match',
            originalReplacedText: match[0]
          };
        }
      } catch {
        // Fall through
      }
    }
  }

  // 6. Fallback for concise draft or complete replacement
  if (trimmedText.length <= 350 || replacement.length >= trimmedText.length * 0.7) {
    return {
      newText: replacement,
      success: true,
      matchType: 'full-draft',
      originalReplacedText: trimmedText
    };
  }

  return { newText: currentText, success: false, matchType: 'none' };
}

let mockClientHandler: ((options: AiToneReviewRequestOptions) => Promise<AiToneReviewClientResult>) | null = null;

export const aiToneService = {
  /**
   * For automated testing: override the server fetch call
   */
  setHandlerForTesting(
    handler: ((options: AiToneReviewRequestOptions) => Promise<AiToneReviewClientResult>) | null
  ): void {
    mockClientHandler = handler;
  },

  /**
   * Dispatches a tone review request to the secure server endpoint (/api/ai-tone-review).
   * Safe against timeouts, malformed server responses, and provider outages.
   */
  async requestToneReview(
    options: AiToneReviewRequestOptions
  ): Promise<AiToneReviewClientResult> {
    if (!options.content || !options.content.trim()) {
      return {
        status: 'error',
        suggestions: [],
        error: 'Draft content is empty.'
      };
    }

    if (mockClientHandler) {
      return mockClientHandler(options);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s frontend timeout

    try {
      const response = await fetch('/api/ai-tone-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: options.content,
          brandProfile: options.brandProfile,
          brandRules: options.brandRules || [],
          channel: options.channel || 'General Public'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server returned HTTP ${response.status}`;
        try {
          const errData = (await response.json()) as any;
          if (errData?.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        return {
          status: 'error',
          suggestions: [],
          error: errorMsg
        };
      }

      const data = (await response.json()) as any;

      if (data.status === 'unavailable') {
        return {
          status: 'unavailable',
          suggestions: [],
          error: data.error || 'AI tone review provider is unconfigured on the server.'
        };
      }

      if (data.status === 'error') {
        return {
          status: 'error',
          suggestions: [],
          provider: data.provider,
          model: data.model,
          error: data.error || 'Server encountered an error analyzing draft tone.'
        };
      }

      const suggestions: AiToneSuggestion[] = Array.isArray(data.suggestions)
        ? data.suggestions.map((s: any, idx: number) => ({
            id: typeof s.id === 'string' ? s.id : `ai_sugg_${idx}`,
            category: 'AI tone/context' as const,
            toneCategory: s.toneCategory || 'Tone & Voice',
            severity: s.severity || 'Advisory',
            quotedText: typeof s.quotedText === 'string' ? s.quotedText : undefined,
            explanation: s.explanation || 'Tone improvement opportunity detected.',
            suggestedAlternative: typeof s.suggestedAlternative === 'string' ? s.suggestedAlternative : undefined,
            confidence: s.confidence || 'Medium',
            relatedRuleId: typeof s.relatedRuleId === 'string' ? s.relatedRuleId : undefined,
            relatedRuleTitle: typeof s.relatedRuleTitle === 'string' ? s.relatedRuleTitle : undefined,
            hasVerifiedPolicyEvidence: Boolean(s.hasVerifiedPolicyEvidence),
            citationLabel: s.citationLabel || 'AI Suggestion (No verified policy evidence)'
          }))
        : [];

      return {
        status: 'completed',
        suggestions,
        provider: data.provider,
        model: data.model
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      return {
        status: 'error',
        suggestions: [],
        error: isAbort
          ? 'Tone review request timed out after 16 seconds. Please verify your connection or retry.'
          : (err?.message || 'Failed to connect to AI tone analysis endpoint.')
      };
    }
  }
};
