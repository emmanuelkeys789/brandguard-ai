export type UserRole = 'Admin' | 'Reviewer' | 'Editor';

export type WorkspaceAction =
  | 'manage_rules'
  | 'manage_profile'
  | 'approve_review'
  | 'reject_review'
  | 'request_changes'
  | 'create_draft'
  | 'edit_draft'
  | 'apply_ai_suggestion'
  | 'publish_review'
  | 'delete_review';

export interface SimulatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarInitials: string;
  description: string;
}

export const SIMULATED_USERS: Record<UserRole, SimulatedUser> = {
  Admin: {
    id: 'usr_admin_sarah',
    name: 'Sarah Chen',
    email: 'sarah.chen@axiom-governance.internal',
    role: 'Admin',
    title: 'Director of Brand Governance',
    avatarInitials: 'SC',
    description: 'Full workspace authority: brand profile, rule management, and editorial approval sign-offs.'
  },
  Reviewer: {
    id: 'usr_reviewer_elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@axiom-governance.internal',
    role: 'Reviewer',
    title: 'Lead Brand & Compliance Reviewer',
    avatarInitials: 'ER',
    description: 'Editorial review authority: review drafts, request changes, approve, and reject. Cannot edit brand rules.'
  },
  Editor: {
    id: 'usr_editor_marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@axiom-governance.internal',
    role: 'Editor',
    title: 'Content Marketing Specialist',
    avatarInitials: 'MV',
    description: 'Content authoring: draft marketing copy, run checks, apply AI rewrites, and submit for review.'
  }
};

export const DEFAULT_USER_ROLE: UserRole = 'Admin';
export const STORAGE_KEY_DEMO_ROLE = 'brandguard_demo_user_role';

/**
 * Pure, centralized permission checker governing all workspace actions.
 */
export function hasPermission(role: UserRole, action: WorkspaceAction): boolean {
  if (role !== 'Admin' && role !== 'Reviewer' && role !== 'Editor') {
    return false;
  }

  switch (action) {
    case 'manage_rules':
    case 'manage_profile':
    case 'delete_review':
      return role === 'Admin';

    case 'approve_review':
    case 'reject_review':
    case 'request_changes':
    case 'publish_review':
      return role === 'Admin' || role === 'Reviewer';

    case 'create_draft':
    case 'edit_draft':
    case 'apply_ai_suggestion':
      return true;

    default:
      return false;
  }
}

/**
 * Visual styling token helper for role badges
 */
export function getRoleBadgeColors(role: UserRole): {
  bg: string;
  color: string;
  border: string;
} {
  switch (role) {
    case 'Admin':
      return {
        bg: 'rgba(214, 255, 112, 0.12)',
        color: 'var(--accent-lime)',
        border: 'rgba(214, 255, 112, 0.35)'
      };
    case 'Reviewer':
      return {
        bg: 'rgba(56, 189, 248, 0.12)',
        color: '#38BDF8',
        border: 'rgba(56, 189, 248, 0.35)'
      };
    case 'Editor':
      return {
        bg: 'rgba(251, 191, 36, 0.12)',
        color: '#FBBF24',
        border: 'rgba(251, 191, 36, 0.35)'
      };
    default:
      return {
        bg: 'rgba(255, 255, 255, 0.08)',
        color: 'var(--text-secondary)',
        border: 'var(--border-subtle)'
      };
  }
}

/**
 * Role summary statement for demo transparency
 */
export function getRoleSummary(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return 'Admin: Full access to brand profiles, rules, reviews, and approval actions.';
    case 'Reviewer':
      return 'Reviewer: Can review drafts, request changes, approve, and reject drafts, but cannot create, edit, or delete brand rules or brand profiles.';
    case 'Editor':
      return 'Editor: Can create and edit drafts, run compliance checks, and apply AI suggestions, but cannot approve or reject drafts or manage brand rules.';
  }
}
