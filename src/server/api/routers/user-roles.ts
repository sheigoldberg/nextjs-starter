import { z } from 'zod';

import { createTRPCRouter, protectedProcedure, requireAdminOrPermission } from '@/server/api/trpc';

export const userRolesRouter = createTRPCRouter({
  // Get current user's roles
  getUserRoles: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.userRoleAssignment.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        role: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }),

  // Get all users with their roles
  // Requires: System admin OR users.manage_roles permission
  getUsers: protectedProcedure
    .use(requireAdminOrPermission('users.manage_roles'))
    .input(
      z
        .object({
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findMany({
        take: input?.limit,
        skip: input?.offset,
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),

  // Get specific user's roles (admin)
  // Requires: System admin OR users.manage_roles permission
  getUserRolesByUserId: protectedProcedure
    .use(requireAdminOrPermission('users.manage_roles'))
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userRoleAssignment.findMany({
        where: { userId: input.userId },
        include: {
          role: true,
        },
      });
    }),

  // Assign role to user
  // Requires: System admin OR users.manage_roles permission
  assignRole: protectedProcedure
    .use(requireAdminOrPermission('users.manage_roles'))
    .input(
      z.object({
        userId: z.string(),
        roleIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, roleIds } = input;

      // Remove all existing role assignments
      await ctx.prisma.userRoleAssignment.deleteMany({
        where: { userId },
      });

      // Create new role assignments
      if (roleIds.length > 0) {
        await ctx.prisma.userRoleAssignment.createMany({
          data: roleIds.map((roleId) => ({
            userId,
            roleId,
          })),
        });
      }

      // Return updated user with roles
      return ctx.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      });
    }),

  // Remove role from user
  // Requires: System admin OR users.manage_roles permission
  removeRole: protectedProcedure
    .use(requireAdminOrPermission('users.manage_roles'))
    .input(
      z.object({
        userId: z.string(),
        roleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userRoleAssignment.deleteMany({
        where: {
          userId: input.userId,
          roleId: input.roleId,
        },
      });

      return ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      });
    }),
});
