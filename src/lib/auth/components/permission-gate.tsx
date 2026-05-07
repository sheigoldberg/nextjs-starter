'use client';

import { ReactNode } from 'react';
import { UserRole } from '@prisma/client';

import { usePermissions } from '../hooks/use-permissions';
import { Permission, PermissionCheck, PermissionContext } from '../types/system';

/**
 * Reusable component for conditional rendering based on permissions
 *
 * PermissionGate component that conditionally renders children based on
 * user permissions, roles, and context. Provides flexible permission
 * checking for UI elements.
 */

interface PermissionGateProps {
  children: ReactNode;

  // Permission-based access
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // For multiple permissions

  // Role-based access
  systemRole?: UserRole | UserRole[];

  // Context for permission checking
  context?: PermissionContext;

  // Advanced permission checks
  checks?: PermissionCheck[];

  // Custom permission function
  custom?: (permissions: any) => boolean;

  // Fallback content when access is denied
  fallback?: ReactNode;

  // Loading state
  loading?: ReactNode;

  // Debug mode (shows permission info)
  debug?: boolean;
}

/**
 * Permission gate component for conditional rendering
 */
export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  systemRole,
  context,
  checks = [],
  custom,
  fallback = null,
  loading = null,
  debug = false,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasPermissions,
    isSystemAdmin,
    isSuperAdmin,
    isLoading,
    permissions: userPermissions,
  } = usePermissions(context);

  // Show loading state
  if (isLoading) {
    return <>{loading}</>;
  }

  // Debug mode - show permission information
  if (debug) {
    console.log('PermissionGate Debug:', {
      userPermissions,
      requestedPermission: permission,
      requestedPermissions: permissions,
      systemRole,
      context,
      checks,
    });
  }

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = hasAccess && hasPermission(permission, context);
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && permissions.every((p) => hasPermission(p, context));
    } else {
      hasAccess = hasAccess && permissions.some((p) => hasPermission(p, context));
    }
  }

  // Check system roles
  if (systemRole) {
    const roles = Array.isArray(systemRole) ? systemRole : [systemRole];
    const userSystemRole = userPermissions?.systemRole;

    if (userSystemRole) {
      const roleMatches = roles.includes(userSystemRole);
      hasAccess = hasAccess && roleMatches;
    } else {
      hasAccess = false;
    }
  }

  // Check advanced permission checks
  if (checks.length > 0) {
    hasAccess = hasAccess && hasPermissions(checks);
  }

  // Check custom permission function
  if (custom) {
    hasAccess = hasAccess && custom(userPermissions);
  }

  // Render children if access is granted, fallback otherwise
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-order component for permission-based conditional rendering
 */
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<PermissionGateProps, 'children'>
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate {...permissionProps}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * Specialized permission gates for common use cases
 */

// Admin-only content
export function AdminGate({
  children,
  fallback = null,
  superAdminOnly = false,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  superAdminOnly?: boolean;
}) {
  return (
    <PermissionGate
      systemRole={
        superAdminOnly ? UserRole.SUPER_ADMIN : [UserRole.ADMIN, UserRole.SUPER_ADMIN]
      }
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Permission-aware button component
 */
interface PermissionButtonProps extends PermissionGateProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PermissionButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
  ...permissionProps
}: PermissionButtonProps) {
  const { hasPermission } = usePermissions(permissionProps.context);

  // Check if user has required permissions
  const hasAccess = permissionProps.permission
    ? hasPermission(permissionProps.permission, permissionProps.context)
    : true;

  if (!hasAccess) {
    return null; // Don't render button if no access
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {children}
    </button>
  );
}
