/**
 * RBAC Type Definitions
 *
 * Manual types for domain logic and business rules.
 * Server data types should be extracted from tRPC RouterOutputs.
 */

// Re-export Prisma enums for convenience
export { InvitationStatus, RoleRequestStatus, UserRole } from '@prisma/client';

/**
 * Permission resource types
 * These define the main resources in the system that can have permissions
 */
export type PermissionResource = 'posts' | 'projects' | 'notes' | 'users';

/**
 * Permission action types
 * These define the actions that can be performed on resources
 */
export type PermissionAction = 'manage' | 'approve' | 'delete' | 'manage_roles';

/**
 * Common permission names used throughout the application
 */
export const PERMISSION_NAMES = {
  // Posts
  POSTS_MANAGE: 'posts.manage',
  POSTS_APPROVE: 'posts.approve',
  // Projects
  PROJECTS_MANAGE: 'projects.manage',
  PROJECTS_APPROVE: 'projects.approve',
  // Notes
  NOTES_MANAGE: 'notes.manage',
  NOTES_APPROVE: 'notes.approve',
  // Users
  USERS_MANAGE_ROLES: 'users.manage_roles',
} as const;

/**
 * Role names for default roles
 */
export const ROLE_NAMES = {
  CONTENT_MANAGER: 'Content Manager',
  CONTENT_APPROVER: 'Content Approver',
  ADMINISTRATOR: 'Administrator',
} as const;

/**
 * Helper type for permission checking
 */
export type PermissionCheck = {
  userId: string;
  permission: string;
};

/**
 * Helper type for role invitation token validation
 */
export type InvitationValidation = {
  isValid: boolean;
  isExpired: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'INVALID';
  message?: string;
};
