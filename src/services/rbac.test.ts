import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPermission,
  getRoleBadgeColors,
  getRoleSummary,
  SIMULATED_USERS,
  DEFAULT_USER_ROLE,
  STORAGE_KEY_DEMO_ROLE
} from './rbac.ts';
import type { UserRole, WorkspaceAction } from '../types/index.ts';

describe('Role-Based Access Control (RBAC) Permission Matrix Tests', () => {
  const allActions: WorkspaceAction[] = [
    'manage_rules',
    'manage_profile',
    'approve_review',
    'reject_review',
    'request_changes',
    'create_draft',
    'edit_draft',
    'apply_ai_suggestion',
    'publish_review',
    'delete_review'
  ];

  describe('Admin Role Permissions', () => {
    test('Admin role must have permission for every workspace action', () => {
      for (const action of allActions) {
        assert.equal(
          hasPermission('Admin', action),
          true,
          `Admin should have permission for action: ${action}`
        );
      }
    });

    test('Admin is granted exclusive permissions for rules, profiles, and deletion', () => {
      assert.equal(hasPermission('Admin', 'manage_rules'), true);
      assert.equal(hasPermission('Admin', 'manage_profile'), true);
      assert.equal(hasPermission('Admin', 'delete_review'), true);
    });
  });

  describe('Reviewer Role Permissions', () => {
    test('Reviewer can approve, reject, and request changes on drafts', () => {
      assert.equal(hasPermission('Reviewer', 'approve_review'), true);
      assert.equal(hasPermission('Reviewer', 'reject_review'), true);
      assert.equal(hasPermission('Reviewer', 'request_changes'), true);
      assert.equal(hasPermission('Reviewer', 'publish_review'), true);
    });

    test('Reviewer can create, edit drafts and use AI tone suggestions', () => {
      assert.equal(hasPermission('Reviewer', 'create_draft'), true);
      assert.equal(hasPermission('Reviewer', 'edit_draft'), true);
      assert.equal(hasPermission('Reviewer', 'apply_ai_suggestion'), true);
    });

    test('Reviewer CANNOT create, edit, or delete brand rules or brand profiles', () => {
      assert.equal(hasPermission('Reviewer', 'manage_rules'), false);
      assert.equal(hasPermission('Reviewer', 'manage_profile'), false);
      assert.equal(hasPermission('Reviewer', 'delete_review'), false);
    });
  });

  describe('Editor Role Permissions', () => {
    test('Editor can create, edit drafts, run checks, and apply AI suggestions', () => {
      assert.equal(hasPermission('Editor', 'create_draft'), true);
      assert.equal(hasPermission('Editor', 'edit_draft'), true);
      assert.equal(hasPermission('Editor', 'apply_ai_suggestion'), true);
    });

    test('Editor CANNOT approve, reject, or request changes on reviews', () => {
      assert.equal(hasPermission('Editor', 'approve_review'), false);
      assert.equal(hasPermission('Editor', 'reject_review'), false);
      assert.equal(hasPermission('Editor', 'request_changes'), false);
      assert.equal(hasPermission('Editor', 'publish_review'), false);
    });

    test('Editor CANNOT manage brand rules, brand profiles, or delete reviews', () => {
      assert.equal(hasPermission('Editor', 'manage_rules'), false);
      assert.equal(hasPermission('Editor', 'manage_profile'), false);
      assert.equal(hasPermission('Editor', 'delete_review'), false);
    });
  });

  describe('Unknown Roles & Actions Safety Fallback', () => {
    test('returns false for unrecognized action strings', () => {
      assert.equal(hasPermission('Admin', 'unrecognized_action' as any), false);
      assert.equal(hasPermission('Reviewer', 'unrecognized_action' as any), false);
      assert.equal(hasPermission('Editor', 'unrecognized_action' as any), false);
    });

    test('returns false for unknown role names', () => {
      assert.equal(hasPermission('Guest' as any, 'create_draft'), false);
      assert.equal(hasPermission('Anonymous' as any, 'manage_rules'), false);
      assert.equal(hasPermission('' as any, 'approve_review'), false);
    });
  });

  describe('Simulated Demo Personas', () => {
    test('defines valid simulated user personas for all three roles', () => {
      const roles: UserRole[] = ['Admin', 'Reviewer', 'Editor'];
      for (const role of roles) {
        const user = SIMULATED_USERS[role];
        assert.ok(user, `User persona exists for role: ${role}`);
        assert.equal(user.role, role);
        assert.ok(user.name.length > 0, 'User persona has a name');
        assert.ok(user.email.includes('@'), 'User persona has a valid email format');
        assert.ok(user.avatarInitials.length >= 2, 'User persona has avatar initials');
        assert.ok(user.title.length > 0, 'User persona has a job title');
        assert.ok(user.description.length > 0, 'User persona has a role description');
      }
    });

    test('verifies individual persona assignments', () => {
      assert.equal(SIMULATED_USERS.Admin.name, 'Sarah Chen');
      assert.equal(SIMULATED_USERS.Admin.avatarInitials, 'SC');

      assert.equal(SIMULATED_USERS.Reviewer.name, 'Elena Rostova');
      assert.equal(SIMULATED_USERS.Reviewer.avatarInitials, 'ER');

      assert.equal(SIMULATED_USERS.Editor.name, 'Marcus Vance');
      assert.equal(SIMULATED_USERS.Editor.avatarInitials, 'MV');
    });

    test('default role is Admin for backwards compatibility', () => {
      assert.equal(DEFAULT_USER_ROLE, 'Admin');
      assert.equal(STORAGE_KEY_DEMO_ROLE, 'brandguard_demo_user_role');
    });
  });

  describe('Role Badge Colors & Summaries', () => {
    test('returns distinct styling tokens for each role', () => {
      const adminColors = getRoleBadgeColors('Admin');
      const reviewerColors = getRoleBadgeColors('Reviewer');
      const editorColors = getRoleBadgeColors('Editor');

      assert.ok(adminColors.bg.includes('rgba'));
      assert.ok(reviewerColors.bg.includes('rgba'));
      assert.ok(editorColors.bg.includes('rgba'));

      // Colors should be distinct across roles
      assert.notEqual(adminColors.color, reviewerColors.color);
      assert.notEqual(reviewerColors.color, editorColors.color);
    });

    test('returns fallback styling for unknown role', () => {
      const fallback = getRoleBadgeColors('Unknown' as any);
      assert.ok(fallback.bg);
      assert.ok(fallback.color);
    });

    test('getRoleSummary clearly explains constraints for judges', () => {
      const adminSummary = getRoleSummary('Admin');
      const reviewerSummary = getRoleSummary('Reviewer');
      const editorSummary = getRoleSummary('Editor');

      assert.ok(adminSummary.includes('Admin: Full access'));
      assert.ok(reviewerSummary.includes('cannot create, edit, or delete brand rules'));
      assert.ok(editorSummary.includes('cannot approve or reject drafts or manage brand rules'));
    });
  });
});
