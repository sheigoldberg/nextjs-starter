import { z } from 'zod';

import { createRoleSchema, updateRoleSchema } from '@/lib/auth';
import { adminProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const rolesRouter = createTRPCRouter({
  // Get all roles (for role requests - any authenticated user)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }),

  // Get all roles (admin - full details)
  getRoles: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }),

  // Get single role by ID
  getRole: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.prisma.role.findUnique({
      where: { id: input.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });
  }),

  // Create new role
  createRole: adminProcedure.input(createRoleSchema).mutation(async ({ ctx, input }) => {
    const { permissionIds, ...roleData } = input;

    return ctx.prisma.role.create({
      data: {
        ...roleData,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permission: {
              connect: { id: permissionId },
            },
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }),

  // Update existing role
  updateRole: adminProcedure.input(updateRoleSchema).mutation(async ({ ctx, input }) => {
    const { id, permissionIds, ...roleData } = input;

    // Delete existing permission associations and create new ones
    await ctx.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    return ctx.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        permissions: permissionIds
          ? {
              create: permissionIds.map((permissionId) => ({
                permission: {
                  connect: { id: permissionId },
                },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }),

  // Delete role
  deleteRole: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if role has users assigned
      const roleWithUsers = await ctx.prisma.role.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
      });

      if (roleWithUsers && roleWithUsers._count.userRoles > 0) {
        throw new Error(
          `Cannot delete role with ${roleWithUsers._count.userRoles} assigned user(s)`
        );
      }

      return ctx.prisma.role.delete({
        where: { id: input.id },
      });
    }),
});
