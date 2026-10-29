import type { ReviewStatus } from '../types/index.ts';
import { hasPermission, type UserRole, type WorkspaceAction } from './rbac.ts';

/**
 * Valid review workflow state machine transitions:
 *
 * Draft -> Needs review | In review | Draft
 * Needs review -> In review | Approved | Rejected | Changes Requested | Draft | Needs review
 * In review -> Approved | Rejected | Changes Requested | Needs review | Draft | In review
 * Changes Requested -> Draft | Needs review | In review | Approved | Rejected | Changes Requested
 * Rejected -> Draft | Needs review | In review | Rejected
 * Approved -> Published | Changes Requested | Rejected | Needs review | Draft | Approved
 * Published -> Draft | Needs review | Changes Requested
 *
 * Explicitly disallowed transitions:
 * - Unapproved -> Published (cannot publish unapproved content)
 * - Published -> Published (repeated publishing blocked)
 * - Draft -> Approved / Rejected (must undergo review first)
 * - Rejected -> Approved (cannot approve directly without revised submission or reopening)
 * - Direct new review -> Published (cannot create new review directly as published)
 */
export function isValidReviewStateTransition(
  currentStatus: ReviewStatus | undefined,
  nextStatus: ReviewStatus
): { valid: boolean; reason?: string } {
  // Brand new review creation
  if (!currentStatus) {
    if (nextStatus === 'Published') {
      return {
        valid: false,
        reason: 'New drafts cannot be directly created as "Published". Content must first undergo review and receive explicit human approval.'
      };
    }
    return { valid: true };
  }

  // Same status update (e.g. editing content, updating comments, adding revisions)
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  switch (currentStatus) {
    case 'Draft':
      if (nextStatus === 'Needs review' || nextStatus === 'In review') {
        return { valid: true };
      }
      if (nextStatus === 'Published') {
        return {
          valid: false,
          reason: 'Cannot publish unapproved content. Content in "Draft" must be submitted for review and approved before publishing.'
        };
      }
      return {
        valid: false,
        reason: `Cannot transition directly from "Draft" to "${nextStatus}". A draft must be submitted for review ("Needs review") first.`
      };

    case 'Needs review':
      if (
        nextStatus === 'In review' ||
        nextStatus === 'Approved' ||
        nextStatus === 'Rejected' ||
        nextStatus === 'Changes Requested' ||
        nextStatus === 'Draft'
      ) {
        return { valid: true };
      }
      if (nextStatus === 'Published') {
        return {
          valid: false,
          reason: 'Cannot publish unapproved content. Content in "Needs review" must receive explicit human approval ("Approved") before publishing.'
        };
      }
      return {
        valid: false,
        reason: `Invalid transition from "Needs review" to "${nextStatus}".`
      };

    case 'In review':
      if (
        nextStatus === 'Approved' ||
        nextStatus === 'Rejected' ||
        nextStatus === 'Changes Requested' ||
        nextStatus === 'Needs review' ||
        nextStatus === 'Draft'
      ) {
        return { valid: true };
      }
      if (nextStatus === 'Published') {
        return {
          valid: false,
          reason: 'Cannot publish unapproved content. Content currently "In review" must receive explicit human approval ("Approved") before publishing.'
        };
      }
      return {
        valid: false,
        reason: `Invalid transition from "In review" to "${nextStatus}".`
      };

    case 'Changes Requested':
      if (
        nextStatus === 'Draft' ||
        nextStatus === 'Needs review' ||
        nextStatus === 'In review' ||
        nextStatus === 'Approved' ||
        nextStatus === 'Rejected'
      ) {
        return { valid: true };
      }
      if (nextStatus === 'Published') {
        return {
          valid: false,
          reason: 'Cannot publish unapproved content. Reviews with changes requested cannot be published until revisions are made and approved.'
        };
      }
      return {
        valid: false,
        reason: `Invalid transition from "Changes Requested" to "${nextStatus}".`
      };

    case 'Rejected':
      if (
        nextStatus === 'Draft' ||
        nextStatus === 'Needs review' ||
        nextStatus === 'In review'
      ) {
        return { valid: true };
      }
      if (nextStatus === 'Published') {
        return {
          valid: false,
          reason: 'Cannot publish rejected content. A rejected review must be revised and approved before publishing.'
        };
      }
      if (nextStatus === 'Approved') {
        return {
          valid: false,
          reason: 'Cannot approve directly from "Rejected". Reopen the review or submit a revised draft for review first.'
        };
      }
      return {
        valid: false,
        reason: `Invalid transition from "Rejected" to "${nextStatus}".`
      };

    case 'Approved':
      if (
        nextStatus === 'Published' ||
        nextStatus === 'Changes Requested' ||
        nextStatus === 'Rejected' ||
        nextStatus === 'Needs review' ||
        nextStatus === 'Draft'
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Invalid transition from "Approved" to "${nextStatus}".`
      };

    case 'Published':
      // If content is retracted or a new draft revision is created from published content:
      if (
        nextStatus === 'Draft' ||
        nextStatus === 'Needs review' ||
        nextStatus === 'Changes Requested'
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Published content cannot transition directly to "${nextStatus}". Create a new draft revision instead.`
      };

    default:
      return { valid: false, reason: `Unknown review status "${currentStatus}".` };
  }
}

