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
  Sparkles
} from 'lucide-react';
import { SAMPLE_DRAFTS } from '../../data/demoData';
import { useBrand } from '../../context/useBrand';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { evaluateDraft, getFindingRuleMetadata, type ReviewEngineResult, type ReviewFinding } from '../../services/ruleEngine';
import type { DashboardTab } from '../../types';

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

  const [draftTitle, setDraftTitle] = useState('');
  const [channel, setChannel] = useState('Press Release');
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Review Engine State
  const [reviewResult, setReviewResult] = useState<ReviewEngineResult | null>(null);
  const [savedToHistory, setSavedToHistory] = useState<boolean>(false);
  const [resultsGuideOpen, setResultsGuideOpen] = useState(false);

  // Editable suggestions state: finding.id -> user edited replacement string
  const [editedCorrections, setEditedCorrections] = useState<Record<string, string>>({});
  const [appliedFindingIds, setAppliedFindingIds] = useState<Set<string>>(new Set());

  // Character and word count
  const charCount = content.length;
  const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;

  const enabledRules = rules.filter(
    (r) => (r.enabled !== undefined ? r.enabled : r.isActive ?? true)
  );
  const enabledRulesCount = enabledRules.length;
  const activeBrandName = brandProfile?.name || 'Default Workspace';

  const handleLoadSample = (type: 'unverified' | 'compliant') => {
    const sample = SAMPLE_DRAFTS[type];
    setDraftTitle(sample.title);
    setChannel(sample.channel);
    setContent(sample.text);
    setValidationError(null);
    setReviewResult(null);
    setSavedToHistory(false);
    setAppliedFindingIds(new Set());
    setEditedCorrections({});
  };

  const handleClear = () => {
    setDraftTitle('');
    setContent('');
    setValidationError(null);
    setReviewResult(null);
    setSavedToHistory(false);
    setAppliedFindingIds(new Set());
    setEditedCorrections({});
  };

  const handleRunContentCheck = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Initialize editable corrections from finding suggestions
    const initialCorrections: Record<string, string> = {};
    for (const f of result.findings) {
      if (f.suggestedCorrection) {
        initialCorrections[f.id] = f.suggestedCorrection;
      }
    }
    setEditedCorrections(initialCorrections);

    // Mark onboarding step 3 complete
    markReviewedContent();
  };

  const handleApplyCorrection = (finding: ReviewFinding) => {
    const replacement =
      editedCorrections[finding.id] !== undefined
        ? editedCorrections[finding.id]
        : finding.suggestedCorrection || '';

    if (finding.matchedText && content.includes(finding.matchedText)) {
      // Replace matching text at specific index if available, else first match
      if (
        finding.location &&
        content.slice(finding.location.startIndex, finding.location.endIndex) === finding.matchedText
      ) {
        const before = content.slice(0, finding.location.startIndex);
        const after = content.slice(finding.location.endIndex);
        const newContent = before + replacement + after;
        setContent(newContent);
      } else {
        const newContent = content.replace(finding.matchedText, replacement);
        setContent(newContent);
      }

      setAppliedFindingIds((prev) => new Set(prev).add(finding.id));
      showToast(
        'success',
        'Correction Applied to Draft',
        `Replaced "${finding.matchedText}" with "${replacement}".`
      );
    } else if (!finding.matchedText && replacement) {
      // Missing term case: append to draft
      setContent((prev) => `${prev} ${replacement}`);
      setAppliedFindingIds((prev) => new Set(prev).add(finding.id));
      showToast('success', 'Term Inserted into Draft', `Added "${replacement}".`);
    }
  };

  const handleSaveToPastReviews = () => {
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

    const saved = saveReview({
      title,
      author: 'Workspace Reviewer',
      channel,
      status: initialStatus,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      issuesCount: currentEvaluation.findings.length,
      confidenceScore: currentEvaluation.score,
      summary: currentEvaluation.summaryText,
      originalDraft: content,
      currentDraft: content,
      findings: currentEvaluation.findings,
      firstPassFindings: currentEvaluation.findings,
      firstPassIssuesCount: currentEvaluation.findings.length,
      firstPassScore: currentEvaluation.score,
      rulesCheckedCount: currentEvaluation.checkedRulesCount,
      decisionHistory: [
        {
          id: `dec_${Date.now()}`,
          action: 'Save Draft',
          reviewerName: 'Workspace Reviewer',
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

              {/* List of Evidence-Linked Findings */}
              {reviewResult.findings.length > 0 && (
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

              {/* Bottom Actions: Save to Past Reviews and Re-run Check */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveToPastReviews}
                  iconLeft={savedToHistory ? <Check size={14} /> : <Save size={14} />}
                >
                  {savedToHistory ? 'Saved to Past Reviews' : 'Save Review to Past Reviews'}
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
