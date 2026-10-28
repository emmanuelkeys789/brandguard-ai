export type ReviewStatus = 'Needs review' | 'In review' | 'Approved' | 'Rejected' | 'Draft' | 'Changes Requested';

export type CommunicationTone =
  | 'Professional'
  | 'Friendly'
  | 'Conversational'
  | 'Authoritative'
  | 'Informative'
  | 'Custom';

export interface BrandProfile {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  targetAudience?: string;
  communicationTone: CommunicationTone;
  toneCustomDetails?: string;
  preferredLanguage?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RuleCategory =
  | 'Approved Facts'
  | 'Required Terms'
  | 'Prohibited Terms'
  | 'Tone of Voice'
  | 'Claims & Restrictions'
  | 'Visual Guidelines'
  | 'Accessibility'
  | 'Other'
  | 'Required Terminology'
  | 'Prohibited Terminology'
  | 'Tone and Voice'
  | 'Claims and Restrictions'
  | 'Claims & Evidence'
  | 'Accessibility Guidelines'
  | 'Terminology'
  | 'Legal & Trademarks'
  | 'Formatting';

export type RuleSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Warning' | 'Advisory';

export interface ReviewDecisionRecord {
  id: string;
  action: 'Approve' | 'Request Changes' | 'Reject' | 'Save Draft' | 'Submit Revision';
  reviewerName: string;
  reviewerComment?: string;
  timestamp: string;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
}

export interface ReviewRevisionRecord {
  id: string;
  revisionNumber: number;
  text: string;
  editedAt: string;
  findingsCount: number;
  score: number;
}

export interface AiToneSuggestion {
  id: string;
  category: 'AI tone/context';
  toneCategory: 'Tone & Voice' | 'Audience Resonance' | 'Messaging Alignment' | 'Clarity & Delivery';
  severity: 'High' | 'Medium' | 'Low' | 'Advisory';
  quotedText?: string;
  explanation: string;
  suggestedAlternative?: string;
  confidence: 'High' | 'Medium' | 'Tentative';
  relatedRuleId?: string;
  relatedRuleTitle?: string;
  hasVerifiedPolicyEvidence: boolean;
  citationLabel: string;
}

export type AiAnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'unavailable' | 'error';

export interface ReviewItem {
  id: string;
  title: string;
  author: string;
  channel: string;
  status: ReviewStatus;
  updatedAt: string;
  wordCount: number;
  issuesCount: number;
  confidenceScore: number;
  summary: string;
  originalDraft?: string;
  currentDraft?: string;
  findings?: Array<{
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
  }>;
  firstPassIssuesCount?: number;
  firstPassScore?: number;
  firstPassFindings?: Array<{
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
  }>;
  decisionHistory?: ReviewDecisionRecord[];
  revisions?: ReviewRevisionRecord[];
  reviewerComment?: string;
  decisionAt?: string;
  reviewedBy?: string;
  rulesCheckedCount?: number;
  aiSuggestions?: AiToneSuggestion[];
  aiAnalysisStatus?: AiAnalysisStatus;
  aiAnalysisError?: string;
  imageAsset?: ImageAsset;
  visualFindings?: VisualAnalysisFinding[];
  visualAnalysisStatus?: VisualAnalysisStatus;
  visualAnalysisError?: string;
  visualProvider?: string;
  visualModel?: string;
}

export type VisualCategory =
  | 'Logo & Visual Identity'
  | 'Colors & Typography'
  | 'Composition & Layout'
  | 'Accessibility & Contrast'
  | 'Alt Text Assessment';

export type VisualAnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'unavailable' | 'error';

export interface ImageAsset {
  id: string;
  fileName: string;
  fileType: 'image/png' | 'image/jpeg' | 'image/webp' | string;
  fileSize: number;
  altText?: string;
  thumbnailDataUrl?: string;
  width?: number;
  height?: number;
}

export interface VisualAnalysisFinding {
  id: string;
  category: VisualCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  observableEvidence: string;
  isUncertain: boolean;
  confidence: 'High' | 'Medium' | 'Tentative' | 'Uncertain';
  suggestedRemedy?: string;
  relatedRuleId?: string;
  relatedRuleTitle?: string;
  hasVerifiedPolicyEvidence: boolean;
  citationLabel: string;
}

export interface BrandRule {
  id: string;
  brandId: string;
  title: string;
  category: RuleCategory;
  description: string;
  example?: string;
  severity?: SeverityLevel;
  sourceDescription?: string;
  sourceUrl?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  code?: string;
  exampleViolation?: string;
  remedyRecommendation?: string;
  sourceDocument?: string;
  isActive?: boolean;
}

export interface MetricItem {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  subtext: string;
}

export interface CarouselSlide {
  id: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  keyPoints: string[];
  mockCard: {
    title: string;
    status: string;
    highlight: string;
    pill: string;
    stats: { label: string; val: string }[];
  };
}

export interface WorkflowStage {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  deliverable: string;
}

export type DashboardTab = 
  | 'overview' 
  | 'review' 
  | 'guidelines' 
  | 'history' 
  | 'insights' 
  | 'settings';

export type { UserRole, WorkspaceAction, SimulatedUser } from '../services/rbac.ts';