/**
 * Returns list of valid next statuses for a given current status.
 */
export function getAllowedNextStatuses(currentStatus: ReviewStatus | undefined): ReviewStatus[] {
  if (!currentStatus) {
    return ['Draft', 'Needs review', 'In review', 'Approved'];
  }

  const allStatuses: ReviewStatus[] = [
    'Draft',
    'Needs review',
    'In review',
    'Approved',
    'Changes Requested',
    'Rejected',
    'Published'
  ];

  return allStatuses.filter((s) => s !== currentStatus && isValidReviewStateTransition(currentStatus, s).valid);
}

/**
 * Validates both state transition legality and role authorization for the transition.
 */
export function canUserExecuteTransition(
  role: UserRole,
  currentStatus: ReviewStatus | undefined,
  nextStatus: ReviewStatus
): { allowed: boolean; reason?: string } {
  // 1. Validate state transition legality
  const transition = isValidReviewStateTransition(currentStatus, nextStatus);
  if (!transition.valid) {
    return { allowed: false, reason: transition.reason };
  }

  // 2. Validate role permission for the target state
  if (nextStatus === 'Approved') {
    if (!hasPermission(role, 'approve_review')) {
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot approve reviews. Reviewer or Admin authorization is required.'
      };
    }
  }

  if (nextStatus === 'Rejected') {
    if (!hasPermission(role, 'reject_review')) {
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot reject reviews. Reviewer or Admin authorization is required.'
      };
    }
  }

  if (nextStatus === 'Changes Requested') {
    if (!hasPermission(role, 'request_changes')) {
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot request changes on reviews. Reviewer or Admin authorization is required.'
      };
    }
  }

  if (nextStatus === 'Published') {
    if (!hasPermission(role, 'publish_review')) {
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot publish reviews. Reviewer or Admin authorization is required.'
      };
    }
  }

  if (nextStatus === 'Draft' || nextStatus === 'Needs review' || nextStatus === 'In review') {
    if (!hasPermission(role, 'create_draft') && !hasPermission(role, 'edit_draft')) {
      return {
        allowed: false,
        reason: 'Permission Denied: Your role does not have permission to author or edit drafts.'
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates role permission for workspace actions with friendly, judge-readable explanations.
 */
export function canUserExecuteAction(
  role: UserRole,
  action: WorkspaceAction
): { allowed: boolean; reason?: string } {
  if (hasPermission(role, action)) {
    return { allowed: true };
  }

  switch (action) {
    case 'manage_rules':
      return {
        allowed: false,
        reason: 'Permission Denied: Only workspace Admins can create, edit, pause, or delete brand rules.'
      };
    case 'manage_profile':
      return {
        allowed: false,
        reason: 'Permission Denied: Only workspace Admins can modify brand governance profile configuration.'
      };
    case 'approve_review':
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot approve reviews. Reviewer or Admin authorization is required.'
      };
    case 'reject_review':
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot reject reviews. Reviewer or Admin authorization is required.'
      };
    case 'request_changes':
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot request changes on reviews. Reviewer or Admin authorization is required.'
      };
    case 'publish_review':
      return {
        allowed: false,
        reason: 'Permission Denied: Editor role cannot publish reviews. Reviewer or Admin authorization is required.'
      };
    case 'delete_review':
      return {
        allowed: false,
        reason: 'Permission Denied: Only workspace Admins can delete review records from history.'
      };
    default:
      return {
        allowed: false,
        reason: `Permission Denied: Action "${action}" is not authorized for role "${role}".`
      };
  }
}
