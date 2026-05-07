import { InvitationStatus, RoleRequestStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Zod Validation Schemas for RBAC
 *
 * These schemas validate user input for roles, permissions, and requests.
 */

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name too long'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updateRoleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Role name is required').max(100, 'Role name too long').optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export const deleteRoleSchema = z.object({
  id: z.string(),
});

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional(),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
});

// User role assignment schemas
export const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

export const removeRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

// Role request schemas
export const createRoleRequestSchema = z.object({
  roleId: z.string(),
  requestMessage: z.string().optional(),
});

export const reviewRoleRequestSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(RoleRequestStatus),
  responseMessage: z.string().optional(),
});

// Role invitation schemas
export const createInvitationSchema = z.object({
  email: z.string().email('Valid email is required'),
  roleId: z.string(),
  message: z.string().optional(),
});

export const validateInvitationSchema = z.object({
  token: z.string(),
});

export const acceptInvitationSchema = z.object({
  token: z.string(),
});

// Type exports for use in tRPC procedures
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>;
export type CreateRoleRequestInput = z.infer<typeof createRoleRequestSchema>;
export type ReviewRoleRequestInput = z.infer<typeof reviewRoleRequestSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type ValidateInvitationInput = z.infer<typeof validateInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
