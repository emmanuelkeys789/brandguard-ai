import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Sparkles,
  ExternalLink,
  Edit3,
  Check,
  Info,
  Lock,
  History,
  FileCheck,
  Bot,
  RefreshCw,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import type {
  ReviewItem,
  ReviewStatus,
  BrandRule,
  BrandProfile,
  SeverityLevel,
  ReviewDecisionRecord,
  AiToneSuggestion,
  AiAnalysisStatus
} from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  evaluateDraft,
  calculateComplianceScore,
  getFindingRuleMetadata,
  type ReviewFinding
} from '../../services/ruleEngine';
import { aiToneService } from '../../services/aiToneService';
import { isSummaryText, deduplicateDecisionHistory } from '../../services/brandStorage';

interface ReviewDetailModalProps {
  review: ReviewItem;
  rules: BrandRule[];
  brandProfile: BrandProfile | null;
  onClose: () => void;
  onUpdateReview: (updated: ReviewItem) => void;
  showToast: (type: 'success' | 'info' | 'error', title: string, description?: string) => void;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  rules,
  brandProfile,
  onClose,
  onUpdateReview,
  showToast
}) => {
  // Tabs: 'revision' (editable) vs 'original' (immutable)
  const [activeDraftTab, setActiveDraftTab] = useState<'revision' | 'original'>('revision');

  // Segmented findings tab: 'policy' (deterministic) vs 'ai' (advisory)
  const [activeResultsSection, setActiveResultsSection] = useState<'policy' | 'ai'>('policy');

  // Working drafts - NEVER use summary text as draft content
  const originalDraftText =
    review.originalDraft && !isSummaryText(review.originalDraft)
      ? review.originalDraft
      : (review.currentDraft && !isSummaryText(review.currentDraft)
          ? review.currentDraft
          : 'Original draft unavailable');

  const [currentDraftText, setCurrentDraftText] = useState<string>(() => {
    if (review.currentDraft && !isSummaryText(review.currentDraft)) {
      return review.currentDraft;
    }
    if (review.originalDraft && !isSummaryText(review.originalDraft)) {
      return review.originalDraft;
    }
    return '';
  });

  // Filter enabled rules
  const enabledRules = rules.filter(
    (r) => (r.enabled !== undefined ? r.enabled : r.isActive ?? true)
  );

  // Active findings for this review - preserve existing findings or rehydrate if missing
  const [findings, setFindings] = useState<ReviewFinding[]>(() => {
    if (Array.isArray(review.findings) && review.findings.length > 0) {
      return review.findings as ReviewFinding[];
    }
    const draftText =
      (review.currentDraft && !isSummaryText(review.currentDraft) ? review.currentDraft : '') ||
      (review.originalDraft && !isSummaryText(review.originalDraft) ? review.originalDraft : '');
    if (draftText.trim()) {
      const evalRes = evaluateDraft(draftText, enabledRules, {
        brandProfile,
        campaignTitle: review.title
      });
      return evalRes.findings;
    }
    return (review.findings as ReviewFinding[]) || [];
  });

  // Local AI suggestions state initialized from review
  const [localAiSuggestions, setLocalAiSuggestions] = useState<AiToneSuggestion[]>(
    () => review.aiSuggestions || []
  );
  const [localAiStatus, setLocalAiStatus] = useState<AiAnalysisStatus>(
    () => review.aiAnalysisStatus || (review.aiSuggestions && review.aiSuggestions.length > 0 ? 'completed' : 'idle')
  );
  const [localAiError, setLocalAiError] = useState<string | null>(
    () => review.aiAnalysisError || null
  );
  const [editedAiAlternatives, setEditedAiAlternatives] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (review.aiSuggestions) {
      for (const s of review.aiSuggestions) {
        if (s.suggestedAlternative) map[s.id] = s.suggestedAlternative;
      }
    }
    return map;
  });
  const [appliedAiIds, setAppliedAiIds] = useState<Set<string>>(new Set());

  // Track if reviewer has re-run the engine on modified draft during this modal session
  const [hasRerunCheck, setHasRerunCheck] = useState<boolean>(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // Track whether the draft in editor has been edited compared to base draft
  const baseSavedDraft =
    review.currentDraft && !isSummaryText(review.currentDraft)
      ? review.currentDraft
      : (review.originalDraft && !isSummaryText(review.originalDraft) ? review.originalDraft : '');
  const isDraftModified = currentDraftText.trim() !== baseSavedDraft.trim();

  // Score strictly derived from documented formula on active findings
  const [currentScore, setCurrentScore] = useState<number>(() => {
    return calculateComplianceScore(
      Array.isArray(review.findings) ? review.findings : findings
    );
  });

  // Decision & Comments
  const [reviewerComment, setReviewerComment] = useState<string>(review.reviewerComment || '');
  const [commentError, setCommentError] = useState<string | null>(null);

  // Confirmations
  const [confirmAction, setConfirmAction] = useState<'Approve' | 'Reject' | null>(null);

  // Editable suggestion per finding
  const [editedCorrections, setEditedCorrections] = useState<Record<string, string>>({});
  const [appliedCorrectionFindingIds, setAppliedCorrectionFindingIds] = useState<Set<string>>(new Set());

  // Handle Rerun Rule Engine on the revised draft
  const handleRerunCheck = () => {
    if (!currentDraftText.trim()) {
      showToast('error', 'Draft Empty', 'Please provide draft content to evaluate.');
      return;
    }

    const result = evaluateDraft(currentDraftText, enabledRules, {
      brandProfile,
      campaignTitle: review.title
    });

    setFindings(result.findings);
    setCurrentScore(result.score);
    setHasRerunCheck(true);

    // Seed editable corrections for newly found findings
    const initialCorrections: Record<string, string> = {};
    for (const f of result.findings) {
      if (f.suggestedCorrection) {
        initialCorrections[f.id] = f.suggestedCorrection;
      }
    }
    setEditedCorrections(initialCorrections);
    setAppliedCorrectionFindingIds(new Set());

    showToast(
      'info',
      'Rule Engine Executed',
      `Evaluated against ${result.checkedRulesCount} active rules. ${result.findings.length} issue(s) detected.`
    );
  };

  // Handle Rerun AI Tone Analysis on revised draft
  const handleRerunAiTone = () => {
    if (!currentDraftText.trim()) {
      showToast('error', 'Draft Empty', 'Please provide draft content to evaluate tone.');
      return;
    }

    setLocalAiStatus('analyzing');
    setLocalAiError(null);

    aiToneService
      .requestToneReview({
        content: currentDraftText,
        brandProfile,
        brandRules: enabledRules,
        channel: review.channel
      })
      .then((aiRes) => {
        setLocalAiStatus(aiRes.status);
        if (aiRes.status === 'completed') {
          setLocalAiSuggestions(aiRes.suggestions);
          const initAlts: Record<string, string> = {};
          for (const s of aiRes.suggestions) {
            if (s.suggestedAlternative) initAlts[s.id] = s.suggestedAlternative;
          }
          setEditedAiAlternatives(initAlts);
          showToast('info', 'AI Tone Review Complete', `Identified ${aiRes.suggestions.length} tone suggestion(s).`);
        } else if (aiRes.status === 'unavailable') {
          setLocalAiSuggestions([]);
          setLocalAiError(aiRes.error || 'AI provider credentials missing.');
        } else {
          setLocalAiSuggestions([]);
          setLocalAiError(aiRes.error || 'Failed to complete AI tone review.');
        }
      })
      .catch((err: any) => {
        setLocalAiStatus('error');
        setLocalAiSuggestions([]);
        setLocalAiError(err?.message || 'Error executing AI tone review.');
      });
  };

  // Handle Save Revised Draft with fresh deterministic evaluation
  const handleSaveRevision = () => {
    const evalResult = evaluateDraft(currentDraftText, enabledRules, {
      brandProfile,
      campaignTitle: review.title
    });

    setFindings(evalResult.findings);
    setCurrentScore(evalResult.score);
    setHasRerunCheck(true);

    const existingRevisions = review.revisions || [];
    const newRevNum = existingRevisions.length + 1;

    const newRevisionRecord = {
      id: `rev_rec_${Date.now()}`,
      revisionNumber: newRevNum,
      text: currentDraftText,
      editedAt: new Date().toISOString(),
      findingsCount: evalResult.findings.length,
      score: evalResult.score
    };

    const updatedItem: ReviewItem = {
      ...review,
      originalDraft: review.originalDraft || originalDraftText,
      currentDraft: currentDraftText,
      findings: evalResult.findings,
      issuesCount: evalResult.findings.length,
      confidenceScore: evalResult.score,
      firstPassFindings: review.firstPassFindings,
      firstPassIssuesCount: review.firstPassIssuesCount,
      firstPassScore: review.firstPassScore,
      rulesCheckedCount: evalResult.checkedRulesCount,
      aiSuggestions: localAiSuggestions.length > 0 ? localAiSuggestions : undefined,
      aiAnalysisStatus: localAiStatus,
      aiAnalysisError: localAiError || undefined,
      wordCount: currentDraftText.trim().split(/\s+/).filter(Boolean).length,
      revisions: [...existingRevisions, newRevisionRecord],
      updatedAt: 'Just now'
    };

    onUpdateReview(updatedItem);
    showToast('success', 'Revision Saved', `Revision #${newRevNum} saved with ${evalResult.findings.length} issue(s) detected.`);
  };

  // Handle Applying a finding suggestion into the current draft
  const handleApplyCorrectionToDraft = (finding: ReviewFinding) => {
    const replacement =
      editedCorrections[finding.id] !== undefined
        ? editedCorrections[finding.id]
        : finding.suggestedCorrection || '';

    if (finding.matchedText && currentDraftText.includes(finding.matchedText)) {
      let newText: string;
      if (
        finding.location &&
        currentDraftText.slice(finding.location.startIndex, finding.location.endIndex) === finding.matchedText
      ) {
        const before = currentDraftText.slice(0, finding.location.startIndex);
        const after = currentDraftText.slice(finding.location.endIndex);
        newText = before + replacement + after;
      } else {
        newText = currentDraftText.replace(finding.matchedText, replacement);
      }

      setCurrentDraftText(newText);
      setAppliedCorrectionFindingIds((prev) => new Set(prev).add(finding.id));
      setActiveDraftTab('revision');
      showToast('success', 'Correction Applied', `Replaced "${finding.matchedText}" with "${replacement}".`);
    } else if (!finding.matchedText && replacement) {
      setCurrentDraftText((prev) => `${prev} ${replacement}`);
      setAppliedCorrectionFindingIds((prev) => new Set(prev).add(finding.id));
      setActiveDraftTab('revision');
      showToast('success', 'Term Inserted', `Inserted required term into revised draft.`);
    }
  };

  // Handle Applying an AI suggestion into the current revised draft
  const handleApplyAiSuggestionToDraft = (suggestion: AiToneSuggestion) => {
    const replacement =
      editedAiAlternatives[suggestion.id] !== undefined
        ? editedAiAlternatives[suggestion.id]
        : suggestion.suggestedAlternative || '';

    if (suggestion.quotedText && currentDraftText.includes(suggestion.quotedText)) {
      const newText = currentDraftText.replace(suggestion.quotedText, replacement);
      setCurrentDraftText(newText);
      setAppliedAiIds((prev) => new Set(prev).add(suggestion.id));
      setActiveDraftTab('revision');
      showToast('success', 'AI Suggestion Applied', `Replaced "${suggestion.quotedText}" with "${replacement}".`);
    } else if (!suggestion.quotedText && replacement) {
      setCurrentDraftText((prev) => `${prev} ${replacement}`);
      setAppliedAiIds((prev) => new Set(prev).add(suggestion.id));
      setActiveDraftTab('revision');
      showToast('success', 'AI Suggestion Inserted', `Inserted suggested wording into revised draft.`);
    } else {
      showToast('info', 'Text Not Found', 'Quoted text was not found in the current revised draft.');
    }
  };

  // Apply a Decision (Approve, Request Changes, Reject, Save Draft)
  // Preserves actual findings unless a rerun check occurred, and never fabricates 100% score.
  // Deduplicates decision logging so single user action produces exactly one audit record.
  const handleExecuteDecision = (targetStatus: ReviewStatus, actionName: 'Approve' | 'Request Changes' | 'Reject' | 'Save Draft') => {
    if (isSubmittingDecision) return;

    // Validate comment for Request Changes
    if (actionName === 'Request Changes' && !reviewerComment.trim()) {
      setCommentError('Please explain what needs to be corrected before requesting changes.');
      return;
    }

    setCommentError(null);
    setConfirmAction(null);

    const existingHistory = Array.isArray(review.decisionHistory) ? review.decisionHistory : [];
    const latestDecision = existingHistory[0];

    // Prevent duplicate events caused by repeated handler calls or saving the same decision twice
    if (
      latestDecision &&
      latestDecision.action === actionName &&
      latestDecision.newStatus === targetStatus &&
      (latestDecision.reviewerComment || '').trim() === reviewerComment.trim()
    ) {
      showToast('info', 'Decision Recorded', `"${actionName}" has already been applied.`);
      return;
    }

    setIsSubmittingDecision(true);

    const now = new Date().toISOString();
    const newDecisionRecord: ReviewDecisionRecord = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: actionName,
      reviewerName: 'Workspace Reviewer',
      reviewerComment: reviewerComment.trim() || undefined,
      timestamp: now,
      previousStatus: review.status,
      newStatus: targetStatus
    };

    // If no rerun occurred during this modal session, strictly preserve the last actual findings
    // and never replace them with an empty list merely because status changed.
    const activeFindings = hasRerunCheck
      ? findings
      : (Array.isArray(review.findings) ? review.findings : findings);

    const finalScore = calculateComplianceScore(activeFindings);

    const updatedReview: ReviewItem = {
      ...review,
      originalDraft:
        review.originalDraft && !isSummaryText(review.originalDraft)
          ? review.originalDraft
          : (originalDraftText !== 'Original draft unavailable' ? originalDraftText : ''),
      currentDraft: hasRerunCheck
        ? currentDraftText
        : (review.currentDraft && !isSummaryText(review.currentDraft) ? review.currentDraft : currentDraftText),
      findings: activeFindings,
      issuesCount: activeFindings.length,
      confidenceScore: finalScore,
      firstPassFindings: review.firstPassFindings,
      firstPassIssuesCount: review.firstPassIssuesCount,
      firstPassScore: review.firstPassScore,
      aiSuggestions: localAiSuggestions.length > 0 ? localAiSuggestions : undefined,
      aiAnalysisStatus: localAiStatus,
      aiAnalysisError: localAiError || undefined,
      status: targetStatus,
      reviewerComment: reviewerComment.trim() || undefined,
      decisionAt: now,
      updatedAt: 'Just now',
      decisionHistory: deduplicateDecisionHistory([newDecisionRecord, ...existingHistory])
    };

    onUpdateReview(updatedReview);
    showToast(
      'success',
      `Review ${actionName === 'Request Changes' ? 'Changes Requested' : actionName + 'd'}`,
      `Status updated to "${targetStatus}". Decision recorded in audit trail.`
    );

    setTimeout(() => {
      setIsSubmittingDecision(false);
    }, 400);
  };

  const getSeverityStyle = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return { bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.35)', color: '#F87171' };
      case 'High':
        return { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)', color: '#FBBF24' };
      case 'Medium':
      case 'Warning':
        return { bg: 'rgba(94, 158, 255, 0.15)', border: 'rgba(94, 158, 255, 0.35)', color: '#5E9EFF' };
      case 'Low':
      case 'Advisory':
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'var(--border-subtle)', color: 'var(--text-tertiary)' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(13, 16, 23, 0.96)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-glass)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--accent-lime-dim)',
                border: '1px solid var(--accent-lime-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileCheck size={18} color="var(--accent-lime)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {review.title}
                </h2>
                {(review.id === 'rev_spring_announcement_01' || review.id === 'rev_enterprise_overview_02') && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(214, 255, 112, 0.1)',
                      border: '1px solid var(--accent-lime-border)',
                      color: 'var(--accent-lime)'
                    }}
                  >
                    Sample Record
                  </span>
                )}
                <Badge status={review.status} size="sm" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Channel: <span style={{ color: 'var(--text-secondary)' }}>{review.channel}</span> · Author:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{review.author}</span> · Updated: {review.updatedAt}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Honest Transparency Notice Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(214, 255, 112, 0.04)',
              border: '1px solid var(--accent-lime-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.45
            }}
          >
            <Info size={16} color="var(--accent-lime)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--accent-lime)' }}>Deterministic Rule Compliance:</strong> Evaluated
              strictly against configured brand rules. A score of 100% or zero findings indicates adherence to defined rules;
              it does not substitute for human editorial judgment or universal truth verification.
            </div>
          </div>

          {/* Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px'
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CURRENT STATUS</div>
              <div style={{ marginTop: '4px' }}>
                <Badge status={review.status} size="sm" />
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>ACTIVE FINDINGS</div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: isDraftModified && !hasRerunCheck
                    ? '#FBBF24'
                    : (originalDraftText === 'Original draft unavailable' && findings.length === 0
                        ? '#FBBF24'
                        : (findings.length === 0 ? 'var(--accent-lime)' : '#FBBF24')),
                  marginTop: '2px'
                }}
              >
                {isDraftModified && !hasRerunCheck ? (
                  <span>Results out of date</span>
                ) : (
                  originalDraftText === 'Original draft unavailable' && findings.length === 0 ? (
                    <span>Check required</span>
                  ) : (
                    findings.length === 0 ? '0 issues' : `${findings.length} flagged`
                  )
                )}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                RULE COMPLIANCE
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: isDraftModified && !hasRerunCheck
                    ? '#FBBF24'
                    : (originalDraftText === 'Original draft unavailable' && findings.length === 0
                        ? 'var(--text-tertiary)'
                        : (currentScore >= 90 ? 'var(--accent-lime)' : '#FBBF24')),
                  marginTop: '2px'
                }}
              >
                {isDraftModified && !hasRerunCheck ? (
                  <span>Check required</span>
                ) : (
                  originalDraftText === 'Original draft unavailable' && findings.length === 0 ? (
                    <span>Check required</span>
                  ) : (
                    <span>{currentScore}% <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-tertiary)' }}>(Rule-Based)</span></span>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>RULES CHECKED</div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  marginTop: '2px'
                }}
              >
                {enabledRules.length} active
              </div>
            </div>
          </div>

          {/* Draft Comparison & Revision Section */}
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-medium)',
              padding: '18px'
            }}
          >
            {/* Draft Selector Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '14px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveDraftTab('revision')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: activeDraftTab === 'revision' ? 'var(--accent-lime-dim)' : 'transparent',
                    border: '1px solid',
                    borderColor: activeDraftTab === 'revision' ? 'var(--accent-lime-border)' : 'var(--border-subtle)',
                    color: activeDraftTab === 'revision' ? 'var(--accent-lime)' : 'var(--text-secondary)'
                  }}
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Revised Draft (Editable)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDraftTab('original')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: activeDraftTab === 'original' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: activeDraftTab === 'original' ? 'var(--border-highlight)' : 'var(--border-subtle)',
                    color: activeDraftTab === 'original' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <Lock size={12} style={{ display: 'inline', marginRight: '5px' }} />
                  Original Submitted Draft (Read-Only)
                </button>
              </div>

              {activeDraftTab === 'revision' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRerunCheck}
                    iconLeft={<RotateCcw size={13} />}
                  >
                    Rerun Rule Engine
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveRevision}
                    iconLeft={<Save size={13} />}
                  >
                    Save Revision
                  </Button>
                </div>
              )}
            </div>

            {/* Active Draft Content View */}
            {activeDraftTab === 'revision' ? (
              <div>
                <label
                  htmlFor="review-revised-draft-input"
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}
                >
                  Reviewer Draft Editor (Edits will not overwrite the original submitted draft):
                </label>
                <textarea
                  id="review-revised-draft-input"
                  rows={6}
                  value={currentDraftText}
                  onChange={(e) => {
                    setCurrentDraftText(e.target.value);
                    setHasRerunCheck(false);
                  }}
                  placeholder={
                    originalDraftText === 'Original draft unavailable'
                      ? 'Original draft unavailable. Enter revision copy here...'
                      : 'Edit draft content here...'
                  }
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  <span>{currentDraftText.trim().split(/\s+/).filter(Boolean).length} words · {currentDraftText.length} characters</span>
                  <span>{isDraftModified && !hasRerunCheck ? '⚠️ Draft modified — click "Rerun Rule Engine" to refresh findings.' : 'Click "Rerun Rule Engine" to refresh findings after editing.'}</span>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  <Lock size={12} />
                  <span>Immutable submitted snapshot preserved for legal audit compliance</span>
                </div>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    color: originalDraftText === 'Original draft unavailable' ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    fontStyle: originalDraftText === 'Original draft unavailable' ? 'italic' : 'normal',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {originalDraftText}
                </div>
              </div>
            )}
          </div>

          {/* Segmented Switcher: Policy Rule Findings vs AI Tone Suggestions */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              id="modal-tab-policy-findings"
              onClick={() => setActiveResultsSection('policy')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeResultsSection === 'policy' ? 'var(--accent-lime-dim)' : 'transparent',
                border: '1px solid',
                borderColor: activeResultsSection === 'policy' ? 'var(--accent-lime-border)' : 'transparent',
                color: activeResultsSection === 'policy' ? 'var(--accent-lime)' : 'var(--text-secondary)'
              }}
            >
              <ShieldCheck size={14} />
              <span>Policy Rule Findings ({findings.length})</span>
            </button>

            <button
              type="button"
              id="modal-tab-ai-tone"
              onClick={() => setActiveResultsSection('ai')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: activeResultsSection === 'ai' ? 'rgba(94, 158, 255, 0.12)' : 'transparent',
                border: '1px solid',
                borderColor: activeResultsSection === 'ai' ? 'rgba(94, 158, 255, 0.35)' : 'transparent',
                color: activeResultsSection === 'ai' ? '#5E9EFF' : 'var(--text-secondary)'
              }}
            >
              {localAiStatus === 'analyzing' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              <span>
                AI Tone Suggestions (
                {localAiStatus === 'analyzing'
                  ? '...'
                  : localAiStatus === 'completed'
                  ? localAiSuggestions.length
                  : localAiStatus === 'unavailable'
                  ? 'Unconfigured'
                  : localAiStatus === 'error'
                  ? 'Error'
                  : (localAiSuggestions.length > 0 ? localAiSuggestions.length : '0')}
                )
              </span>
            </button>
          </div>

          {/* Section 1: Deterministic Policy Rule Findings */}
          {activeResultsSection === 'policy' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Rule Findings ({findings.length})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Derived dynamically from saved brand rules
                </span>
              </div>

              {findings.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(52, 211, 153, 0.05)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <CheckCircle2 size={20} color="#34D399" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      No Rule Violations Detected
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      The current draft satisfies all {enabledRules.length} active brand rules. (Human review sign-off is still required).
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {findings.map((finding) => {
                    // Derive category & severity directly from exact saved rule ID
                    const meta = getFindingRuleMetadata(finding, rules);
                    const sevStyle = getSeverityStyle(meta.severity);
                    const isApplied = appliedCorrectionFindingIds.has(finding.id);
                    const currentCorrection =
                      editedCorrections[finding.id] !== undefined
                        ? editedCorrections[finding.id]
                        : finding.suggestedCorrection || '';

                    return (
                      <div
                        key={finding.id}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: isApplied
                            ? '1px solid rgba(52, 211, 153, 0.4)'
                            : '1px solid var(--border-medium)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        {/* Finding Meta Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: sevStyle.bg,
                                border: `1px solid ${sevStyle.border}`,
                                color: sevStyle.color
                              }}
                            >
                              {meta.severity.toUpperCase()}
                            </span>

                            {meta.isRuleAvailable ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                {meta.category}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: 'rgba(248, 113, 113, 0.1)',
                                  border: '1px solid rgba(248, 113, 113, 0.3)',
                                  color: '#FCA5A5'
                                }}
                              >
                                Rule Unavailable (Deleted or Unregistered)
                              </span>
                            )}
                          </div>

                          {finding.location && (
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                              Line {finding.location.line}
                            </span>
                          )}
                        </div>

                        {/* Flagged text */}
                        {finding.matchedText && (
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Flagged text: </span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#FCD34D',
                                background: 'rgba(251, 191, 36, 0.12)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              &quot;{finding.matchedText}&quot;
                            </span>
                          </div>
                        )}

                        {/* Rule Attribution */}
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          Triggered by:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>{meta.ruleTitle}</strong>{' '}
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>(Rule ID: {finding.ruleId})</span>
                          <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{finding.explanation}</div>
                        </div>

                        {/* Source Citation */}
                        {(meta.sourceDescription || finding.sourceDescription) && (
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Policy Citation: {meta.sourceDescription || finding.sourceDescription}</span>
                            {(meta.sourceUrl || finding.sourceUrl) && (
                              <a
                                href={meta.sourceUrl || finding.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent-lime)', display: 'inline-flex' }}
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Suggested Correction Box */}
                        {(finding.suggestedCorrection || currentCorrection) && (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label
                                htmlFor={`detail-correction-${finding.id}`}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--accent-lime)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit3 size={11} /> Suggested Correction (Editable):
                              </label>
                              {isApplied && (
                                <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Check size={12} /> Applied to Draft
                                </span>
                              )}
                            </div>

                            <input
                              id={`detail-correction-${finding.id}`}
                              type="text"
                              value={currentCorrection}
                              onChange={(e) =>
                                setEditedCorrections((prev) => ({
                                  ...prev,
                                  [finding.id]: e.target.value
                                }))
                              }
                              placeholder="Enter replacement phrasing..."
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-xs)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-primary)',
                                fontSize: '12px'
                              }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                              <Button
                                variant={isApplied ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={() => handleApplyCorrectionToDraft(finding)}
                                iconLeft={isApplied ? <Check size={12} /> : <Sparkles size={12} />}
                              >
                                {isApplied ? 'Re-apply to Draft' : 'Apply to Revised Draft'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section 2: AI Tone & Context Suggestions */}
          {activeResultsSection === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  AI Tone &amp; Context Suggestions ({localAiSuggestions.length})
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRerunAiTone}
                  iconLeft={localAiStatus === 'analyzing' ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                >
                  {localAiStatus === 'analyzing' ? 'Analyzing...' : 'Rerun AI Tone Review'}
                </Button>
              </div>

              {/* Advisory Disclaimer Banner */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(94, 158, 255, 0.06)',
                  border: '1px solid rgba(94, 158, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45
                }}
              >
                <Bot size={16} color="#5E9EFF" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#5E9EFF' }}>Advisory Tone Analysis:</strong> AI suggestions review brand persona, voice, and contextual messaging. AI suggestions are optional recommendations and do NOT affect deterministic rule compliance scores.
                </div>
              </div>

              {/* State: Analyzing */}
              {localAiStatus === 'analyzing' && (
                <div
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Loader2 size={26} color="#5E9EFF" className="animate-spin" />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Evaluating Voice &amp; Tone on Revised Draft...
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Auditing draft copy for formality, brand persona, and channel messaging nuances.
                  </p>
                </div>
              )}

              {/* State: Unavailable */}
              {localAiStatus === 'unavailable' && (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(251, 191, 36, 0.04)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#FBBF24" />
                    <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                      AI Provider Credentials Missing
                    </strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    {localAiError || 'AI tone review is unavailable because no server credentials (OPENAI_API_KEY or GEMINI_API_KEY) are configured.'}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    To enable genuine tone analysis, configure an API key on the backend. Deterministic policy rules remain fully operational.
                  </div>
                </div>
              )}

              {/* State: Error */}
              {localAiStatus === 'error' && (
                <div
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(248, 113, 113, 0.05)',
                    border: '1px solid rgba(248, 113, 113, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#F87171" />
                    <strong style={{ color: '#FCA5A5', fontSize: '14px' }}>AI Tone Review Error</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    {localAiError || 'Failed to complete AI tone review.'}
                  </p>
                  <div>
                    <Button variant="secondary" size="sm" onClick={handleRerunAiTone} iconLeft={<RefreshCw size={12} />}>
                      Retry AI Review
                    </Button>
                  </div>
                </div>
              )}

              {/* State: Idle / No AI Check Saved */}
              {localAiStatus === 'idle' && localAiSuggestions.length === 0 && (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                  }}
                >
                  <Bot size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    No AI Tone Review Recorded
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
                    Click below to run a tone and messaging audit against your brand guidelines.
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleRerunAiTone} iconLeft={<Sparkles size={13} />}>
                    Run AI Tone Review Now
                  </Button>
                </div>
              )}

              {/* State: Completed with 0 Suggestions */}
              {localAiStatus === 'completed' && localAiSuggestions.length === 0 && (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(52, 211, 153, 0.04)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    textAlign: 'center'
                  }}
                >
                  <CheckCircle2 size={26} color="#34D399" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Draft Tone &amp; Voice Aligned
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    No tone or messaging mismatches were flagged for this draft.
                  </div>
                </div>
              )}

              {/* List of Suggestions */}
              {localAiSuggestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {localAiSuggestions.map((suggestion) => {
                    const isApplied = appliedAiIds.has(suggestion.id);
                    const currentAlt =
                      editedAiAlternatives[suggestion.id] !== undefined
                        ? editedAiAlternatives[suggestion.id]
                        : suggestion.suggestedAlternative || '';

                    return (
                      <div
                        key={suggestion.id}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-md)',
                          background: isApplied ? 'rgba(52, 211, 153, 0.02)' : 'rgba(94, 158, 255, 0.02)',
                          border: isApplied
                            ? '1px solid rgba(52, 211, 153, 0.4)'
                            : '1px solid rgba(94, 158, 255, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(94, 158, 255, 0.15)',
                                border: '1px solid rgba(94, 158, 255, 0.35)',
                                color: '#5E9EFF'
                              }}
                            >
                              AI TONE / CONTEXT
                            </span>

                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {suggestion.toneCategory}
                            </span>

                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-tertiary)'
                              }}
                            >
                              {suggestion.confidence} Confidence
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: suggestion.severity === 'High' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: suggestion.severity === 'High' ? '#FBBF24' : 'var(--text-tertiary)'
                            }}
                          >
                            {suggestion.severity.toUpperCase()}
                          </span>
                        </div>

                        {/* Quoted Text */}
                        {suggestion.quotedText && (
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Identified phrasing: </span>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#93C5FD',
                                background: 'rgba(94, 158, 255, 0.1)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              &quot;{suggestion.quotedText}&quot;
                            </span>
                          </div>
                        )}

                        {/* Explanation */}
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                          {suggestion.explanation}
                        </p>

                        {/* Policy Evidence Attribution */}
                        <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {suggestion.hasVerifiedPolicyEvidence ? (
                            <span style={{ color: 'var(--accent-lime)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Check size={12} /> {suggestion.citationLabel}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontStyle: 'italic' }}>
                              <Info size={12} /> {suggestion.citationLabel}
                            </span>
                          )}
                        </div>

                        {/* Editable Suggestion Input */}
                        {currentAlt && (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label
                                htmlFor={`detail-ai-alt-${suggestion.id}`}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#93C5FD',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit3 size={11} /> Suggested Alternative (Editable):
                              </label>
                              {isApplied && (
                                <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Check size={12} /> Applied to Revised Draft
                                </span>
                              )}
                            </div>

                            <input
                              id={`detail-ai-alt-${suggestion.id}`}
                              type="text"
                              value={currentAlt}
                              onChange={(e) =>
                                setEditedAiAlternatives((prev) => ({
                                  ...prev,
                                  [suggestion.id]: e.target.value
                                }))
                              }
                              placeholder="Enter alternative phrasing..."
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-xs)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-primary)',
                                fontSize: '12px'
                              }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                              <Button
                                variant={isApplied ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={() => handleApplyAiSuggestionToDraft(suggestion)}
                                iconLeft={isApplied ? <Check size={12} /> : <Sparkles size={12} />}
                              >
                                {isApplied ? 'Re-apply to Revised Draft' : 'Apply to Revised Draft'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Decision Comments Input Box */}
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: commentError ? '1px solid #F87171' : '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <label
              htmlFor="review-decision-comment-input"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}
            >
              Reviewer Decision Comments &amp; Correction Instructions:
            </label>
            <textarea
              id="review-decision-comment-input"
              rows={3}
              placeholder="Provide comments explaining your review decision, guidance for the content author, or required changes..."
              value={reviewerComment}
              onChange={(e) => {
                setReviewerComment(e.target.value);
                if (commentError) setCommentError(null);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
            />
            {commentError && (
              <div style={{ fontSize: '12px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} />
                <span>{commentError}</span>
              </div>
            )}
          </div>

          {/* Decision Confirmation Modal Overlay if pending */}
          {confirmAction && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: confirmAction === 'Approve' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: confirmAction === 'Approve' ? '1px solid #34D399' : '1px solid #F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <strong style={{ color: confirmAction === 'Approve' ? '#34D399' : '#FCA5A5' }}>
                  Confirm Content {confirmAction}:
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {confirmAction === 'Approve'
                    ? 'Confirm editorial sign-off for publication. Approval records a human governance decision against configured brand rules and does not imply universal factual verification.'
                    : 'Are you sure you want to mark this review as Rejected? This decision will be permanently logged in the audit trail.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => setConfirmAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant={confirmAction === 'Approve' ? 'primary' : 'secondary'}
                  size="sm"
                  style={
                    confirmAction === 'Reject'
                      ? { background: 'rgba(248, 113, 113, 0.2)', borderColor: '#F87171', color: '#FCA5A5' }
                      : undefined
                  }
                  onClick={() =>
                    handleExecuteDecision(
                      confirmAction === 'Approve' ? 'Approved' : 'Rejected',
                      confirmAction
                    )
                  }
                >
                  Yes, Confirm {confirmAction}
                </Button>
              </div>
            </div>
          )}

          {/* Human Review Decision Buttons */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExecuteDecision('Draft', 'Save Draft')}
                iconLeft={<Save size={14} />}
              >
                Keep Pending / Save Draft
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Request Changes Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExecuteDecision('Changes Requested', 'Request Changes')}
                style={{ borderColor: 'rgba(251, 146, 60, 0.4)', color: '#FDBA74' }}
                iconLeft={<RotateCcw size={14} />}
                id="review-request-changes-btn"
              >
                Request Changes
              </Button>

              {/* Reject Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmAction('Reject')}
                style={{ borderColor: 'rgba(248, 113, 113, 0.4)', color: '#FCA5A5' }}
                iconLeft={<X size={14} />}
                id="review-reject-btn"
              >
                Reject
              </Button>

              {/* Approve Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmAction('Approve')}
                iconLeft={<CheckCircle2 size={14} />}
                id="review-approve-btn"
              >
                Approve
              </Button>
            </div>
          </div>

          {/* Decision History & Audit Trail */}
          {review.decisionHistory && review.decisionHistory.length > 0 && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <History size={14} color="var(--accent-lime)" />
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Audit Trail &amp; Decision History ({review.decisionHistory.length})
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {review.decisionHistory.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{rec.action}</strong>
                        <span style={{ color: 'var(--text-tertiary)' }}>by {rec.reviewerName}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>
                          ({rec.previousStatus} → <span style={{ color: 'var(--accent-lime)' }}>{rec.newStatus}</span>)
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {new Date(rec.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {rec.reviewerComment && (
                      <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                        &quot;{rec.reviewerComment}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
