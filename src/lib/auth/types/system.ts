/**
 * TypeScript types for permissions and roles system
 *
 * Defines the permission structure for sheigoldberg.com
 * including system-level roles and permissions.
 *
 * @see CLAUDE.md Type System Architecture section for guidance
 */

// Import UserRole directly from Prisma (zero type drift)
import { UserRole } from '@prisma/client';
export { UserRole };

export enum Permission {
  // System-level permissions
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',
  APPROVE_ROLE_REQUESTS = 'APPROVE_ROLE_REQUESTS',
  MANAGE_ROLE_REQUESTS = 'MANAGE_ROLE_REQUESTS',
  ACCESS_ANY_ACCOUNT = 'ACCESS_ANY_ACCOUNT',
  MANAGE_ADMINS = 'MANAGE_ADMINS',

  // General permissions
  VIEW_PROFILE = 'VIEW_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
}

export interface PermissionContext {
  userId?: string;
}

export interface UserPermissions {
  systemRole: UserRole;
}

export interface PermissionCheck {
  permission: Permission;
  context?: PermissionContext;
  requireAll?: boolean; // For multiple permissions
}

export interface RoleHierarchy {
  role: UserRole;
  inherits: UserRole[];
  permissions: Permission[];
}

export interface SessionPermissions {
  user: {
    id: string;
    email: string;
  };
  permissions: UserPermissions;
  currentContext?: PermissionContext;
  lastUpdated: Date;
}
