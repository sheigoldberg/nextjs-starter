import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import '@/lib/auth';

export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.delete({
      where: { id: ctx.session.user.id },
    });
  }),
});
