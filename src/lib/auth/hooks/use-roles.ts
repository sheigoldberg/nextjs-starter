'use client';

import { api } from '@/utils/api';

/**
 * Roles Hooks
 *
 * Thin wrappers around tRPC procedures for roles.
 * Components should extract types from RouterOutputs, not from these hooks.
 *
 * ✅ CORRECT: Components extract types directly from RouterOutputs
 * ❌ WRONG: Export types from hook files (creates type drift)
 */

// Hook to get all available roles (for role requests - any authenticated user)
export function useRoles() {
  return api.roles.getAll.useQuery();
}

// Hook to get all roles with full details (admin)
export function useAdminRoles() {
  return api.roles.getRoles.useQuery();
}

// Hook to get current user's role assignments
export function useUserRoles() {
  return api.userRoles.getUserRoles.useQuery();
}

// Hook to get a specific role by ID (admin)
export function useRole(id: string | undefined) {
  return api.roles.getRole.useQuery({ id: id || '' }, { enabled: !!id });
}

// Hook to get all users with their roles (admin)
export function useUsers() {
  return api.userRoles.getUsers.useQuery();
}
