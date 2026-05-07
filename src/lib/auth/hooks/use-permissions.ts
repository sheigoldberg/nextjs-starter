/**
 * React hook for permission checking in components
 *
 * This hook provides a convenient way to check permissions in React components
 * and handle permission-based UI rendering.
 */
import { useMemo } from 'react';

import { useSession } from 'next-auth/react';

import {
  getUserPermissionsFromSession,
  hasPermission,
  hasPermissions,
  isSuperAdmin,
  isSystemAdmin,
} from '../lib/system/permissions';
import type { EnhancedSession } from '../lib/system/session-helper';
import type {
  Permission,
  PermissionCheck,
  PermissionContext,
  UserPermissions,
} from '../types/system';

export interface UsePermissionsReturn {
  // Core permission checking
  hasPermission: (permission: Permission, context?: PermissionContext) => boolean;
  hasPermissions: (checks: PermissionCheck[]) => boolean;

  // Role checking utilities
  isSystemAdmin: boolean;
  isSuperAdmin: boolean;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Raw permissions for advanced use cases
  permissions: UserPermissions | null;

  // Session management
  refreshPermissions: () => void;
}

/**
 * Hook for checking user permissions in components
 */
export function usePermissions(context?: PermissionContext): UsePermissionsReturn {
  const {
    data: session,
    status,
    update,
  } = useSession() as {
    data: EnhancedSession | null;
    status: string;
    update: () => void;
  };

  const permissions = useMemo(() => {
    if (session?.permissions) {
      return session.permissions.permissions;
    }
    return getUserPermissionsFromSession(session);
  }, [session]);

  const isLoading = status === 'loading';
  const error = status === 'unauthenticated' ? 'Not authenticated' : null;

  // Core permission checking functions
  const checkPermission = (permission: Permission, permissionContext?: PermissionContext) => {
    if (!permissions) return false;
    return hasPermission(permissions, permission, permissionContext || context);
  };

  const checkPermissions = (checks: PermissionCheck[]) => {
    if (!permissions) return false;
    return hasPermissions(permissions, checks);
  };

  // Role checking utilities
  const roleChecks = useMemo(() => {
    if (!permissions) {
      return {
        isSystemAdmin: false,
        isSuperAdmin: false,
      };
    }

    return {
      isSystemAdmin: isSystemAdmin(permissions),
      isSuperAdmin: isSuperAdmin(permissions),
    };
  }, [permissions]);

  const refreshPermissions = () => {
    update();
  };

  return {
    hasPermission: checkPermission,
    hasPermissions: checkPermissions,
    isSystemAdmin: roleChecks.isSystemAdmin,
    isSuperAdmin: roleChecks.isSuperAdmin,
    isLoading,
    error,
    permissions,
    refreshPermissions,
  };
}
