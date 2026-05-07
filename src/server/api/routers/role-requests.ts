import { RoleRequestStatus } from '@prisma/client';
import { z } from 'zod';

import { adminProcedure, createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const roleRequestsRouter = createTRPCRouter({
  // Create role request (user)
  createRequest: protectedProcedure
    .input(
      z.object({
        roleId: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user already has this role
      const existingRole = await ctx.prisma.userRoleAssignment.findFirst({
        where: {
          userId,
          roleId: input.roleId,
        },
      });

      if (existingRole) {
        throw new Error('You already have this role assigned');
      }

      // Check if there's already a pending request
      const existingRequest = await ctx.prisma.roleRequest.findFirst({
        where: {
          userId,
          roleId: input.roleId,
          status: RoleRequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        throw new Error('You already have a pending request for this role');
      }

      return ctx.prisma.roleRequest.create({
        data: {
          userId,
          roleId: input.roleId,
          requestMessage: input.message,
          status: RoleRequestStatus.PENDING,
        },
        include: {
          role: true,
        },
      });
    }),

  // Get current user's requests
  getUserRequests: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return ctx.prisma.roleRequest.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  // Get all pending requests (admin)
  getPendingRequests: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.roleRequest.findMany({
      where: {
        status: RoleRequestStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }),

  // Get all requests (admin)
  getAllRequests: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.roleRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  // Approve request (admin)
  approveRequest: adminProcedure
    .input(
      z.object({
        id: z.string(),
        response: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.roleRequest.findUnique({
        where: { id: input.id },
        include: { role: true },
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== RoleRequestStatus.PENDING) {
        throw new Error('Request has already been processed');
      }

      // Update request status
      await ctx.prisma.roleRequest.update({
        where: { id: input.id },
        data: {
          status: RoleRequestStatus.APPROVED,
          reviewedBy: ctx.session.user.id,
          responseMessage: input.response,
          reviewedAt: new Date(),
        },
      });

      // Assign role to user
      await ctx.prisma.userRoleAssignment.create({
        data: {
          userId: request.userId,
          roleId: request.roleId,
        },
      });

      return ctx.prisma.roleRequest.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          role: true,
        },
      });
    }),

  // Reject request (admin)
  rejectRequest: adminProcedure
    .input(
      z.object({
        id: z.string(),
        response: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.roleRequest.findUnique({
        where: { id: input.id },
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== RoleRequestStatus.PENDING) {
        throw new Error('Request has already been processed');
      }

      return ctx.prisma.roleRequest.update({
        where: { id: input.id },
        data: {
          status: RoleRequestStatus.REJECTED,
          reviewedBy: ctx.session.user.id,
          responseMessage: input.response,
          reviewedAt: new Date(),
        },
        include: {
          user: true,
          role: true,
        },
      });
    }),
});
