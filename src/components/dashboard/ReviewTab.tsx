import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Send,
  RotateCcw,
  Info,
  ChevronDown,
  ShieldCheck,
  BookOpen,
  Save,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Sparkles,
  Bot,
  RefreshCw,
  Loader2,
  Eye
} from 'lucide-react';
import { SAMPLE_DRAFTS } from '../../data/demoData';
import { useBrand } from '../../context/useBrand';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { evaluateDraft, getFindingRuleMetadata, type ReviewEngineResult, type ReviewFinding } from '../../services/ruleEngine';
import { aiToneService, applyTextReplacement } from '../../services/aiToneService';
import { useAuth } from '../../context/useAuth';
import { ImageUploadZone } from '../review/ImageUploadZone';
import { VisualFindingsCard } from '../review/VisualFindingsCard';
import {
  multimodalService,
  generateThumbnail,
  prepareImageForAnalysis
} from '../../services/multimodalReview';
import type {
  DashboardTab,
  AiToneSuggestion,
  AiAnalysisStatus,
  ImageAsset,
  VisualAnalysisFinding,
  VisualAnalysisStatus
} from '../../types';

interface ReviewTabProps {
  onNavigateTab?: (tab: DashboardTab) => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({ onNavigateTab }) => {
  const {
    brandProfile,
    rules,
    saveReview,
    markReviewedContent,
    markUnderstoodResults,
    showToast
  } = useBrand();
  const { currentUser, can } = useAuth();

  const [draftTitle, setDraftTitle] = useState('');
  const [channel, setChannel] = useState('Press Release');
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Immutable original submitted draft & first-pass baseline
  const [originalSubmittedDraft, setOriginalSubmittedDraft] = useState<string>('');
  const [firstPassResult, setFirstPassResult] = useState<ReviewEngineResult | null>(null);

  // Review Engine State
  const [reviewResult, setReviewResult] = useState<ReviewEngineResult | null>(null);
  const [savedToHistory, setSavedToHistory] = useState<boolean>(false);
  const [resultsGuideOpen, setResultsGuideOpen] = useState(false);

  // Editable suggestions state: finding.id -> user edited replacement string
  const [editedCorrections, setEditedCorrections] = useState<Record<string, string>>({});
  const [appliedFindingIds, setAppliedFindingIds] = useState<Set<string>>(new Set());

  // AI Tone Analysis State
  const [enableAiTone, setEnableAiTone] = useState<boolean>(true);
  const [aiStatus, setAiStatus] = useState<AiAnalysisStatus>('idle');
  const [aiSuggestions, setAiSuggestions] = useState<AiToneSuggestion[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | undefined>(undefined);
  const [editedAiCorrections, setEditedAiCorrections] = useState<Record<string, string>>({});
  const [appliedAiIds, setAppliedAiIds] = useState<Set<string>>(new Set());

  // Multimodal Creative Compliance State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageAltText, setImageAltText] = useState<string>('');
  const [visualStatus, setVisualStatus] = useState<VisualAnalysisStatus>('idle');
  const [visualFindings, setVisualFindings] = useState<VisualAnalysisFinding[]>([]);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [visualProvider, setVisualProvider] = useState<string | undefined>(undefined);
  const [visualModel, setVisualModel] = useState<string | undefined>(undefined);
  const [activeResultsTab, setActiveResultsTab] = useState<'policy' | 'ai' | 'visual'>('policy');

  // Character and word count
  const charCount = content.length;
  const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;

  const enabledRules = rules.filter(
    (r) => (r.enabled !== undefined ? r.enabled : r.isActive ?? true)
  );
  const enabledRulesCount = enabledRules.length;
  const activeBrandName = brandProfile?.name || 'Default Workspace';

  const handleSelectImage = (file: File) => {
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setVisualStatus('idle');
    setVisualFindings([]);
    setVisualError(null);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageAltText('');
    setVisualStatus('idle');
    setVisualFindings([]);
    setVisualError(null);
    if (activeResultsTab === 'visual') {
      setActiveResultsTab('policy');
    }
  };

  const handleRetryVisual = () => {
    if (!selectedImageFile) return;
    setVisualStatus('analyzing');
    setVisualError(null);

    prepareImageForAnalysis(selectedImageFile)
      .then(async ({ base64, mimeType, fileSizeBytes }) => {
        const visRes = await multimodalService.requestVisualReview({
          imageBase64: base64,
          mimeType,
          fileName: selectedImageFile.name,
          fileSizeBytes,
          altText: imageAltText,
          brandProfile,
          brandRules: enabledRules,
          channel
        });

        setVisualStatus(visRes.status);
        setVisualFindings(visRes.visualFindings);
        setVisualProvider(visRes.provider);
        setVisualModel(visRes.model);
        if (visRes.status === 'error') {
          setVisualError(visRes.error || 'Visual creative analysis encountered an error.');
        }
      })
      .catch((err: any) => {
        setVisualStatus('error');
        setVisualError(err?.message || 'Failed to read image file.');
      });
  };

  const handleLoadSample = (type: 'unverified' | 'compliant') => {
    const sample = SAMPLE_DRAFTS[type];
    setDraftTitle(sample.title);
    setChannel(sample.channel);
    setContent(sample.text);
    setOriginalSubmittedDraft('');
    setFirstPassResult(null);
    setValidationError(null);
    setReviewResult(null);
    setSavedToHistory(false);
    setAppliedFindingIds(new Set());
    setEditedCorrections({});
    setAiStatus('idle');
    setAiSuggestions([]);
    setAiError(null);
    setAppliedAiIds(new Set());
    setEditedAiCorrections({});
    setActiveResultsTab('policy');
    handleRemoveImage();
  };

  const handleClear = () => {
    setDraftTitle('');
    setContent('');
    setOriginalSubmittedDraft('');
    setFirstPassResult(null);
    setValidationError(null);
    setReviewResult(null);
    setSavedToHistory(false);
    setAppliedFindingIds(new Set());
    setEditedCorrections({});
    setAiStatus('idle');
    setAiSuggestions([]);
    setAiError(null);
    setAppliedAiIds(new Set());
    setEditedAiCorrections({});
    setActiveResultsTab('policy');
    handleRemoveImage();
  };

  const handleRunContentCheck = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) {
      setValidationError('Please enter or paste your draft content to initiate a review.');
      return;
    }
    if (content.trim().length < 25) {
      setValidationError('Draft content must be at least 25 characters for meaningful brand rule checking.');
      return;
    }

    setValidationError(null);
    setSavedToHistory(false);

    // Run the actual deterministic rule engine against current enabled rules
    const result = evaluateDraft(content, enabledRules, {
      brandProfile,
      campaignTitle: draftTitle
    });

    setReviewResult(result);
    setAppliedFindingIds(new Set());

    // Record immutable first-pass baseline on initial check of a draft
    if (!originalSubmittedDraft) {
      setOriginalSubmittedDraft(content);
      setFirstPassResult(result);
    }

    // Initialize editable corrections from finding suggestions
    const initialCorrections: Record<string, string> = {};
    for (const f of result.findings) {
      if (f.suggestedCorrection) {
        initialCorrections[f.id] = f.suggestedCorrection;
      }
    }
    setEditedCorrections(initialCorrections);

    // Run genuine AI Tone Review if enabled (separate advisory stream)
    if (enableAiTone) {
      setAiStatus('analyzing');
      setAiError(null);
      setAiSuggestions([]);
      setAppliedAiIds(new Set());

      aiToneService
        .requestToneReview({
          content,
          brandProfile,
          brandRules: enabledRules,
          channel
        })
        .then((aiRes) => {
          setAiStatus(aiRes.status);
          if (aiRes.status === 'completed') {
            setAiSuggestions(aiRes.suggestions);
            setAiProvider(aiRes.provider);
            const initAlts: Record<string, string> = {};
            for (const s of aiRes.suggestions) {
              if (s.suggestedAlternative) {
                initAlts[s.id] = s.suggestedAlternative;
              }
            }
            setEditedAiCorrections(initAlts);
          } else if (aiRes.status === 'unavailable') {
            setAiSuggestions([]);
            setAiError(aiRes.error || 'AI provider credentials missing.');
          } else {
            setAiSuggestions([]);
            setAiError(aiRes.error || 'Server error occurred during AI tone analysis.');
          }
        })
        .catch((err: any) => {
          setAiStatus('error');
          setAiSuggestions([]);
          setAiError(err?.message || 'Failed to request AI tone review.');
        });
    } else {
      setAiStatus('idle');
      setAiSuggestions([]);
      setAiError(null);
    }

    // Run multimodal creative analysis if an image is attached
    if (selectedImageFile) {
      setVisualStatus('analyzing');
      setVisualError(null);
      setVisualFindings([]);

      prepareImageForAnalysis(selectedImageFile)
        .then(async ({ base64, mimeType, fileSizeBytes }) => {
          const visRes = await multimodalService.requestVisualReview({
            imageBase64: base64,
            mimeType,
            fileName: selectedImageFile.name,
            fileSizeBytes,
            altText: imageAltText,
            brandProfile,
            brandRules: enabledRules,
            channel
          });

          setVisualStatus(visRes.status);
          setVisualFindings(visRes.visualFindings);
          setVisualProvider(visRes.provider);
          setVisualModel(visRes.model);
          if (visRes.status === 'error') {
            setVisualError(visRes.error || 'Visual creative analysis encountered an error.');
          }
        })
        .catch((err: any) => {
          setVisualStatus('error');
          setVisualError(err?.message || 'Failed to read image file.');
        });
    } else {
      setVisualStatus('idle');
      setVisualFindings([]);
      setVisualError(null);
    }

    // Mark onboarding step 3 complete
    markReviewedContent();
  };

