/**
 * Role definitions and constants for system roles
 *
 * This module defines the role hierarchy and permission mappings for the
 * user roles system.
 */
import { Permission, RoleHierarchy } from '../../types/system';
import { UserRole } from '@prisma/client';

/**
 * Role hierarchy definitions - roles inherit permissions from lower-level roles
 */
export const ROLE_HIERARCHIES: Record<UserRole, RoleHierarchy> = {
  [UserRole.SUPER_ADMIN]: {
    role: UserRole.SUPER_ADMIN,
    inherits: [UserRole.ADMIN, UserRole.USER],
    permissions: [
      Permission.MANAGE_PLATFORM,
      Permission.ACCESS_ANY_ACCOUNT,
      Permission.MANAGE_ADMINS,
      Permission.APPROVE_ROLE_REQUESTS,
      Permission.MANAGE_ROLE_REQUESTS,
    ],
  },

  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    inherits: [UserRole.USER],
    permissions: [
      Permission.ACCESS_ANY_ACCOUNT,
      Permission.APPROVE_ROLE_REQUESTS,
      Permission.MANAGE_ROLE_REQUESTS,
    ],
  },

  [UserRole.USER]: {
    role: UserRole.USER,
    inherits: [],
    permissions: [Permission.VIEW_PROFILE, Permission.EDIT_PROFILE],
  },
};

/**
 * Get all permissions for a role including inherited permissions
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const hierarchy = ROLE_HIERARCHIES[role];

  if (!hierarchy) return [];

  const permissions = new Set(hierarchy.permissions);

  // Add inherited permissions
  hierarchy.inherits.forEach((inheritedRole) => {
    const inheritedPermissions = getRolePermissions(inheritedRole as UserRole);
    inheritedPermissions.forEach((permission) => permissions.add(permission));
  });

  return Array.from(permissions);
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role inherits from another role
 */
export function roleInheritsFrom(role: UserRole, inheritedRole: UserRole): boolean {
  const hierarchy = ROLE_HIERARCHIES[role];

  if (!hierarchy) return false;

  if (hierarchy.inherits.includes(inheritedRole)) return true;

  // Check recursive inheritance
  return hierarchy.inherits.some((parentRole) =>
    roleInheritsFrom(parentRole as UserRole, inheritedRole)
  );
}

/**
 * System role priority for hierarchy checking
 */
export const ROLE_PRIORITY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};

/**
 * Check if one role is higher than another
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return ROLE_PRIORITY[role1] > ROLE_PRIORITY[role2];
}
