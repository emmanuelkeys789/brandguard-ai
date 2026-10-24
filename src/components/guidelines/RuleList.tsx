import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Link2
} from 'lucide-react';
import type { BrandRule } from '../../types';
import { RULE_CATEGORIES } from '../../services/brandStorage';
import { Button } from '../ui/Button';

interface RuleListProps {
  rules: BrandRule[];
  onAddRule: () => void;
  onEditRule: (rule: BrandRule) => void;
  onDeleteRule: (rule: BrandRule) => void;
  onToggleRule: (id: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({
  rules,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: rules.length };
    for (const rule of rules) {
      counts[rule.category] = (counts[rule.category] || 0) + 1;
    }
    return counts;
  }, [rules]);

  // Filter rules based on search, category, and status
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rule.title.toLowerCase().includes(q) ||
        rule.description.toLowerCase().includes(q) ||
        (rule.sourceDescription && rule.sourceDescription.toLowerCase().includes(q)) ||
        (rule.example && rule.example.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'All' ||
        rule.category === selectedCategory;

      const isRuleActive = rule.enabled !== undefined ? rule.enabled : rule.isActive ?? true;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isRuleActive) ||
        (statusFilter === 'paused' && !isRuleActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rules, searchQuery, selectedCategory, statusFilter]);

  const activeRulesCount = useMemo(() => {
    return rules.filter((r) => (r.enabled !== undefined ? r.enabled : r.isActive ?? true)).length;
  }, [rules]);

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Approved Facts':
        return {
          bg: 'rgba(52, 211, 153, 0.12)',
          border: 'rgba(52, 211, 153, 0.28)',
          color: '#34D399'
        };
      case 'Required Terms':
      case 'Required Terminology':
        return {
          bg: 'rgba(94, 158, 255, 0.12)',
          border: 'rgba(94, 158, 255, 0.28)',
          color: '#5E9EFF'
        };
      case 'Prohibited Terms':
      case 'Prohibited Terminology':
        return {
          bg: 'rgba(248, 113, 113, 0.12)',
          border: 'rgba(248, 113, 113, 0.28)',
          color: '#F87171'
        };
      case 'Tone of Voice':
      case 'Tone and Voice':
        return {
          bg: 'rgba(157, 140, 255, 0.12)',
          border: 'rgba(157, 140, 255, 0.28)',
          color: '#9D8CFF'
        };
      case 'Claims & Restrictions':
      case 'Claims and Restrictions':
      case 'Claims & Evidence':
        return {
          bg: 'rgba(251, 191, 36, 0.12)',
          border: 'rgba(251, 191, 36, 0.28)',
          color: '#FBBF24'
        };
      case 'Visual Guidelines':
        return {
          bg: 'rgba(45, 212, 191, 0.12)',
          border: 'rgba(45, 212, 191, 0.28)',
          color: '#2DD4BF'
        };
      case 'Accessibility':
      case 'Accessibility Guidelines':
        return {
          bg: 'rgba(192, 132, 252, 0.12)',
          border: 'rgba(192, 132, 252, 0.28)',
          color: '#C084FC'
        };
      case 'Other':
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.15)',
          color: 'var(--text-secondary)'
        };
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'Critical':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.28)',
              color: '#F87171'
            }}
          >
            Critical
          </span>
        );
      case 'High':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.28)',
              color: '#FBBF24'
            }}
          >
            High
          </span>
        );
      case 'Medium':
      case 'Warning':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(94, 158, 255, 0.12)',
              border: '1px solid rgba(94, 158, 255, 0.28)',
              color: '#5E9EFF'
            }}
          >
            Medium
          </span>
        );
      case 'Low':
      case 'Advisory':
      default:
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-tertiary)'
            }}
          >
            Low
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls Bar: Search, Category Filters, and Add Rule */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 320px' }}>
            <Search
              size={15}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type="text"
              placeholder="Search by title, requirement, or cited source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Right Action: Status Filter & Add Rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Status dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'paused')}
                style={{
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all" style={{ background: '#12151E' }}>All Statuses</option>
                <option value="active" style={{ background: '#12151E' }}>Active Only</option>
                <option value="paused" style={{ background: '#12151E' }}>Paused Only</option>
              </select>
            </div>

            <Button variant="primary" size="sm" onClick={onAddRule} iconLeft={<Plus size={14} />}>
              Add Rule
            </Button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setSelectedCategory('All')}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              background: selectedCategory === 'All' ? 'var(--accent-lime-dim)' : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid',
              borderColor: selectedCategory === 'All' ? 'var(--accent-lime-border)' : 'var(--border-subtle)',
              color: selectedCategory === 'All' ? 'var(--accent-lime)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            All Categories ({rules.length})
          </button>

          {RULE_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: isSelected ? 'var(--accent-lime-dim)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent-lime-border)' : 'var(--border-subtle)',
                  color: isSelected ? 'var(--accent-lime)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Summary Metric Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          padding: '0 4px'
        }}
      >
        <div>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredRules.length}</strong> of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{rules.length}</strong> configured rules (
          <span style={{ color: 'var(--accent-lime)' }}>{activeRulesCount} active</span>,{' '}
          <span style={{ color: 'var(--text-tertiary)' }}>{rules.length - activeRulesCount} paused</span>)
        </div>
      </div>

      {/* Rules Table / Compact List Container */}
      <div
        className="glass-panel"
        style={{
          overflow: 'hidden',
          padding: 0
        }}
      >
        {filteredRules.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}
            >
              <AlertTriangle size={20} color="var(--accent-amber)" />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {rules.length === 0 ? 'Why brand rules are needed' : 'No rules match your filters'}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
              {rules.length === 0
                ? 'Brand rules are needed to define approved facts, required terminology, prohibited claims, and brand voice guidelines. Without rules, content checks have no criteria to evaluate drafts against.'
                : 'Try adjusting your search query, selecting another category, or clearing the status filter.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {rules.length === 0 ? (
                <Button variant="primary" size="sm" onClick={onAddRule} iconLeft={<Plus size={14} />} id="rulelist-add-first-rule-btn">
                  Add Your First Rule
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Table Header (Desktop) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 180px 1fr 100px 180px 84px',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
              className="rules-table-header"
            >
              <div style={{ textAlign: 'center' }}>Active</div>
              <div>Category</div>
              <div>Rule & Description</div>
              <div>Severity</div>
              <div>Supporting Source</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Table Rows */}
            {filteredRules.map((rule) => {
              const isRuleActive = rule.enabled !== undefined ? rule.enabled : rule.isActive ?? true;
              const isExpanded = expandedRuleId === rule.id;
              const catStyle = getCategoryBadgeStyle(rule.category);

              return (
                <div
                  key={rule.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)'
                  }}
                  className="rule-row"
                >
                  {/* Primary Row Content */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52px 180px 1fr 100px 180px 84px',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      opacity: isRuleActive ? 1 : 0.6
                    }}
                    className="rule-row-grid"
                  >
                    {/* Toggle Active Button */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onToggleRule(rule.id)}
                        title={isRuleActive ? 'Rule is active for audits (click to pause)' : 'Rule is paused (click to activate)'}
                        aria-label={isRuleActive ? 'Pause rule' : 'Activate rule'}
                        style={{
                          width: '32px',
                          height: '18px',
                          borderRadius: '18px',
                          background: isRuleActive ? 'var(--accent-lime)' : 'rgba(255, 255, 255, 0.15)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background var(--transition-fast)'
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: isRuleActive ? '#07080B' : '#FFFFFF',
                            top: '2px',
                            left: isRuleActive ? '16px' : '2px',
                            transition: 'left var(--transition-fast)'
                          }}
                        />
                      </button>
                    </div>

                    {/* Category Badge */}
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: catStyle.bg,
                          border: `1px solid ${catStyle.border}`,
                          color: catStyle.color,
                          display: 'inline-block',
                          maxWidth: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={rule.category}
                      >
                        {rule.category}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rule.title}
                        </span>
                        {!isRuleActive && (
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                            (Paused)
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: isExpanded ? undefined : 1,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {rule.description}
                      </div>
                    </div>

                    {/* Severity */}
                    <div>{getSeverityBadge(rule.severity)}</div>

                    {/* Source Information */}
                    <div style={{ minWidth: 0 }}>
                      {rule.sourceDescription || rule.sourceDocument ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={rule.sourceDescription || rule.sourceDocument}
                          >
                            {rule.sourceDescription || rule.sourceDocument}
                          </span>
                          {rule.sourceUrl && (
                            <a
                              href={rule.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Open source: ${rule.sourceUrl}`}
                              style={{
                                color: 'var(--accent-lime)',
                                display: 'inline-flex',
                                flexShrink: 0
                              }}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>No source cited</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <button
                        onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                        title={isExpanded ? 'Collapse details' : 'Expand details'}
                        aria-label="Toggle details"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        className="rule-action-btn"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>

                      <button
                        onClick={() => onEditRule(rule)}
                        title="Edit rule"
                        aria-label="Edit rule"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        className="rule-action-btn"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule)}
                        title="Delete rule"
                        aria-label="Delete rule"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        className="rule-delete-btn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '12px 16px 16px 64px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Full Requirement: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{rule.description}</span>
                      </div>

                      {(rule.example || rule.exampleViolation) && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--accent-lime)' }}>Editorial Example: </span>
                          <span>{rule.example || rule.exampleViolation}</span>
                        </div>
                      )}

                      {rule.sourceUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                          <Link2 size={13} color="var(--accent-lime)" />
                          <span>Source URL:</span>
                          <a
                            href={rule.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-lime)', textDecoration: 'underline' }}
                          >
                            {rule.sourceUrl}
                          </a>
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '16px' }}>
                        <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                        <span>Evaluation State: {isRuleActive ? 'Enabled for pre-publication audits' : 'Paused'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .rule-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .rule-action-btn:hover {
          color: var(--text-primary) !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .rule-delete-btn:hover {
          color: #F87171 !important;
          background: rgba(248, 113, 113, 0.12) !important;
        }
        .rules-reset-btn:hover {
          color: var(--text-secondary) !important;
        }
        @media (max-width: 900px) {
          .rules-table-header {
            display: none !important;
          }
          .rule-row-grid {
            grid-template-columns: 44px 1fr auto !important;
            grid-template-areas:
              "toggle title actions"
              "category category category"
              "source source source";
          }
        }
      `}</style>
    </div>
  );
};
