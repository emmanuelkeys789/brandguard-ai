import React from 'react';
import {
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import type { VisualAnalysisFinding, VisualAnalysisStatus } from '../../types';
import { Button } from '../ui/Button';

interface VisualFindingsCardProps {
  findings: VisualAnalysisFinding[];
  status: VisualAnalysisStatus;
  error?: string | null;
  provider?: string;
  model?: string;
  onRetry?: () => void;
  previewUrl?: string | null;
  altText?: string;
}

export const VisualFindingsCard: React.FC<VisualFindingsCardProps> = ({
  findings,
  status,
  error,
  provider,
  model,
  onRetry,
  previewUrl,
  altText
}) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.35)',
          color: '#F87171'
        };
      case 'High':
      case 'Warning':
        return {
          bg: 'rgba(251, 191, 36, 0.12)',
          border: 'rgba(251, 191, 36, 0.35)',
          color: '#FBBF24'
        };
      case 'Medium':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.35)',
          color: '#38BDF8'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.06)',
          border: 'var(--border-subtle)',
          color: 'var(--text-secondary)'
        };
    }
  };

  if (status === 'analyzing') {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: 'rgba(16, 21, 33, 0.5)'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '2px solid rgba(214, 255, 112, 0.2)',
            borderTopColor: 'var(--accent-lime)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}
        />
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Multimodal Creative Analysis in Progress
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
          Inspecting marketing creative for logo proportion, color consistency, text contrast, and accessibility requirements...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error' && findings.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="#F87171" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F87171' }}>
                Multimodal Creative Analysis Error
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {error || 'Unable to complete visual creative inspection.'}
              </div>
            </div>
          </div>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} iconLeft={<RefreshCw size={13} />}>
              Retry Analysis
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'unavailable' && findings.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          background: 'rgba(251, 191, 36, 0.05)',
          border: '1px solid rgba(251, 191, 36, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Info size={18} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Multimodal Vision Provider Unconfigured
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Visual compliance checks require server-side vision credentials (<code>OPENAI_API_KEY</code> or <code>GEMINI_API_KEY</code>). Text-based rule checking and deterministic policies continue operating normally.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Visual Header / Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(214, 255, 112, 0.1)',
              border: '1px solid var(--accent-lime-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Eye size={16} color="var(--accent-lime)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Multimodal Visual Compliance Findings ({findings.length})
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
              Audited against logo guidelines, brand color rules, WCAG contrast, and author alt-text
            </div>
          </div>
        </div>

        {provider && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            Vision Provider: <strong style={{ color: 'var(--text-secondary)' }}>{provider}</strong> ({model})
          </div>
        )}
      </div>

      {/* Audited Creative Context */}
      {previewUrl && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <img
            src={previewUrl}
            alt={altText || 'Audited marketing creative'}
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0, fontSize: '12px' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Audited Creative
            </div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Author Alt-Text:{' '}
              {altText ? (
                <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{altText}&rdquo;</strong>
              ) : (
                <em style={{ color: 'var(--accent-amber)' }}>None provided by author</em>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provider Unavailable Advisory if partial findings (e.g. author alt-text) */}
      {status === 'unavailable' && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(251, 191, 36, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Info size={14} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <span>
            LLM vision analysis is unavailable without server API keys. Displaying deterministic author submission audits below.
          </span>
        </div>
      )}

      {/* Findings List or Clean State */}
      {findings.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            background: 'rgba(16, 21, 33, 0.4)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}
          >
            <CheckCircle2 size={22} color="#34D399" />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No Visual Consistency or Accessibility Issues Flagged
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
            The creative asset aligns with configured logo rules, contrast baselines, and author-supplied alt text requirements.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {findings.map((finding) => {
            const sev = getSeverityStyle(finding.severity);
            return (
              <div
                key={finding.id}
                className="glass-panel"
                style={{
                  padding: '18px 20px',
                  background: 'rgba(16, 21, 33, 0.55)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Finding Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: sev.bg,
                        border: `1px solid ${sev.border}`,
                        color: sev.color
                      }}
                    >
                      {finding.severity}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {finding.category}
                    </span>

                    {/* Uncertainty vs Observable Evidence Distinction */}
                    {finding.isUncertain ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          color: '#FBBF24',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Assessment could not be determined definitively from image resolution or rules; requires human reviewer judgment."
                      >
                        <HelpCircle size={10} /> Uncertain Judgment
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(52, 211, 153, 0.08)',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          color: '#34D399',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={10} /> Observable Evidence
                      </span>
                    )}
                  </div>

                  {finding.relatedRuleTitle && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent-lime)',
                        fontStyle: 'italic'
                      }}
                    >
                      Linked Guideline: {finding.relatedRuleTitle}
                    </span>
                  )}
                </div>

                {/* Finding Title & Description */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {finding.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {finding.description}
                  </p>
                </div>

                {/* Observable Visual Evidence Callout */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    lineHeight: 1.5
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                    Observable Evidence in Asset:
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
                    "{finding.observableEvidence}"
                  </div>
                </div>

                {/* Actionable Remedy Recommendation */}
                {finding.suggestedRemedy && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <strong style={{ color: 'var(--accent-lime)', flexShrink: 0 }}>Recommended Adjustment:</strong>
                    <span>{finding.suggestedRemedy}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