  const handleRetryAiTone = () => {
    if (!content.trim()) return;
    setAiStatus('analyzing');
    setAiError(null);
    aiToneService
      .requestToneReview({
        content,
        brandProfile,
        brandRules: enabledRules,
        channel
      })
      .then((aiRes) => {
        setAiStatus(aiRes.status);
        if (aiRes.status === 'completed') {
          setAiSuggestions(aiRes.suggestions);
          setAiProvider(aiRes.provider);
          const initAlts: Record<string, string> = {};
          for (const s of aiRes.suggestions) {
            if (s.suggestedAlternative) {
              initAlts[s.id] = s.suggestedAlternative;
            }
          }
          setEditedAiCorrections(initAlts);
        } else if (aiRes.status === 'unavailable') {
          setAiSuggestions([]);
          setAiError(aiRes.error || 'AI provider credentials missing.');
        } else {
          setAiSuggestions([]);
          setAiError(aiRes.error || 'Server error occurred during AI tone analysis.');
        }
      })
      .catch((err: any) => {
        setAiStatus('error');
        setAiSuggestions([]);
        setAiError(err?.message || 'Failed to request AI tone review.');
      });
  };

  const handleApplyCorrection = (finding: ReviewFinding) => {
    const replacement =
      editedCorrections[finding.id] !== undefined
        ? editedCorrections[finding.id]
        : finding.suggestedCorrection || '';

    if (!replacement.trim()) {
      showToast('error', 'Empty Correction', 'The suggested correction text is empty.');
      return;
    }

    const replaceResult = applyTextReplacement(content, finding.matchedText, replacement);
    if (replaceResult.success) {
      setContent(replaceResult.newText);
      setAppliedFindingIds((prev) => new Set(prev).add(finding.id));
      setSavedToHistory(false);
      showToast(
        'success',
        'Correction Applied to Draft',
        `Replaced "${replaceResult.originalReplacedText || finding.matchedText}" with "${replacement}".`
      );
    } else {
      setContent((prev) => `${prev} ${replacement}`);
      setAppliedFindingIds((prev) => new Set(prev).add(finding.id));
      setSavedToHistory(false);
      showToast('success', 'Term Inserted into Draft', `Added "${replacement}".`);
    }
  };

