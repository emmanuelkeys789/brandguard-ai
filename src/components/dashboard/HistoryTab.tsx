import React, { useState } from 'react';
import { Download, Search, FileText, Plus, Trash2, ExternalLink, ShieldAlert } from 'lucide-react';
import { useBrand } from '../../context/useBrand';
import { useAuth } from '../../context/useAuth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ReviewDetailModal } from './ReviewDetailModal';
import { brandRepository } from '../../services/brandRepository';
import type { DashboardTab, ReviewItem } from '../../types';

interface HistoryTabProps {
  onNavigateTab?: (tab: DashboardTab) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onNavigateTab }) => {
  const { reviews, rules, brandProfile, saveReview, deleteReview, showToast } = useBrand();
  const { can } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  const statuses = ['All', 'Needs review', 'Changes Requested', 'In review', 'Approved', 'Published', 'Rejected', 'Draft'];

  const filteredHistory = reviews.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reviewerComment && item.reviewerComment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    if (reviews.length === 0) return;
    const headers = [
      'ID',
      'Title',
      'Channel',
      'Author',
      'Status',
      'IssuesCount',
      'DeterministicComplianceScore',
      'LastUpdated',
      'DecisionTimestamp',
      'ReviewerComment'
    ];
    const rows = reviews.map((r) => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.channel,
      r.author,
      r.status,
      r.issuesCount,
      `${r.confidenceScore}% (Rule-Based)`,
      r.updatedAt,
      r.decisionAt || '',
      `"${(r.reviewerComment || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandguard-past-reviews-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div className="glass-pill glass-pill-accent" style={{ marginBottom: '10px' }}>
            <span>AUDIT LOG & ARCHIVE</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Past Reviews
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Find and revisit previously saved content reviews.
          </p>
        </div>

        {reviews.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleExportCSV} iconLeft={<Download size={14} />}>
            Export Audit Trail (CSV)
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        /* Helpful Empty State */
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <FileText size={24} color="var(--text-tertiary)" />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No past reviews found
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Reviews will appear after a review is run and saved. When you check drafts in Check Content, you can save audit snapshots to revisit anytime.
          </p>

          {onNavigateTab && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigateTab('review')}
              iconLeft={<Plus size={15} />}
              id="history-check-first-draft-btn"
            >
              Check Your First Draft
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Audit Storage Integrity Disclosure Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-tertiary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={13} color="var(--accent-lime)" />
              <span>
                <strong style={{ color: 'var(--text-secondary)' }}>Audit Trail Integrity Note: </strong>
                Reviews and decision records are saved in{' '}
                <strong style={{ color: brandRepository.isCloudConfigured() ? '#34D399' : '#FBBF24' }}>
                  {brandRepository.isCloudConfigured() ? 'Cloud PostgreSQL' : 'Local Browser Storage (Demo Mode)'}
                </strong>
                . Client-side storage cannot guarantee append-only ledger immutability; production enterprise audit compliance requires Cloud PostgreSQL with Row-Level Security (RLS).
              </span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 280px' }}>
              <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search by title, author, or channel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: statusFilter === status ? 'var(--accent-lime-dim)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: statusFilter === status ? 'var(--accent-lime-border)' : 'var(--border-subtle)',
                    color: statusFilter === status ? 'var(--accent-lime)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* History Table Container */}
          <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
            {filteredHistory.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No reviews match your current filters.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    <th style={{ padding: '16px 20px' }}>Content Title</th>
                    <th style={{ padding: '16px 20px' }}>Channel</th>
                    <th style={{ padding: '16px 20px' }}>Author</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                    <th style={{ padding: '16px 20px' }}>Issues</th>
                    <th style={{ padding: '16px 20px' }}>Rule Score</th>
                    <th style={{ padding: '16px 20px' }}>Timestamp</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item: ReviewItem) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedReview(item)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background var(--transition-fast)',
                        cursor: 'pointer'
                      }}
                      className="history-table-row"
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.title}</span>
                          {(item.id === 'rev_spring_announcement_01' || item.id === 'rev_enterprise_overview_02') && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(214, 255, 112, 0.1)',
                                border: '1px solid var(--accent-lime-border)',
                                color: 'var(--accent-lime)'
                              }}
                            >
                              Sample
                            </span>
                          )}
                          <ExternalLink size={12} color="var(--text-tertiary)" />
                        </div>
                        {item.summary && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px' }}>
                            {item.summary}
                          </div>
                        )}
                        {item.reviewerComment && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-lime)', fontStyle: 'italic', marginTop: '2px' }}>
                            💬 {item.reviewerComment}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{item.channel}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{item.author}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <Badge status={item.status} size="sm" />
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)' }}>
                        {(() => {
                          const hasContent = !!(item.originalDraft?.trim() || item.currentDraft?.trim());
                          if (!hasContent && (!item.findings || item.findings.length === 0)) {
                            return <span style={{ color: 'var(--accent-amber)', fontSize: '12px' }}>Check required</span>;
                          }
                          const count = Array.isArray(item.findings)
                            ? item.findings.length
                            : (typeof item.issuesCount === 'number' ? item.issuesCount : 0);
                          return count > 0 ? (
                            <span style={{ color: '#FBBF24', fontWeight: 600 }}>{count} flagged</span>
                          ) : (
                            <span style={{ color: 'var(--accent-lime)' }}>0 issues</span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)' }}>
                        {(() => {
                          const hasContent = !!(item.originalDraft?.trim() || item.currentDraft?.trim());
                          if (!hasContent && (!item.findings || item.findings.length === 0)) {
                            return <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Check required</span>;
                          }
                          return (
                            <div>
                              <span style={{ color: item.confidenceScore >= 90 ? 'var(--accent-lime)' : '#FBBF24', fontWeight: 600 }}>
                                {item.confidenceScore}%
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                                Rule-Based
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                        {item.updatedAt}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReview(item);
                            }}
                          >
                            Review
                          </Button>
                          {can('delete_review') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteReview(item.id);
                              }}
                              title="Delete review"
                              aria-label={`Delete review ${item.title}`}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                padding: '6px'
                              }}
                              className="history-delete-btn"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Detailed Human Review Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          rules={rules}
          brandProfile={brandProfile}
          onClose={() => setSelectedReview(null)}
          onUpdateReview={(updated) => {
            const success = saveReview(updated);
            if (success) {
              setSelectedReview(updated);
            }
          }}
          showToast={showToast}
        />
      )}

      <style>{`
        .history-table-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .history-delete-btn:hover {
          color: #F87171 !important;
        }
      `}</style>
    </div>
  );
};
