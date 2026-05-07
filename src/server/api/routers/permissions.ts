import { z } from 'zod';

import { adminProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const permissionsRouter = createTRPCRouter({
  // Get all permissions (admin only)
  getPermissions: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }),

  // Get current user's permissions
  getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get all role assignments for the user
    const userRoleAssignments = await ctx.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Flatten permissions from all roles
    const permissions = userRoleAssignments.flatMap((assignment: any) =>
      assignment.role.permissions.map((rp: any) => rp.permission.name)
    );

    // Return unique permissions
    return Array.from(new Set(permissions));
  }),

  // Check if user has specific permission
  hasPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const userRoleAssignments = await ctx.prisma.userRoleAssignment.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      const permissions = userRoleAssignments.flatMap((assignment: any) =>
        assignment.role.permissions.map((rp: any) => rp.permission.name)
      );

      return permissions.includes(input.permission);
    }),
});
