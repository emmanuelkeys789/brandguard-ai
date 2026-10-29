import React from 'react';
import type { ReviewStatus } from '../../types';

interface BadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeClass = (status: ReviewStatus): string => {
    switch (status) {
      case 'Needs review':
        return 'badge-needs-review';
      case 'Changes Requested':
        return 'badge-changes-requested';
      case 'In review':
        return 'badge-in-review';
      case 'Approved':
        return 'badge-approved';
      case 'Published':
        return 'badge-published';
      case 'Rejected':
        return 'badge-rejected';
      case 'Draft':
      default:
        return 'badge-draft';
    }
  };

  const isSmall = size === 'sm';

  return (
    <span
      className={`badge ${getBadgeClass(status)}`}
      style={isSmall ? { padding: '2px 8px', fontSize: '11px' } : undefined}
    >
      <span className="badge-dot" />
      <span>{status}</span>
    </span>
  );
};
