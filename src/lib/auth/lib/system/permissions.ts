/**
 * Core permission checking utilities and role hierarchy logic
 *
 * This module provides the core functionality for checking user permissions
 * across the platform, including role-based access control and context-aware
 * permission validation.
 */
import { Session } from 'next-auth';
import { UserRole } from '@prisma/client';

import { roleHasPermission } from './roles';
import {
  Permission,
  PermissionCheck,
  PermissionContext,
  UserPermissions,
} from '../../types/system';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userPermissions: UserPermissions,
  permission: Permission,
  context?: PermissionContext
): boolean {
  return roleHasPermission(userPermissions.systemRole, permission);
}

/**
 * Check multiple permissions - can require all or any
 */
export function hasPermissions(
  userPermissions: UserPermissions,
  checks: PermissionCheck[]
): boolean {
  return checks.every((check) => {
    if (check.requireAll && Array.isArray(check.permission)) {
      return (check.permission as Permission[]).every((permission) =>
        hasPermission(userPermissions, permission, check.context)
      );
    }

    if (Array.isArray(check.permission)) {
      return (check.permission as Permission[]).some((permission) =>
        hasPermission(userPermissions, permission, check.context)
      );
    }

    return hasPermission(userPermissions, check.permission, check.context);
  });
}

/**
 * Check if user is system admin (ADMIN or SUPER_ADMIN)
 */
export function isSystemAdmin(userPermissions: UserPermissions): boolean {
  return (
    userPermissions.systemRole === UserRole.ADMIN ||
    userPermissions.systemRole === UserRole.SUPER_ADMIN
  );
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userPermissions: UserPermissions): boolean {
  return userPermissions.systemRole === UserRole.SUPER_ADMIN;
}

/**
 * Check if user can manage another user
 */
export function canManageUser(
  managerPermissions: UserPermissions,
  targetUserPermissions: UserPermissions
): boolean {
  // Super admins can manage anyone
  if (isSuperAdmin(managerPermissions)) {
    return true;
  }

  // Admins can manage non-admins
  if (isSystemAdmin(managerPermissions) && !isSystemAdmin(targetUserPermissions)) {
    return true;
  }

  return false;
}

/**
 * Extract user permissions from NextAuth session
 */
export function getUserPermissionsFromSession(session: Session | null): UserPermissions | null {
  if (!session?.user) return null;

  return {
    systemRole: (session.user as any).role || UserRole.USER,
  };
}

/**
 * Permission validation error types
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public permission: Permission,
    public context?: PermissionContext
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Validate permission and throw error if not authorized
 */
export function requirePermission(
  userPermissions: UserPermissions,
  permission: Permission,
  context?: PermissionContext
): void {
  if (!hasPermission(userPermissions, permission, context)) {
    throw new PermissionError(
      `Access denied: Missing permission ${permission}`,
      permission,
      context
    );
  }
}
