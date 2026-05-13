/**
 * NextAuth session integration with permission caching
 *
 * This module provides utilities for integrating the permission system
 * with NextAuth sessions, including caching and session management.
 */
import { Session } from 'next-auth';
import { UserRole } from '@prisma/client';

import { auth } from '@/auth';
import {
  PermissionContext,
  SessionPermissions,
  UserPermissions,
} from '../../types/system';
import { getPrismaClient } from '../rbac/prisma-client';

// No-op kept for backwards compatibility — no longer needed with NextAuth v5
export function setAuthOptions(_getter: unknown): void {}

/**
 * Enhanced session type with permissions
 */
export interface EnhancedSession extends Session {
  permissions?: SessionPermissions;
}

/**
 * Cache duration for permission data (5 minutes)
 */
const PERMISSION_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get current user session with permission caching
 */
export async function getCurrentSession(): Promise<EnhancedSession | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  // Check if we have cached permissions
  const cachedPermissions = await getCachedPermissions(session.user.email);
  if (cachedPermissions) {
    return {
      ...session,
      permissions: cachedPermissions,
    };
  }

  // Load fresh permissions from database
  const permissions = await loadUserPermissions(session.user.email);
  if (permissions) {
    // Cache the permissions
    await cachePermissions(session.user.email, permissions);

    return {
      ...session,
      permissions,
    };
  }

  return session;
}

/**
 * Load user permissions from database
 */
async function loadUserPermissions(email: string): Promise<SessionPermissions | null> {
  try {
    const user = await getPrismaClient().user.findUnique({
      where: { email },
    });

    if (!user) return null;

    // Determine system role
    let systemRole: UserRole = UserRole.USER;
    if (user.role === 'SUPER_ADMIN') {
      systemRole = UserRole.SUPER_ADMIN;
    } else if (user.role === 'ADMIN') {
      systemRole = UserRole.ADMIN;
    }

    const userPermissions: UserPermissions = {
      systemRole,
    };

    return {
      user: {
        id: user.id,
        email: user.email || '',
      },
      permissions: userPermissions,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error loading user permissions:', error);
    return null;
  }
}

/**
 * In-memory cache for permissions (in production, use Redis or similar)
 */
const permissionCache = new Map<
  string,
  {
    permissions: SessionPermissions;
    expires: Date;
  }
>();

/**
 * Get cached permissions if available and not expired
 */
async function getCachedPermissions(email: string): Promise<SessionPermissions | null> {
  const cached = permissionCache.get(email);
  if (!cached) return null;

  if (cached.expires < new Date()) {
    permissionCache.delete(email);
    return null;
  }

  return cached.permissions;
}

/**
 * Cache permissions with expiration
 */
async function cachePermissions(email: string, permissions: SessionPermissions): Promise<void> {
  const expires = new Date(Date.now() + PERMISSION_CACHE_DURATION);
  permissionCache.set(email, {
    permissions,
    expires,
  });
}

/**
 * Invalidate cached permissions for a user
 */
export async function invalidateUserPermissions(email: string): Promise<void> {
  permissionCache.delete(email);
}

/**
 * Invalidate cached permissions for all users in an organization
 */
export async function invalidateOrganizationPermissions(organizationId: string): Promise<void> {
  // No organization memberships in basic starter
  // This function is a no-op but kept for compatibility
}

/**
 * Get user permissions with context switching
 */
export async function getUserPermissionsWithContext(
  session: EnhancedSession | null,
  context?: PermissionContext
): Promise<{ permissions: UserPermissions; context?: PermissionContext } | null> {
  if (!session?.permissions) return null;

  const result = {
    permissions: session.permissions.permissions,
    context: context || session.permissions.currentContext,
  };

  return result;
}

/**
 * Update session context (for organization switching)
 */
export async function updateSessionContext(
  email: string,
  context: PermissionContext
): Promise<void> {
  const cached = permissionCache.get(email);
  if (cached) {
    cached.permissions.currentContext = context;
  }
}

/**
 * Utility to get current user with permissions (for API routes)
 */
export async function getCurrentUser(): Promise<{
  user: { id: string; email: string };
  permissions: UserPermissions;
} | null> {
  const session = await getCurrentSession();
  if (!session?.permissions) return null;

  return {
    user: session.permissions.user,
    permissions: session.permissions.permissions,
  };
}

/**
 * Check if session needs permission refresh
 */
export function sessionNeedsRefresh(session: EnhancedSession): boolean {
  if (!session.permissions) return true;

  const age = Date.now() - session.permissions.lastUpdated.getTime();
  return age > PERMISSION_CACHE_DURATION;
}

/**
 * Refresh session permissions
 */
export async function refreshSessionPermissions(
  session: EnhancedSession
): Promise<EnhancedSession> {
  if (!session.user?.email) return session;

  // Invalidate cache and reload
  await invalidateUserPermissions(session.user.email);
  return (await getCurrentSession()) || session;
}