  const handleApplyAiSuggestion = (suggestion: AiToneSuggestion) => {
    const replacement =
      editedAiCorrections[suggestion.id] !== undefined
        ? editedAiCorrections[suggestion.id]
        : suggestion.suggestedAlternative || '';

    if (!replacement.trim()) {
      showToast('error', 'Empty Suggestion', 'The suggested alternative text is empty.');
      return;
    }

    const replaceResult = applyTextReplacement(content, suggestion.quotedText, replacement);
    if (replaceResult.success) {
      setContent(replaceResult.newText);
      setAppliedAiIds((prev) => new Set(prev).add(suggestion.id));
      setSavedToHistory(false);
      showToast(
        'success',
        'AI Suggestion Applied to Draft',
        replaceResult.originalReplacedText
          ? `Replaced "${replaceResult.originalReplacedText}" with suggestion.`
          : 'Draft updated with suggested wording.'
      );
    } else {
      // Graceful whole-draft replacement when direct substring match is not found
      setContent(replacement);
      setAppliedAiIds((prev) => new Set(prev).add(suggestion.id));
      setSavedToHistory(false);
      showToast('success', 'AI Suggestion Applied to Draft', 'Draft updated with suggested wording.');
    }
  };

  const handleSaveToPastReviews = async () => {
    if (!content.trim()) return;

    const title = draftTitle.trim() || `Draft Check - ${channel}`;

    // Fresh deterministic evaluation to guarantee saved findings strictly reflect current draft and enabled rules
    const currentEvaluation = evaluateDraft(content, enabledRules, {
      brandProfile,
      campaignTitle: title
    });

    setReviewResult(currentEvaluation);

    // Initial status requires editorial review; never automatically approved
    const initialStatus = 'Needs review';
    const originalDraftText = originalSubmittedDraft || content;
    const initialScore = firstPassResult ? firstPassResult.score : currentEvaluation.score;
    const initialIssuesCount = firstPassResult ? firstPassResult.findings.length : currentEvaluation.findings.length;
    const initialFindings = firstPassResult ? firstPassResult.findings : currentEvaluation.findings;

    let thumbnailDataUrl: string | undefined;
    if (selectedImageFile) {
      try {
        thumbnailDataUrl = await generateThumbnail(selectedImageFile, 120);
      } catch {
        // Thumbnail generation fallback
      }
    }

    const imageAsset: ImageAsset | undefined = selectedImageFile
      ? {
          id: `img_${Date.now()}`,
          fileName: selectedImageFile.name,
          fileType: selectedImageFile.type,
          fileSize: selectedImageFile.size,
          altText: imageAltText.trim() || undefined,
          thumbnailDataUrl
        }
      : undefined;

    const saved = saveReview({
      title,
      author: currentUser.name,
      channel,
      status: initialStatus,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      issuesCount: currentEvaluation.findings.length,
      confidenceScore: currentEvaluation.score,
      summary: currentEvaluation.summaryText,
      originalDraft: originalDraftText,
      currentDraft: content,
      findings: currentEvaluation.findings,
      firstPassFindings: initialFindings,
      firstPassIssuesCount: initialIssuesCount,
      firstPassScore: initialScore,
      rulesCheckedCount: currentEvaluation.checkedRulesCount,
      imageAsset,
      visualFindings: visualFindings.length > 0 ? visualFindings : undefined,
      visualAnalysisStatus: visualStatus,
      visualAnalysisError: visualError || undefined,
      visualProvider,
      visualModel,
      revisions:
        content !== originalDraftText
          ? [
              {
                id: `rev_${Date.now()}`,
                revisionNumber: 1,
                text: content,
                editedAt: new Date().toISOString(),
                findingsCount: currentEvaluation.findings.length,
                score: currentEvaluation.score
              }
            ]
          : [],
      aiSuggestions: aiSuggestions.length > 0 ? aiSuggestions : undefined,
      aiAnalysisStatus: aiStatus,
      aiAnalysisError: aiError || undefined,
      decisionHistory: [
        {
          id: `dec_${Date.now()}`,
          action: 'Save Draft',
          reviewerName: currentUser.name,
          reviewerComment: currentEvaluation.isCompliant
            ? 'Deterministic check passed (0 rule violations). Awaiting human review sign-off.'
            : `Flagged ${currentEvaluation.findings.length} rule violation(s) requiring human editorial review.`,
          timestamp: new Date().toISOString(),
          previousStatus: 'Draft',
          newStatus: initialStatus
        }
      ]
    });

    if (saved) {
      setSavedToHistory(true);
    }
  };

