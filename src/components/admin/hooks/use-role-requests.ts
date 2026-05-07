'use client';

import { api } from '@/utils/api';

/**
 * Role Requests Hooks
 *
 * Thin wrappers around tRPC procedures for role requests.
 * Components should extract types from RouterOutputs, not from these hooks.
 *
 * ✅ CORRECT: Components extract types directly from RouterOutputs
 * ❌ WRONG: Export types from hook files (creates type drift)
 */

// Hook to get current user's role requests
export function useUserRoleRequests() {
  return api.roleRequests.getUserRequests.useQuery();
}

// Hook to create a role request
export function useCreateRoleRequest() {
  const utils = api.useUtils();

  return api.roleRequests.createRequest.useMutation({
    onSuccess: () => {
      // Invalidate role requests to refetch the updated data
      void utils.roleRequests.getUserRequests.invalidate();
    },
  });
}

// Hook to get all pending role requests (admin only)
export function usePendingRoleRequests() {
  return api.roleRequests.getPendingRequests.useQuery();
}

// Hook to get all role requests (admin only)
export function useAllRoleRequests() {
  return api.roleRequests.getAllRequests.useQuery();
}

// Hook to approve a role request (admin only)
export function useApproveRoleRequest() {
  const utils = api.useUtils();

  return api.roleRequests.approveRequest.useMutation({
    onSuccess: () => {
      // Invalidate all role request queries
      void utils.roleRequests.invalidate();
      void utils.userRoles.invalidate();
    },
  });
}

// Hook to reject a role request (admin only)
export function useRejectRoleRequest() {
  const utils = api.useUtils();

  return api.roleRequests.rejectRequest.useMutation({
    onSuccess: () => {
      // Invalidate role requests to refetch the updated data
      void utils.roleRequests.invalidate();
    },
  });
}
