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
          const errData = await response.json();
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

      const data = await response.json();

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