  const handleOpenResultsGuide = () => {
    setResultsGuideOpen(true);
    markUnderstoodResults();
  };

  const getSeverityBadgeStyle = (severity: string) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header with requested title and description */}
      <div>
        <div className="glass-pill glass-pill-accent" style={{ marginBottom: '10px' }}>
          <span>PRE-PUBLICATION VERIFICATION</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(24px, 3.5vw, 30px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}
        >
          Check Content
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5 }}>
          Check drafts against your saved brand rules before publication.
        </p>
      </div>

      {/* Honest Transparency Notice Banner */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(214, 255, 112, 0.05)',
          border: '1px solid var(--accent-lime-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Info size={18} color="var(--accent-lime)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--accent-lime)' }}>Deterministic Rule-Based Review:</strong> Draft evaluations are performed deterministically against your saved, enabled brand rules. No black-box AI fabrication or universal claims of factual truth occur.
        </div>
      </div>

      {/* Section Explanations Before User Enters Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Card 1: What content they can submit */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-lime)',
                background: 'var(--accent-lime-dim)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              INPUTS
            </span>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              What content you can submit
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            Submit any pre-publication draft copy including press releases, landing page copy, executive social posts, customer newsletters, or paid ad copy (minimum 25 characters).
          </p>
        </div>

        {/* Card 2: Which saved brand rules will be used */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-lime)',
                background: 'var(--accent-lime-dim)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              GOVERNANCE
            </span>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Which brand rules will be used
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            Active Brand: <strong style={{ color: 'var(--text-primary)' }}>{activeBrandName}</strong>. Evaluates drafts exclusively against your{' '}
            <strong style={{ color: 'var(--accent-lime)' }}>{enabledRulesCount} active rule{enabledRulesCount === 1 ? '' : 's'}</strong> ({rules.length} total saved).
          </p>
          {enabledRulesCount === 0 && onNavigateTab && (
            <div style={{ marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('guidelines')}
                style={{
                  fontSize: '12px',
                  color: 'var(--accent-amber)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                ⚠️ 0 rules enabled. Click here to add or activate Brand Rules.
              </button>
            </div>
          )}
        </div>

        {/* Card 3: What the results will contain */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-lime)',
                background: 'var(--accent-lime-dim)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              OUTPUTS
            </span>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              What the results will contain
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            Results display evidence-linked findings citing the exact rule ID and title, matched text, rule category, line position, and editable suggested corrections.
          </p>
        </div>
      </div>

      {/* Main Review Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Draft Input Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <form onSubmit={handleRunContentCheck}>
            {/* Quick Sample Ingest Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                Populate form with sample drafts:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleLoadSample('unverified')}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    color: '#FCD34D',
                    cursor: 'pointer'
                  }}
                >
                  Load Sample with Superlative
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('compliant')}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'rgba(214, 255, 112, 0.08)',
                    border: '1px solid var(--accent-lime-border)',
                    color: 'var(--accent-lime)',
                    cursor: 'pointer'
                  }}
                >
                  Load Compliant Sample
                </button>
                {content && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear form"
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Document Title Input */}
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="draft-title"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                Campaign / Release Title
              </label>
              <input
                id="draft-title"
                type="text"
                placeholder="e.g. Q3 Global Product Refresh Announcement"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Target Channel and Actual Brand Profile Selector */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '18px'
              }}
            >
              <div>
                <label
                  htmlFor="channel-select"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  Publication Channel
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="channel-select"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Press Release">Press Release / Newsroom</option>
                    <option value="Product Landing Page">Product Landing Page</option>
                    <option value="Executive Social">Executive Social (LinkedIn/X)</option>
                    <option value="Customer Newsletter">Customer Newsletter</option>
                    <option value="Paid Ad Copy">Paid Ad Copy</option>
                  </select>
                  <ChevronDown
                    size={14}
                    color="var(--text-tertiary)"
                    style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  Active Governing Rules
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeBrandName}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent-lime)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {enabledRulesCount} active
                  </span>
                </div>
              </div>
            </div>

            {/* Textarea for Draft Content */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}
              >
                <label
                  htmlFor="draft-content"
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Draft Content <span style={{ color: 'var(--accent-lime)' }}>*</span>
                </label>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  {wordCount} words · {charCount} chars
                </span>
              </div>

              <textarea
                id="draft-content"
                rows={8}
                placeholder="Paste or type copy here (minimum 25 characters)..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: validationError ? '1px solid #F87171' : '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Validation Feedback */}
            {validationError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  color: '#FFA3A3',
                  fontSize: '13px',
                  marginBottom: '18px'
                }}
              >
                <AlertCircle size={16} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Multimodal Creative Asset Upload Zone */}
            <div style={{ marginBottom: '18px' }}>
              <ImageUploadZone
                onFileSelect={handleSelectImage}
                onFileRemove={handleRemoveImage}
                selectedFile={selectedImageFile}
                previewUrl={imagePreviewUrl}
                altText={imageAltText}
                onAltTextChange={setImageAltText}
              />
            </div>

            {/* AI Tone & Context Review Toggle */}
            <div
              style={{
                marginBottom: '18px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <label
                htmlFor="enable-ai-tone-toggle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  userSelect: 'none'
                }}
              >
                <input
                  id="enable-ai-tone-toggle"
                  type="checkbox"
                  checked={enableAiTone}
                  onChange={(e) => setEnableAiTone(e.target.checked)}
                  style={{ accentColor: 'var(--accent-lime)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>
                  <strong>Include AI Voice &amp; Tone Analysis:</strong> Contextual brand voice &amp; messaging audit
                </span>
              </label>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(94, 158, 255, 0.12)',
                  border: '1px solid rgba(94, 158, 255, 0.3)',
                  color: '#5E9EFF',
                  flexShrink: 0
                }}
              >
                ADVISORY
              </span>
            </div>

            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Checking: <strong style={{ color: 'var(--text-secondary)' }}>{enabledRulesCount} active rules</strong>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                iconRight={<Send size={15} />}
                id="submit-draft-review-btn"
              >
                Run Content Check
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Actual Rule Engine Findings & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviewResult ? (
            /* Results Panel */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Outcome Header Banner */}
              <div
                className="glass-panel"
                style={{
                  padding: '20px 24px',
                  background: reviewResult.isCompliant
                    ? 'rgba(52, 211, 153, 0.08)'
                    : 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid',
                  borderColor: reviewResult.isCompliant
                    ? 'rgba(52, 211, 153, 0.35)'
                    : 'rgba(251, 191, 36, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {reviewResult.isCompliant ? (
                      <CheckCircle2 size={22} color="#34D399" />
                    ) : (
                      <AlertTriangle size={22} color="#FBBF24" />
                    )}
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {reviewResult.isCompliant
                          ? 'Policy Compliant — 0 Rule Violations'
                          : `${reviewResult.findings.length} Finding${reviewResult.findings.length === 1 ? '' : 's'} Detected`}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Checked against {reviewResult.checkedRulesCount} active saved brand rule{reviewResult.checkedRulesCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-full)',
                      background: reviewResult.isCompliant ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid',
                      borderColor: reviewResult.isCompliant ? '#34D399' : '#FBBF24',
                      color: reviewResult.isCompliant ? '#34D399' : '#FBBF24'
                    }}
                  >
                    Score: {reviewResult.score}%
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {reviewResult.summaryText}
                </p>

                {/* Transparency notice */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.4
                  }}
                >
                  ✦ Deterministic verification evaluated your draft against currently saved rules. {reviewResult.isCompliant ? 'No findings does not guarantee universal factual accuracy.' : 'Review suggested edits below before publishing.'}
                </div>
              </div>

              {/* Segmented Switcher: Deterministic Policy Rules vs AI Tone & Context */}
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
                  id="tab-policy-findings-btn"
                  onClick={() => setActiveResultsTab('policy')}
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
                    background: activeResultsTab === 'policy' ? 'var(--accent-lime-dim)' : 'transparent',
                    border: '1px solid',
                    borderColor: activeResultsTab === 'policy' ? 'var(--accent-lime-border)' : 'transparent',
                    color: activeResultsTab === 'policy' ? 'var(--accent-lime)' : 'var(--text-secondary)'
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Policy Violations ({reviewResult.findings.length})</span>
                </button>

                <button
                  type="button"
                  id="tab-ai-tone-btn"
                  onClick={() => setActiveResultsTab('ai')}
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
                    background: activeResultsTab === 'ai' ? 'rgba(94, 158, 255, 0.12)' : 'transparent',
                    border: '1px solid',
                    borderColor: activeResultsTab === 'ai' ? 'rgba(94, 158, 255, 0.35)' : 'transparent',
                    color: activeResultsTab === 'ai' ? '#5E9EFF' : 'var(--text-secondary)'
                  }}
                >
                  {aiStatus === 'analyzing' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>
                    AI Tone Suggestions (
                    {aiStatus === 'analyzing'
                      ? '...'
                      : aiStatus === 'completed'
                      ? aiSuggestions.length
                      : aiStatus === 'unavailable'
                      ? 'Unconfigured'
                      : aiStatus === 'error'
                      ? 'Error'
                      : '0'}
                    )
                  </span>
                </button>

                {(selectedImageFile || visualFindings.length > 0 || visualStatus !== 'idle') && (
                  <button
                    type="button"
                    id="tab-visual-findings-btn"
                    onClick={() => setActiveResultsTab('visual')}
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
                      background: activeResultsTab === 'visual' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      border: '1px solid',
                      borderColor: activeResultsTab === 'visual' ? 'rgba(56, 189, 248, 0.35)' : 'transparent',
                      color: activeResultsTab === 'visual' ? '#38BDF8' : 'var(--text-secondary)'
                    }}
                  >
                    {visualStatus === 'analyzing' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Eye size={14} />
                    )}
                    <span>
                      Visual Compliance (
                      {visualStatus === 'analyzing'
                        ? '...'
                        : visualStatus === 'completed'
                        ? visualFindings.length
                        : visualStatus === 'unavailable'
                        ? (visualFindings.length > 0 ? `${visualFindings.length}` : 'Unconfigured')
                        : visualStatus === 'error'
                        ? 'Error'
                        : '0'}
                      )
                    </span>
                  </button>
                )}
              </div>

              {/* View 1: Deterministic Policy Rule Findings */}
              {activeResultsTab === 'policy' && (
                <div>
                  {reviewResult.findings.length === 0 ? (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'rgba(52, 211, 153, 0.04)',
                        border: '1px solid rgba(52, 211, 153, 0.25)'
                      }}
                    >
                      <CheckCircle2 size={30} color="#34D399" style={{ margin: '0 auto 10px' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                        No Policy Violations Detected
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        This draft satisfies all {reviewResult.checkedRulesCount} active brand rules.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {reviewResult.findings.map((finding) => {
                        const meta = getFindingRuleMetadata(finding, rules);
                        const sevStyle = getSeverityBadgeStyle(meta.severity);
                        const isApplied = appliedFindingIds.has(finding.id);
                        const currentCorrection =
                          editedCorrections[finding.id] !== undefined
                            ? editedCorrections[finding.id]
                            : finding.suggestedCorrection || '';

                        return (
                          <div
                            key={finding.id}
                            className="glass-panel"
                            style={{
                              padding: '18px 20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              border: isApplied
                                ? '1px solid rgba(52, 211, 153, 0.4)'
                                : '1px solid var(--border-medium)',
                              background: isApplied ? 'rgba(52, 211, 153, 0.03)' : 'rgba(255, 255, 255, 0.02)'
                            }}
                          >
                            {/* Finding Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
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

                            {/* Matched Text & Rule Attribution */}
                            <div>
                              {finding.matchedText && (
                                <div style={{ marginBottom: '6px' }}>
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

                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                                Triggered by Rule: <strong style={{ color: 'var(--text-secondary)' }}>{meta.ruleTitle}</strong> (ID: {finding.ruleId})
                              </div>

                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                                {finding.explanation}
                              </p>
                            </div>

                            {/* Source Citation if present on rule */}
                            {(meta.sourceDescription || finding.sourceDescription) && (
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Source: {meta.sourceDescription || finding.sourceDescription}</span>
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

                            {/* Editable Correction Suggestion */}
                            {(finding.suggestedCorrection !== undefined || currentCorrection) && (
                              <div
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(0, 0, 0, 0.35)',
                                  border: '1px solid var(--border-subtle)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <label
                                    htmlFor={`edit-correction-${finding.id}`}
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: 'var(--accent-lime)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Edit3 size={12} /> Suggested Correction (Editable):
                                  </label>
                                  {isApplied && (
                                    <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <Check size={12} /> Applied to Draft
                                    </span>
                                  )}
                                </div>

                                <input
                                  id={`edit-correction-${finding.id}`}
                                  type="text"
                                  value={currentCorrection}
                                  onChange={(e) =>
                                    setEditedCorrections((prev) => ({
                                      ...prev,
                                      [finding.id]: e.target.value
                                    }))
                                  }
                                  placeholder="Enter replacement copy..."
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: 'var(--radius-xs)',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px'
                                  }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                                  <Button
                                    variant={isApplied ? 'secondary' : 'primary'}
                                    size="sm"
                                    onClick={() => handleApplyCorrection(finding)}
                                    iconLeft={isApplied ? <Check size={13} /> : <Sparkles size={13} />}
                                  >
                                    {isApplied ? 'Re-apply Edit' : 'Apply to Draft'}
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

              {/* View 2: AI Tone & Context Suggestions */}
              {activeResultsTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Advisory Notice */}
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
                      <strong style={{ color: '#5E9EFF' }}>AI Tone &amp; Context Suggestions:</strong> Advisory recommendations analyzing voice and messaging nuance against your brand profile ({activeBrandName}). AI suggestions are optional and do NOT alter your compliance score.
                    </div>
                  </div>

                  {/* State: Analyzing */}
                  {aiStatus === 'analyzing' && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '36px 24px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <Loader2 size={30} color="#5E9EFF" className="animate-spin" />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Analyzing Draft Voice &amp; Tone...
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, maxWidth: '380px' }}>
                        Reviewing draft phrasing against brand voice, formality, and messaging alignment.
                      </p>
                    </div>
                  )}

                  {/* State: Unavailable */}
                  {aiStatus === 'unavailable' && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        background: 'rgba(251, 191, 36, 0.04)',
                        border: '1px solid rgba(251, 191, 36, 0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} color="#FBBF24" />
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          AI Provider Credentials Missing
                        </h4>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {aiError || 'No AI provider credentials (OPENAI_API_KEY or GEMINI_API_KEY) are configured on the server.'}
                      </p>
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12px',
                          color: 'var(--text-tertiary)',
                          lineHeight: 1.45
                        }}
                      >
                        To activate genuine AI tone analysis, set <code>OPENAI_API_KEY</code> or <code>GEMINI_API_KEY</code> in your server environment. Deterministic brand rule checks continue to operate independently.
                      </div>
                    </div>
                  )}

                  {/* State: Error */}
                  {aiStatus === 'error' && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        background: 'rgba(248, 113, 113, 0.05)',
                        border: '1px solid rgba(248, 113, 113, 0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} color="#F87171" />
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#FCA5A5', margin: 0 }}>
                          AI Tone Review Error
                        </h4>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        {aiError || 'An error occurred while communicating with the AI provider.'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" size="sm" onClick={handleRetryAiTone} iconLeft={<RefreshCw size={13} />}>
                          Retry AI Review
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* State: Idle / Disabled */}
                  {aiStatus === 'idle' && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <Bot size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        AI Tone Review Inactive
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
                        Enable &quot;Include AI Voice &amp; Tone Analysis&quot; and run the content check to analyze tone.
                      </p>
                      <Button variant="secondary" size="sm" onClick={handleRetryAiTone} iconLeft={<Sparkles size={13} />}>
                        Run AI Tone Review Now
                      </Button>
                    </div>
                  )}

                  {/* State: Completed with 0 Suggestions */}
                  {aiStatus === 'completed' && aiSuggestions.length === 0 && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'rgba(52, 211, 153, 0.04)',
                        border: '1px solid rgba(52, 211, 153, 0.25)'
                      }}
                    >
                      <CheckCircle2 size={30} color="#34D399" style={{ margin: '0 auto 10px' }} />
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                        Tone &amp; Voice Aligned
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        No tone, voice, or messaging mismatches detected for this draft. {aiProvider ? `(Analyzed via ${aiProvider})` : ''}
                      </p>
                    </div>
                  )}

                  {/* State: Completed with Suggestions */}
                  {aiStatus === 'completed' && aiSuggestions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {aiSuggestions.map((suggestion) => {
                        const isApplied = appliedAiIds.has(suggestion.id);
                        const currentAlt =
                          editedAiCorrections[suggestion.id] !== undefined
                            ? editedAiCorrections[suggestion.id]
                            : suggestion.suggestedAlternative || '';

                        return (
                          <div
                            key={suggestion.id}
                            className="glass-panel"
                            style={{
                              padding: '16px 18px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              border: isApplied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(94, 158, 255, 0.25)',
                              background: isApplied ? 'rgba(52, 211, 153, 0.02)' : 'rgba(94, 158, 255, 0.02)'
                            }}
                          >
                            {/* Header badges */}
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

                            {/* Quoted text if identifiable */}
                            {suggestion.quotedText && (
                              <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Identified draft phrasing: </span>
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

                            {/* Policy Evidence Attribution Badge */}
                            <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {suggestion.hasVerifiedPolicyEvidence ? (
                                <span
                                  style={{
                                    color: 'var(--accent-lime)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                  }}
                                >
                                  <Check size={12} /> {suggestion.citationLabel}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: 'var(--text-tertiary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontStyle: 'italic'
                                  }}
                                >
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
                                    htmlFor={`edit-ai-alt-${suggestion.id}`}
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
                                      <Check size={12} /> Applied to Draft
                                    </span>
                                  )}
                                </div>

                                <input
                                  id={`edit-ai-alt-${suggestion.id}`}
                                  type="text"
                                  value={currentAlt}
                                  onChange={(e) =>
                                    setEditedAiCorrections((prev) => ({
                                      ...prev,
                                      [suggestion.id]: e.target.value
                                    }))
                                  }
                                  placeholder="Enter alternative wording..."
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
                                    onClick={() => handleApplyAiSuggestion(suggestion)}
                                    iconLeft={isApplied ? <Check size={12} /> : <Sparkles size={12} />}
                                  >
                                    {isApplied ? 'Re-apply to Draft' : 'Apply to Draft'}
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

              {/* View 3: Multimodal Visual & Accessibility Compliance */}
              {activeResultsTab === 'visual' && (
                <VisualFindingsCard
                  findings={visualFindings}
                  status={visualStatus}
                  error={visualError}
                  provider={visualProvider}
                  model={visualModel}
                  onRetry={handleRetryVisual}
                  previewUrl={imagePreviewUrl}
                  altText={imageAltText}
                />
              )}

              {/* Bottom Actions: Save to Past Reviews and Re-run Check */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveToPastReviews}
                  iconLeft={savedToHistory ? <Check size={14} /> : (can('approve_review') ? <Save size={14} /> : <Send size={14} />)}
                >
                  {savedToHistory
                    ? 'Saved to Past Reviews'
                    : (can('approve_review') ? 'Save Review to Past Reviews' : 'Submit Draft for Review')}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRunContentCheck}
                  iconLeft={<RotateCcw size={14} />}
                >
                  Re-run Content Check
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenResultsGuide}
                  iconLeft={<Info size={14} />}
                >
                  Review Guide
                </Button>
              </div>
            </div>
          ) : (
            /* Idle Initial State */
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldCheck size={16} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Active Governance State
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Enter copy and click <strong>Run Content Check</strong> to execute deterministic checks against your currently enabled brand rules.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Engine:</span>
                  <span style={{ color: 'var(--accent-lime)', fontWeight: 600 }}>Deterministic Rule Engine</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Active Brand:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{activeBrandName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Active Rules Checked:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{enabledRulesCount} active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                  <span>Saved Total:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{rules.length} rules</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Submission Checklist Guidance */}
          <GlassCard style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Submission Checklist
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', padding: 0, margin: 0 }}>
              <li>✦ Verify superlative claims cite registered third-party benchmarks</li>
              <li>✦ Ensure company and product names use approved casing</li>
              <li>✦ Avoid prohibited marketing cliches and hollow jargon</li>
              <li>✦ Keep copy aligned with target channel audience</li>
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* Understand Results Modal */}
      {resultsGuideOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setResultsGuideOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              background: 'rgba(15, 18, 25, 0.96)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--accent-lime)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  What Content Review Results Contain
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResultsGuideOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              When a draft is evaluated against your brand rules, the results report contains:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  1. Overall Compliance Status
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Classified as Approved, Needs Review, or Rejected based on severity of any detected violations.
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  2. Rule & Source Citations
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Exact reference to the active Brand Rule violated (e.g. Prohibited Terms or Claims & Restrictions) with the underlying policy source link.
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  3. Editable Suggested Corrections
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Compliant text recommendations replacing flagged phrases that you can customize and apply directly into your draft.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResultsGuideOpen(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
