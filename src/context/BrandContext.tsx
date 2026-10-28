import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { BrandProfile, BrandRule, ReviewItem } from '../types';
import { brandStorage } from '../services/brandStorage';
import {
  brandRepository,
  type DatabaseConnectionState,
  type SyncResult
} from '../services/brandRepository';
import { BrandContext, type ToastMessage } from './brandContextDef';
import { useAuth } from './useAuth';

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, can } = useAuth();

  // Read stored data directly on startup without auto-inserting fake seeds

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(() => {
    return brandStorage.getStoredProfile();
  });

  const [rules, setRules] = useState<BrandRule[]>(() => {
    return brandStorage.getStoredRules();
  });

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    return brandStorage.getStoredReviews();
  });

  const [onboarding, setOnboarding] = useState(() => {
    return brandStorage.getOnboardingState();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbState, setDbState] = useState<DatabaseConnectionState>(() => {
    return {
      status: brandRepository.isCloudConfigured() ? 'connected' : 'unconfigured',
      provider: brandRepository.isCloudConfigured() ? 'supabase' : 'local',
      errorMessage: brandRepository.isCloudConfigured()
        ? undefined
        : 'Running in offline LocalStorage mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Cloud PostgreSQL.'
    };
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: 'success' | 'info' | 'error', title: string, description?: string) => {
    const id = `toast_${Date.now()}`;
    setToast({ id, type, title, description });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Check database connection and rehydrate cloud state on startup if configured
  useEffect(() => {
    let isMounted = true;

    async function initDatabase() {
      const state = await brandRepository.getConnectionState();
      if (!isMounted) return;
      setDbState(state);

      if (state.status === 'connected') {
        setIsLoading(true);
        try {
          const [cloudProfile, cloudRules, cloudReviews] = await Promise.all([
            brandRepository.getProfile(),
            brandRepository.getRules(),
            brandRepository.getReviews()
          ]);

          if (!isMounted) return;
          if (cloudProfile) setBrandProfile(cloudProfile);
          if (cloudRules && cloudRules.length > 0) setRules(cloudRules);
          if (cloudReviews && cloudReviews.length > 0) setReviews(cloudReviews);
        } catch (err) {
          console.warn('Initial cloud rehydration error:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshFromDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await brandRepository.getConnectionState();
      setDbState(state);

      const [cloudProfile, cloudRules, cloudReviews] = await Promise.all([
        brandRepository.getProfile(),
        brandRepository.getRules(),
        brandRepository.getReviews()
      ]);

      if (cloudProfile) setBrandProfile(cloudProfile);
      if (cloudRules) setRules(cloudRules);
      if (cloudReviews) setReviews(cloudReviews);

      showToast('info', 'Database Refreshed', 'Loaded latest data from storage repository.');
    } catch (err) {
      showToast('error', 'Refresh Failed', err instanceof Error ? err.message : 'Failed to reload data.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const syncToDatabase = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await brandRepository.syncLocalDataToDatabase();
      if (result.success) {
        showToast(
          'success',
          'Cloud Sync Complete',
          `Synced ${result.profilesCount} profile, ${result.rulesCount} rules, and ${result.reviewsCount} reviews to PostgreSQL.`
        );
      } else {
        showToast(
          'error',
          'Sync Issues Detected',
          result.errors.join('; ') || 'Could not sync all records to Cloud Database.'
        );
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown sync failure';
      showToast('error', 'Sync Failed', errorMsg);
      return {
        success: false,
        profilesCount: 0,
        rulesCount: 0,
        reviewsCount: 0,
        errors: [errorMsg]
      };
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const saveProfile = useCallback(
    (data: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): boolean => {
      if (!can('manage_profile')) {
        showToast('error', 'Permission Denied', 'Only workspace Admins can modify the brand profile.');
        return false;
      }

      const result = brandStorage.saveProfile(data);
      if (result.success && result.data) {
        setBrandProfile(result.data);
        showToast('success', 'Brand Profile Saved', `Profile for "${result.data.name}" has been saved.`);

        // Asynchronously persist to Cloud PostgreSQL if enabled
        if (brandRepository.isCloudConfigured()) {
          brandRepository.saveProfile(data).then((cloudRes) => {
            if (!cloudRes.success) {
              showToast('error', 'Cloud Save Warning', cloudRes.error || 'Failed to sync profile to Cloud Database.');
            }
          });
        }
        return true;
      } else {
        showToast('error', 'Failed to Save Profile', result.error || 'Could not save profile to storage.');
        return false;
      }
    },
    [can, showToast]
  );

  const deleteProfile = useCallback((): boolean => {
    if (!can('manage_profile')) {
      showToast('error', 'Permission Denied', 'Only workspace Admins can remove the brand profile.');
      return false;
    }

    const result = brandStorage.deleteProfile();
    if (result.success) {
      setBrandProfile(null);
      showToast('info', 'Brand Profile Removed', 'You can create a new profile at any time.');

      if (brandRepository.isCloudConfigured()) {
        brandRepository.deleteProfile().then((cloudRes) => {
          if (!cloudRes.success) {
            showToast('error', 'Cloud Delete Warning', cloudRes.error);
          }
        });
      }
      return true;
    } else {
      showToast('error', 'Failed to Remove Profile', result.error || 'Could not delete profile from storage.');
      return false;
    }
  }, [can, showToast]);

  const saveRule = useCallback(
    (data: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): boolean => {
      if (!can('manage_rules')) {
        showToast('error', 'Permission Denied', 'Only workspace Admins can create or edit brand rules.');
        return false;
      }

      const currentRules = brandStorage.getStoredRules();
      const isEdit = Boolean(data.id && currentRules.some((r) => r.id === data.id));
      const result = brandStorage.saveRule(data);

      if (result.success && result.data) {
        setRules(brandStorage.getStoredRules());
        showToast(
          'success',
          isEdit ? 'Rule Updated' : 'Rule Created',
          `"${result.data.title}" has been saved under ${result.data.category}.`
        );

        if (brandRepository.isCloudConfigured()) {
          brandRepository.saveRule(data).then((cloudRes) => {
            if (!cloudRes.success) {
              showToast('error', 'Cloud Save Warning', cloudRes.error || 'Failed to sync rule to Cloud Database.');
            }
          });
        }
        return true;
      } else {
        showToast('error', 'Failed to Save Rule', result.error || 'Could not save rule to storage.');
        return false;
      }
    },
    [can, showToast]
  );

  const deleteRule = useCallback(
    (id: string): boolean => {
      if (!can('manage_rules')) {
        showToast('error', 'Permission Denied', 'Only workspace Admins can delete brand rules.');
        return false;
      }

      const currentRules = brandStorage.getStoredRules();
      const targetRule = currentRules.find((r) => r.id === id);
      const result = brandStorage.deleteRule(id);

      if (result.success) {
        setRules(brandStorage.getStoredRules());
        showToast('info', 'Rule Deleted', targetRule ? `"${targetRule.title}" was removed.` : undefined);

        if (brandRepository.isCloudConfigured()) {
          brandRepository.deleteRule(id).then((cloudRes) => {
            if (!cloudRes.success) {
              showToast('error', 'Cloud Delete Warning', cloudRes.error);
            }
          });
        }
        return true;
      } else {
        showToast('error', 'Failed to Delete Rule', result.error || 'Could not delete rule from storage.');
        return false;
      }
    },
    [can, showToast]
  );

  const toggleRuleEnabled = useCallback(
    (id: string): boolean => {
      if (!can('manage_rules')) {
        showToast('error', 'Permission Denied', 'Only workspace Admins can pause or activate brand rules.');
        return false;
      }

      const result = brandStorage.toggleRuleEnabled(id);
      if (result.success && result.data) {
        setRules(brandStorage.getStoredRules());
        showToast(
          'info',
          result.data.enabled ? 'Rule Activated' : 'Rule Paused',
          `"${result.data.title}" is ${result.data.enabled ? 'now active for future reviews' : 'paused from automated evaluations'}.`
        );

        if (brandRepository.isCloudConfigured()) {
          brandRepository.toggleRuleEnabled(id).then((cloudRes) => {
            if (!cloudRes.success) {
              showToast('error', 'Cloud Toggle Warning', cloudRes.error);
            }
          });
        }
        return true;
      } else {
        showToast('error', 'Failed to Update Rule', result.error || 'Could not update rule in storage.');
        return false;
      }
    },
    [can, showToast]
  );

  const saveReview = useCallback(
    (data: Omit<ReviewItem, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }): boolean => {
      const isApprovalOrRejection = data.status === 'Approved' || data.status === 'Rejected';
      if (isApprovalOrRejection && !can('approve_review')) {
        showToast('error', 'Permission Denied', 'Reviewer or Admin authorization is required to approve or reject reviews.');
        return false;
      }

      const reviewAuthor = data.author && data.author !== 'Workspace Reviewer' ? data.author : currentUser.name;
      const reviewToSave = {
        ...data,
        author: reviewAuthor
      };

      const result = brandStorage.saveReview(reviewToSave);
      if (result.success && result.data) {
        setReviews(brandStorage.getStoredReviews());
        showToast('success', 'Review Saved', `Saved review for "${result.data.title}".`);

        if (brandRepository.isCloudConfigured()) {
          brandRepository.saveReview(reviewToSave).then((cloudRes) => {
            if (!cloudRes.success) {
              showToast('error', 'Cloud Save Warning', cloudRes.error || 'Failed to sync review to Cloud Database.');
            }
          });
        }
        return true;
      } else {
        showToast('error', 'Failed to Save Review', result.error || 'Could not save review.');
        return false;
      }
    },
    [can, currentUser.name, showToast]
  );

  const deleteReview = useCallback(
    (id: string): boolean => {
      if (!can('delete_review')) {
        showToast('error', 'Permission Denied', 'Only workspace Admins can delete review records.');
        return false;
      }

      const result = brandStorage.deleteReview(id);
      if (result.success) {
        setReviews(brandStorage.getStoredReviews());
        showToast('info', 'Review Deleted', 'Review removed from history.');

        if (brandRepository.isCloudConfigured()) {
          brandRepository.deleteReview(id).then((cloudRes) => {
            if (!cloudRes.success) {
              showToast('error', 'Cloud Delete Warning', cloudRes.error);
            }
          });
        }
        return true;
      } else {
        showToast('error', 'Failed to Delete Review', result.error || 'Could not delete review.');
        return false;
      }
    },
    [can, showToast]
  );


  const markReviewedContent = useCallback(() => {
    brandStorage.saveOnboardingState({ hasReviewed: true });
    setOnboarding((prev) => ({ ...prev, hasReviewed: true }));
  }, []);

  const markUnderstoodResults = useCallback(() => {
    brandStorage.saveOnboardingState({ hasUnderstood: true });
    setOnboarding((prev) => ({ ...prev, hasUnderstood: true }));
  }, []);

  const setIsOnboardingDismissed = useCallback((dismissed: boolean) => {
    brandStorage.saveOnboardingState({ dismissed });
    setOnboarding((prev) => ({ ...prev, dismissed }));
  }, []);

  const clearAllData = useCallback(() => {
    const result = brandStorage.clearAllData();
    if (result.success) {
      setBrandProfile(null);
      setRules([]);
      setReviews([]);
      setOnboarding({ hasReviewed: false, hasUnderstood: false, dismissed: false });
      showToast('info', 'All Data Cleared', 'Brand profiles, rules, and reviews have been cleared.');
    }
  }, [showToast]);

  return (
    <BrandContext.Provider
      value={{
        brandProfile,
        rules,
        reviews,
        isLoading,
        dbState,
        isSyncing,
        syncToDatabase,
        refreshFromDatabase,
        saveProfile,
        deleteProfile,
        saveRule,
        deleteRule,
        toggleRuleEnabled,
        saveReview,
        deleteReview,
        hasReviewedContent: onboarding.hasReviewed,
        markReviewedContent,
        hasUnderstoodResults: onboarding.hasUnderstood,
        markUnderstoodResults,
        isOnboardingDismissed: onboarding.dismissed,
        setIsOnboardingDismissed,
        clearAllData,
        toast,
        dismissToast,
        showToast
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};
