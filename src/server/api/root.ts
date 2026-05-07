import { createTRPCRouter } from '@/server/api/trpc';
import { profileRouter } from './routers/profile';
import { rolesRouter } from './routers/roles';
import { permissionsRouter } from './routers/permissions';
import { userRolesRouter } from './routers/user-roles';
import { roleRequestsRouter } from './routers/role-requests';
import { invitationsRouter } from './routers/invitations';

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  roles: rolesRouter,
  permissions: permissionsRouter,
  userRoles: userRolesRouter,
  roleRequests: roleRequestsRouter,
  invitations: invitationsRouter,
});

export type AppRouter = typeof appRouter;
