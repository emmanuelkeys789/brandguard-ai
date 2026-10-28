import type { BrandProfile, BrandRule, ReviewItem } from '../types';
import {
  brandStorage,
  type StorageResult
} from './brandStorage.ts';
import {
  supabase,
  isSupabaseConfigured,
  checkDatabaseConnection
} from './supabaseClient.ts';

export interface DatabaseConnectionState {
  status: 'connected' | 'unconfigured' | 'error';
  provider: 'supabase' | 'local';
  url?: string;
  latencyMs?: number;
  errorMessage?: string;
}

export interface SyncResult {
  success: boolean;
  profilesCount: number;
  rulesCount: number;
  reviewsCount: number;
  errors: string[];
}

// ------------------------------------------------------------------------
// PostgreSQL / Supabase Row Mappers
// ------------------------------------------------------------------------

export function rowToProfile(row: any): BrandProfile {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    industry: row.industry || '',
    targetAudience: row.target_audience || '',
    communicationTone: row.communication_tone || 'Professional',
    toneCustomDetails: row.tone_custom_details || undefined,
    preferredLanguage: row.preferred_language || 'English (US)',
    additionalNotes: row.additional_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function profileToRow(profile: BrandProfile): Record<string, any> {
  return {
    id: profile.id,
    name: profile.name,
    description: profile.description || '',
    industry: profile.industry || '',
    target_audience: profile.targetAudience || '',
    communication_tone: profile.communicationTone,
    tone_custom_details: profile.toneCustomDetails || null,
    preferred_language: profile.preferredLanguage || 'English (US)',
    additional_notes: profile.additionalNotes || '',
    created_at: profile.createdAt,
    updated_at: profile.updatedAt
  };
}

export function rowToRule(row: any): BrandRule {
  return {
    id: row.id,
    brandId: row.brand_id || 'brand_axiom_01',
    title: row.title,
    category: row.category,
    severity: row.severity || 'Medium',
    description: row.description,
    example: row.example || undefined,
    exampleViolation: row.example_violation || undefined,
    remedyRecommendation: row.remedy_recommendation || undefined,
    sourceDescription: row.source_description || undefined,
    sourceUrl: row.source_url || undefined,
    enabled: Boolean(row.enabled ?? true),
    code: row.code || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function ruleToRow(rule: BrandRule): Record<string, any> {
  return {
    id: rule.id,
    brand_id: rule.brandId || null,
    title: rule.title,
    category: rule.category,
    severity: rule.severity || 'Medium',
    description: rule.description,
    example: rule.example || null,
    example_violation: rule.exampleViolation || null,
    remedy_recommendation: rule.remedyRecommendation || null,
    source_description: rule.sourceDescription || null,
    source_url: rule.sourceUrl || null,
    enabled: rule.enabled ?? true,
    code: rule.code || null,
    created_at: rule.createdAt,
    updated_at: rule.updatedAt
  };
}

export function rowToReview(row: any): ReviewItem {
  return {
    id: row.id,
    title: row.title,
    author: row.author || 'Workspace Reviewer',
    channel: row.channel,
    status: row.status,
    updatedAt: row.updated_at_label || 'Just now',
    wordCount: Number(row.word_count || 0),
    issuesCount: Number(row.issues_count || 0),
    confidenceScore: Number(row.confidence_score ?? 100),
    summary: row.summary || '',
    originalDraft: row.original_draft || '',
    currentDraft: row.current_draft || '',
    rulesCheckedCount: Number(row.rules_checked_count || 0),
    firstPassIssuesCount: typeof row.first_pass_issues_count === 'number' ? row.first_pass_issues_count : undefined,
    firstPassScore: typeof row.first_pass_score === 'number' ? row.first_pass_score : undefined,
    firstPassFindings: Array.isArray(row.first_pass_findings) ? row.first_pass_findings : [],
    findings: Array.isArray(row.findings) ? row.findings : [],
    decisionHistory: Array.isArray(row.decision_history) ? row.decision_history : [],
    revisions: Array.isArray(row.revisions) ? row.revisions : [],
    reviewerComment: row.reviewer_comment || undefined,
    decisionAt: row.decision_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    aiSuggestions: Array.isArray(row.ai_suggestions) ? row.ai_suggestions : undefined,
    aiAnalysisStatus: row.ai_analysis_status || undefined,
    aiAnalysisError: row.ai_analysis_error || undefined,
    imageAsset: row.image_asset || undefined,
    visualFindings: Array.isArray(row.visual_findings) ? row.visual_findings : undefined,
    visualAnalysisStatus: row.visual_analysis_status || undefined,
    visualAnalysisError: row.visual_analysis_error || undefined,
    visualProvider: row.visual_provider || undefined,
    visualModel: row.visual_model || undefined
  };
}

export function reviewToRow(review: ReviewItem): Record<string, any> {
  return {
    id: review.id,
    brand_id: 'brand_axiom_01',
    title: review.title,
    author: review.author || 'Workspace Reviewer',
    channel: review.channel,
    status: review.status,
    updated_at_label: review.updatedAt || 'Just now',
    word_count: review.wordCount || 0,
    issues_count: review.issuesCount || 0,
    confidence_score: review.confidenceScore ?? 100,
    summary: review.summary || '',
    original_draft: review.originalDraft || '',
    current_draft: review.currentDraft || '',
    rules_checked_count: review.rulesCheckedCount || 0,
    first_pass_issues_count: typeof review.firstPassIssuesCount === 'number' ? review.firstPassIssuesCount : null,
    first_pass_score: typeof review.firstPassScore === 'number' ? review.firstPassScore : null,
    first_pass_findings: Array.isArray(review.firstPassFindings) ? review.firstPassFindings : [],
    findings: Array.isArray(review.findings) ? review.findings : [],
    decision_history: Array.isArray(review.decisionHistory) ? review.decisionHistory : [],
    revisions: Array.isArray(review.revisions) ? review.revisions : [],
    reviewer_comment: review.reviewerComment || null,
    decision_at: review.decisionAt || null,
    reviewed_by: review.reviewedBy || null,
    ai_suggestions: Array.isArray(review.aiSuggestions) ? review.aiSuggestions : [],
    ai_analysis_status: review.aiAnalysisStatus || null,
    ai_analysis_error: review.aiAnalysisError || null,
    image_asset: review.imageAsset || null,
    visual_findings: Array.isArray(review.visualFindings) ? review.visualFindings : [],
    visual_analysis_status: review.visualAnalysisStatus || null,
    visual_analysis_error: review.visualAnalysisError || null,
    visual_provider: review.visualProvider || null,
    visual_model: review.visualModel || null,
    updated_at: new Date().toISOString()
  };
}

// ------------------------------------------------------------------------
// Hybrid Database & Storage Repository
// ------------------------------------------------------------------------

let mockSupabaseClient: any = null;

function getActiveClient(): any {
  return mockSupabaseClient || (isSupabaseConfigured() ? supabase : null);
}

export const brandRepository = {
  /**
   * Inject a mock client for automated test suites
   */
  setClientForTesting(client: any): void {
    mockSupabaseClient = client;
  },

  isCloudConfigured(): boolean {
    return Boolean(mockSupabaseClient || isSupabaseConfigured());
  },

  async getConnectionState(): Promise<DatabaseConnectionState> {
    const client = getActiveClient();
    if (!client) {
      return {
        status: 'unconfigured',
        provider: 'local',
        errorMessage: 'Running in offline LocalStorage mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable Cloud PostgreSQL.'
      };
    }

    if (mockSupabaseClient) {
      try {
        const { error } = await mockSupabaseClient.from('brand_profiles').select('id').limit(1);
        if (error) {
          return {
            status: 'error',
            provider: 'supabase',
            errorMessage: error.message
          };
        }
        return {
          status: 'connected',
          provider: 'supabase',
          url: 'https://mock-project.supabase.co',
          latencyMs: 5
        };
      } catch (err) {
        return {
          status: 'error',
          provider: 'supabase',
          errorMessage: err instanceof Error ? err.message : 'Mock client error'
        };
      }
    }

    const test = await checkDatabaseConnection();
    if (test.connected) {
      return {
        status: 'connected',
        provider: 'supabase',
        url: test.url,
        latencyMs: test.latencyMs
      };
    }

    return {
      status: 'error',
      provider: 'supabase',
      url: test.url,
      latencyMs: test.latencyMs,
      errorMessage: test.error
    };
  },

  /**
   * Retrieve Brand Profile from Supabase with fallback to local cache
   */
  async getProfile(): Promise<BrandProfile | null> {
    const client = getActiveClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('brand_profiles')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const profile = rowToProfile(data[0]);
          // Sync local storage mirror
          brandStorage.saveProfile(profile);
          return profile;
        }

        // If table is empty in cloud, check local storage
        if (!error && data && data.length === 0) {
          const local = brandStorage.getStoredProfile();
          if (local) {
            // Push existing local to cloud
            await this.saveProfile(local);
            return local;
          }
          return null;
        }
      } catch (err) {
        console.warn('Supabase profile fetch error, using local storage cache:', err);
      }
    }

    return brandStorage.getStoredProfile();
  },

  /**
   * Save Brand Profile to Supabase and keep local storage mirror in sync
   */
  async saveProfile(
    input: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<StorageResult<BrandProfile>> {
    // 1. Save to local storage first (optimistic & offline safety)
    const localResult = brandStorage.saveProfile(input);
    if (!localResult.success || !localResult.data) {
      return localResult;
    }

    // 2. If Supabase is configured, upsert to PostgreSQL
    const client = getActiveClient();
    if (client) {
      try {
        const row = profileToRow(localResult.data);
        const { error } = await client
          .from('brand_profiles')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          console.error('Database write error for brand profile:', error);
          return {
            success: false,
            data: localResult.data,
            error: `Saved locally, but Cloud Database write failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          data: localResult.data,
          error: `Saved locally, but network error writing to Cloud Database: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * Delete Brand Profile from Supabase and local storage
   */
  async deleteProfile(id?: string): Promise<StorageResult<void>> {
    const localResult = brandStorage.deleteProfile();

    const client = getActiveClient();
    if (client) {
      try {
        const query = client.from('brand_profiles').delete();
        const { error } = id ? await query.eq('id', id) : await query.neq('id', '');

        if (error) {
          return {
            success: false,
            error: `Removed locally, but Cloud Database delete failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          error: `Removed locally, but Cloud Database unreachable: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * Retrieve Brand Rules from Supabase with fallback to local cache
   */
  async getRules(): Promise<BrandRule[]> {
    const client = getActiveClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('brand_rules')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            const rules = data.map(rowToRule);
            // Update local cache
            try {
              localStorage.setItem('brandguard_brand_rules', JSON.stringify(rules));
            } catch {
              // ignore
            }
            return rules;
          } else {
            // Check if local storage has rules to sync to cloud
            const localRules = brandStorage.getStoredRules();
            if (localRules.length > 0) {
              for (const r of localRules) {
                await this.saveRule(r);
              }
              return localRules;
            }
            return [];
          }
        }
      } catch (err) {
        console.warn('Supabase rules fetch error, using local storage cache:', err);
      }
    }

    return brandStorage.getStoredRules();
  },

  /**
   * Save or update a Brand Rule in Supabase and local storage
   */
  async saveRule(
    input: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<StorageResult<BrandRule>> {
    const localResult = brandStorage.saveRule(input);
    if (!localResult.success || !localResult.data) {
      return localResult;
    }

    const client = getActiveClient();
    if (client) {
      try {
        const row = ruleToRow(localResult.data);
        const { error } = await client
          .from('brand_rules')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          console.error('Database write error for brand rule:', error);
          return {
            success: false,
            data: localResult.data,
            error: `Saved locally, but Cloud Database write failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          data: localResult.data,
          error: `Saved locally, but network error writing to Cloud Database: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * Delete a Brand Rule from Supabase and local storage
   */
  async deleteRule(id: string): Promise<StorageResult<boolean>> {
    const localResult = brandStorage.deleteRule(id);

    const client = getActiveClient();
    if (client) {
      try {
        const { error } = await client
          .from('brand_rules')
          .delete()
          .eq('id', id);

        if (error) {
          return {
            success: false,
            error: `Deleted locally, but Cloud Database delete failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          error: `Deleted locally, but Cloud Database unreachable: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * Toggle enabled status of a Brand Rule
   */
  async toggleRuleEnabled(id: string): Promise<StorageResult<BrandRule>> {
    const localResult = brandStorage.toggleRuleEnabled(id);
    if (!localResult.success || !localResult.data) {
      return localResult;
    }

    const client = getActiveClient();
    if (client) {
      try {
        const { error } = await client
          .from('brand_rules')
          .update({
            enabled: localResult.data.enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          return {
            success: false,
            data: localResult.data,
            error: `Status toggled locally, but Cloud Database update failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          data: localResult.data,
          error: `Cloud Database unreachable: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * Retrieve Reviews from Supabase with fallback to local cache
   */
  async getReviews(): Promise<ReviewItem[]> {
    const client = getActiveClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('brand_reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            const reviews = data.map(rowToReview);
            // Update local storage mirror
            try {
              localStorage.setItem('brandguard_brand_reviews', JSON.stringify(reviews));
            } catch {
              // ignore
            }
            return reviews;
          } else {
            // Check if local storage has reviews to sync to cloud
            const localReviews = brandStorage.getStoredReviews();
            if (localReviews.length > 0) {
              for (const item of localReviews) {
                await this.saveReview(item);
              }
              return localReviews;
            }
            return [];
          }
        }
      } catch (err) {
        console.warn('Supabase reviews fetch error, using local storage cache:', err);
      }
    }

    return brandStorage.getStoredReviews();
  },

  /**
   * Save or update a Review in Supabase and local storage
   */
  async saveReview(
    input: Omit<ReviewItem, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }
  ): Promise<StorageResult<ReviewItem>> {
    const localResult = brandStorage.saveReview(input);
    if (!localResult.success || !localResult.data) {
      return localResult;
    }

    const client = getActiveClient();
    if (client) {
      try {
        const row = reviewToRow(localResult.data);
        const { error } = await client
          .from('brand_reviews')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          console.error('Database write error for review item:', error);
          return {
            success: false,
            data: localResult.data,
            error: `Saved locally, but Cloud Database write failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          data: localResult.data,
          error: `Saved locally, but network error writing to Cloud Database: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * Delete a Review from Supabase and local storage
   */
  async deleteReview(id: string): Promise<StorageResult<boolean>> {
    const localResult = brandStorage.deleteReview(id);

    const client = getActiveClient();
    if (client) {
      try {
        const { error } = await client
          .from('brand_reviews')
          .delete()
          .eq('id', id);

        if (error) {
          return {
            success: false,
            error: `Deleted locally, but Cloud Database delete failed: ${error.message}`
          };
        }
      } catch (err) {
        return {
          success: false,
          error: `Deleted locally, but Cloud Database unreachable: ${err instanceof Error ? err.message : 'Unknown'}`
        };
      }
    }

    return localResult;
  },

  /**
   * One-click explicit migration: syncs all existing localStorage records
   * up to Supabase PostgreSQL without duplicates or overwrites.
   */
  async syncLocalDataToDatabase(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      profilesCount: 0,
      rulesCount: 0,
      reviewsCount: 0,
      errors: []
    };

    const client = getActiveClient();
    if (!client) {
      return {
        success: false,
        profilesCount: 0,
        rulesCount: 0,
        reviewsCount: 0,
        errors: ['Cannot sync: Supabase credentials are not configured in environment variables.']
      };
    }

    // 1. Sync Profile
    const localProfile = brandStorage.getStoredProfile();
    if (localProfile) {
      try {
        const row = profileToRow(localProfile);
        const { error } = await client
          .from('brand_profiles')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          result.errors.push(`Profile sync error: ${error.message}`);
        } else {
          result.profilesCount += 1;
        }
      } catch (e) {
        result.errors.push(`Profile sync failed: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }

    // 2. Sync Rules
    const localRules = brandStorage.getStoredRules();
    for (const rule of localRules) {
      try {
        const row = ruleToRow(rule);
        const { error } = await client
          .from('brand_rules')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          result.errors.push(`Rule "${rule.title}" sync error: ${error.message}`);
        } else {
          result.rulesCount += 1;
        }
      } catch (e) {
        result.errors.push(`Rule "${rule.title}" sync failed: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }

    // 3. Sync Reviews
    const localReviews = brandStorage.getStoredReviews();
    for (const review of localReviews) {
      try {
        const row = reviewToRow(review);
        const { error } = await client
          .from('brand_reviews')
          .upsert(row, { onConflict: 'id' });

        if (error) {
          result.errors.push(`Review "${review.title}" sync error: ${error.message}`);
        } else {
          result.reviewsCount += 1;
        }
      } catch (e) {
        result.errors.push(`Review "${review.title}" sync failed: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }
};
