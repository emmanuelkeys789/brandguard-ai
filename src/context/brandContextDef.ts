import { createContext } from 'react';
import type { BrandProfile, BrandRule, ReviewItem } from '../types';
import type { DatabaseConnectionState, SyncResult } from '../services/brandRepository';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  description?: string;
}

export interface BrandContextType {
  brandProfile: BrandProfile | null;
  rules: BrandRule[];
  reviews: ReviewItem[];
  isLoading: boolean;
  dbState: DatabaseConnectionState;
  isSyncing: boolean;
  syncToDatabase: () => Promise<SyncResult>;
  refreshFromDatabase: () => Promise<void>;
  saveProfile: (data: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => boolean;
  deleteProfile: () => boolean;
  saveRule: (data: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => boolean;
  deleteRule: (id: string) => boolean;
  toggleRuleEnabled: (id: string) => boolean;
  saveReview: (review: Omit<ReviewItem, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }) => boolean;
  deleteReview: (id: string) => boolean;
  hasReviewedContent: boolean;
  markReviewedContent: () => void;
  hasUnderstoodResults: boolean;
  markUnderstoodResults: () => void;
  isOnboardingDismissed: boolean;
  setIsOnboardingDismissed: (dismissed: boolean) => void;
  clearAllData: () => void;
  toast: ToastMessage | null;
  dismissToast: () => void;
  showToast: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const BrandContext = createContext<BrandContextType | undefined>(undefined);

