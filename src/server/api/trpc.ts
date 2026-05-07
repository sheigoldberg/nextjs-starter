import { TRPCError, initTRPC } from '@trpc/server';
import { type PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';

type CreateContextOptions = {
  session: {
    user: { id: string; role: string };
    expires?: string;
  } | null;
  prisma: PrismaClient;
};

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma: opts.prisma,
  };
};

export const createTRPCContext = async (_req: Request) => {
  const session = await getServerSession(authOptions);

  return createInnerTRPCContext({
    session: session
      ? { user: { id: session.user.id, role: session.user.role as string }, expires: session.expires }
      : null,
    prisma,
  });
};

const t = initTRPC.context<ReturnType<typeof createInnerTRPCContext>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const enforceUserHasRole = (allowedRoles: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    return next({ ctx: { ...ctx, session: ctx.session } });
  });

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserHasRole(['ADMIN', 'SUPER_ADMIN']));
export const superAdminProcedure = t.procedure.use(enforceUserHasRole(['SUPER_ADMIN']));

export const requireAdminOrPermission = (permission: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const { id: userId, role: userRole } = ctx.session.user;
    const isSystemAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (isSystemAdmin) {
      return next({ ctx: { ...ctx, session: ctx.session } });
    }

    const roleAssignments = await ctx.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const hasPermission = roleAssignments.some((assignment) =>
      assignment.role.permissions.some((rp) => rp.permission.name === permission)
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required: ADMIN role or "${permission}" permission`,
      });
    }

    return next({ ctx: { ...ctx, session: ctx.session } });
  });
