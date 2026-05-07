import { InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { z } from 'zod';

import { adminProcedure, createTRPCRouter, publicProcedure } from '@/server/api/trpc';

export const invitationsRouter = createTRPCRouter({
  // Create invitation (admin)
  createInvitation: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        roleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generate unique token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const invitation = await ctx.prisma.roleInvitation.create({
        data: {
          email: input.email,
          roleId: input.roleId,
          invitedBy: ctx.session.user.id,
          token,
          expiresAt,
          status: InvitationStatus.PENDING,
        },
        include: {
          role: true,
        },
      });

      // Log invitation email to console (development mode)
      console.info('='.repeat(80));
      console.info('📧 ROLE INVITATION EMAIL (Development Mode)');
      console.info('='.repeat(80));
      console.info(`To: ${input.email}`);
      console.info(`Role: ${invitation.role.name}`);
      console.info(`Invitation Link: ${process.env.NEXTAUTH_URL}/accept-invitation/${token}`);
      console.info(`Expires: ${expiresAt.toLocaleDateString()}`);
      console.info(`Timestamp: ${new Date().toISOString()}`);
      console.info('='.repeat(80));

      return invitation;
    }),

  // Validate invitation token (public)
  validateInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.roleInvitation.findUnique({
        where: { token: input.token },
        include: {
          role: true,
        },
      });

      if (!invitation) {
        return { valid: false, reason: 'INVALID_TOKEN' };
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        return { valid: false, reason: 'ALREADY_ACCEPTED', invitation };
      }

      if (invitation.expiresAt < new Date()) {
        return { valid: false, reason: 'EXPIRED', invitation };
      }

      return { valid: true, invitation };
    }),

  // Accept invitation (authenticated user)
  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.roleInvitation.findUnique({
        where: { token: input.token },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error('Invitation has already been accepted');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Update invitation status
      await ctx.prisma.roleInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Assign role to user
      await ctx.prisma.userRoleAssignment.create({
        data: {
          userId: input.userId,
          roleId: invitation.roleId,
        },
      });

      return { success: true };
    }),

  // Resend invitation (admin)
  resendInvitation: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.roleInvitation.findUnique({
        where: { id: input.id },
        include: {
          role: true,
        },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Generate new token and expiration
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const updatedInvitation = await ctx.prisma.roleInvitation.update({
        where: { id: input.id },
        data: {
          token,
          expiresAt,
          status: InvitationStatus.PENDING,
        },
        include: {
          role: true,
        },
      });

      // Log resend email to console
      console.info('='.repeat(80));
      console.info('📧 RESENT ROLE INVITATION EMAIL (Development Mode)');
      console.info('='.repeat(80));
      console.info(`To: ${updatedInvitation.email}`);
      console.info(`Role: ${updatedInvitation.role.name}`);
      console.info(`Invitation Link: ${process.env.NEXTAUTH_URL}/accept-invitation/${token}`);
      console.info(`Expires: ${expiresAt.toLocaleDateString()}`);
      console.info(`Timestamp: ${new Date().toISOString()}`);
      console.info('='.repeat(80));

      return updatedInvitation;
    }),

  // Get all invitations (admin)
  getAllInvitations: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.roleInvitation.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),
});
