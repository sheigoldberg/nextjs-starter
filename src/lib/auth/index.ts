/**
 * Auth Feature - Public API
 *
 * This module exports the public API for the auth feature.
 * It provides a clean separation between:
 * 1. System-level permissions (UserRole enum - fixed, non-configurable)
 * 2. RBAC permissions (Role model - flexible, database-driven)
 *
 * All auth-related code is encapsulated in this feature following
 * the Bulletproof React pattern for feature-based architecture.
 */

/**
 * NextAuth type augmentations
 *
 * IMPORTANT: Import this package in any package that needs access to
 * extended NextAuth session types (session.user.id, session.user.role)
 */
import './types/session';

// NextAuth session types
export type { ExtendedSession } from './types/session';

// ============================================================================
// SYSTEM-LEVEL EXPORTS (UserRole enum-based)
// ============================================================================

// Types
export type {
  PermissionCheck,
  PermissionContext,
  RoleHierarchy,
  SessionPermissions,
  UserPermissions,
  UserRole,
} from './types/system';

// Enums (exported as both type and value)
export { Permission } from './types/system';

// Role hierarchy and utilities
export {
  getRolePermissions,
  isHigherRole,
  ROLE_HIERARCHIES,
  ROLE_PRIORITY,
  roleHasPermission,
  roleInheritsFrom,
} from './lib/system/roles';

// Permission checking
export {
  canManageUser,
  getUserPermissionsFromSession,
  hasPermission,
  hasPermissions,
  isSuperAdmin,
  isSystemAdmin,
  PermissionError,
  requirePermission,
} from './lib/system/permissions';

// Session management
export { setAuthOptions, sessionNeedsRefresh } from './lib/system/session-helper';
export type { EnhancedSession } from './lib/system/session-helper';

// ============================================================================
// RBAC EXPORTS (Database-driven Role model)
// ============================================================================

// Types
export type {
  InvitationValidation,
  PermissionAction,
  PermissionResource,
  PermissionCheck as RbacPermissionCheck,
} from './types/rbac';

export { InvitationStatus, UserRole as PrismaUserRole, RoleRequestStatus } from './types/rbac';

export { PERMISSION_NAMES, ROLE_NAMES } from './types/rbac';

// RBAC Prisma client management
export { setPrismaClient } from './lib/rbac/prisma-client';

// RBAC permission checking (database queries)
export {
  getUserPermissions,
  getUserRoles,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission as hasRbacPermission,
} from './lib/rbac/permissions';

// Schemas (explicit exports to avoid barrel export linter error)
export {
  acceptInvitationSchema,
  assignRoleSchema,
  createInvitationSchema,
  createPermissionSchema,
  createRoleRequestSchema,
  createRoleSchema,
  deleteRoleSchema,
  removeRoleSchema,
  reviewRoleRequestSchema,
  updateRoleSchema,
  validateInvitationSchema,
} from './types/schemas';

export type {
  AcceptInvitationInput,
  AssignRoleInput,
  CreateInvitationInput,
  CreatePermissionInput,
  CreateRoleInput,
  CreateRoleRequestInput,
  DeleteRoleInput,
  RemoveRoleInput,
  ReviewRoleRequestInput,
  UpdateRoleInput,
  ValidateInvitationInput,
} from './types/schemas';

// ============================================================================
// HOOKS
// ============================================================================

export { usePermissions } from './hooks/use-permissions';
export { useRoles, useAdminRoles, useUserRoles, useRole, useUsers } from './hooks/use-roles';
export type { UsePermissionsReturn } from './hooks/use-permissions';

// ============================================================================
// COMPONENTS
// ============================================================================

// Auth Components
export { default as AuthButton } from './components/auth-button';

// Permission Gate Components
export {
  AdminGate,
  PermissionButton,
  PermissionGate,
  withPermissions,
} from './components/permission-gate';

// Permission Form Components
export {
  PermissionField,
  PermissionForm,
  PermissionButton as PermissionFormButton,
  PermissionSection,
} from './components/permission-form';

// Permission Navigation Components
export { PermissionBreadcrumb, PermissionNavigation } from './components/permission-navigation';

// Session helpers
export { getCurrentUser } from './get-current-user';
