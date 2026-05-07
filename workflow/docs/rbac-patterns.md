# RBAC Patterns — Role-Based Access Control

How the two-tier permission system works: system-level roles and database-driven custom roles with fine-grained permissions.

---

## Architecture Overview

This monorepo uses a **two-tier permission system**:

```
Tier 1 — System RBAC (UserRole enum)
  USER | ADMIN | SUPER_ADMIN
  └── Stored on User model, embedded in JWT at sign-in
  └── Checked in middleware (edge) and adminProcedure (tRPC)
  └── Fast — no database query required

Tier 2 — Database RBAC (Role → Permission model)
  Custom roles with named permissions (resource + action)
  └── Stored in Role, Permission, UserRoleAssignment tables
  └── Checked via hasRbacPermission() — requires a DB query
  └── Flexible — admins can create/modify roles at runtime
```

**When to use each tier:**
- Use **Tier 1** for coarse-grained access control (admin vs. non-admin, system-level operations)
- Use **Tier 2** for fine-grained, domain-specific permissions (e.g. `posts:approve`, `users:manage`)

---

## 1. Tier 1 — System RBAC

### The `UserRole` enum

Defined in `packages/database/prisma/schema.prisma`:

```prisma
enum UserRole {
  USER        // Default — authenticated, no elevated privileges
  ADMIN       // Can access admin panel, approve requests, manage users
  SUPER_ADMIN // Full platform access, can manage admins
}

model User {
  id    String   @id @default(cuid())
  role  UserRole @default(USER)
  // ...
}
```

`role` is embedded in the JWT at sign-in time via the JWT callback. It's available as `session.user.role` on the client and `ctx.session.user.role` in tRPC procedures — no database query required.

### System-level tRPC middleware

Three procedure types based on Tier 1 roles:

```typescript
// packages/api-core/src/trpc.ts

// No auth required
export const publicProcedure = t.procedure;

// Requires any authenticated session
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

// Requires ADMIN or SUPER_ADMIN role
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  const role = ctx.session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

### Middleware route protection (Tier 1)

Middleware at the edge uses Tier 1 roles to protect `/admin/*` routes:

```typescript
// apps/sheigoldberg.com/src/middleware.ts
if (pathname.startsWith('/admin')) {
  const userRole = token.role as string;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
}
```

---

## 2. Tier 2 — Database RBAC

### Data model

```prisma
// packages/database/prisma/schema.prisma

model Role {
  id          String  @id @default(cuid())
  name        String  @unique      // e.g. "content-editor", "post-approver"
  description String?

  permissions RolePermission[]     // role → permissions (many-to-many)
  userRoles   UserRoleAssignment[] // users assigned to this role
  requests    RoleRequest[]        // pending requests for this role
  invitations RoleInvitation[]     // invitations to this role
}

model Permission {
  id       String @id @default(cuid())
  name     String @unique            // e.g. "posts:approve"
  resource String                    // e.g. "posts"
  action   String                    // e.g. "approve"

  roles RolePermission[]
}

// Join table: Role ↔ Permission (many-to-many)
model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(...)
  permission   Permission @relation(...)
  @@id([roleId, permissionId])
}

// Join table: User ↔ Role (many-to-many)
model UserRoleAssignment {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())
  assignedBy String?
  @@id([userId, roleId])
}
```

### Permission naming convention

Permissions use a `resource:action` naming pattern:

| Name | Resource | Action | Meaning |
|---|---|---|---|
| `posts:approve` | `posts` | `approve` | Can approve posts for publication |
| `posts:delete` | `posts` | `delete` | Can delete any post |
| `users:manage` | `users` | `manage` | Can manage user accounts |
| `roles:assign` | `roles` | `assign` | Can assign roles to users |

### Permission resolution query

To check if a user has a permission, traverse: `User → UserRoleAssignment → Role → RolePermission → Permission`:

```typescript
// packages/auth/src/lib/rbac/permissions.ts

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const assignment = await prisma.userRoleAssignment.findFirst({
    where: {
      userId,
      role: {
        permissions: {
          some: {
            permission: { name: permissionName },
          },
        },
      },
    },
  });
  return !!assignment;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissionSet = new Set<string>();
  assignments.forEach((a) =>
    a.role.permissions.forEach((rp) => permissionSet.add(rp.permission.name))
  );
  return Array.from(permissionSet);
}
```

### Hybrid procedure middleware (Tier 1 OR Tier 2)

Some procedures should be accessible to system admins OR users with an explicit DB permission:

```typescript
// packages/api-core/src/middleware/require-admin-or-permission.ts

export const requireAdminOrPermission = (permission: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const role = ctx.session.user.role;
    const isSystemAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // System admins always pass — no DB query needed
    if (isSystemAdmin) return next({ ctx });

    // Others must have the explicit DB permission
    const hasPermissionResult = await hasRbacPermission(ctx.session.user.id, permission);
    if (!hasPermissionResult) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Required: ADMIN role or "${permission}" permission`,
      });
    }

    return next({ ctx });
  });

// Usage in a router:
approvePost: t.procedure
  .use(requireAdminOrPermission('posts:approve'))
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => { ... })
```

---

## 3. Role Request Workflow

Users can request access to a custom role. Admins approve or reject.

```
User submits RoleRequest (status: PENDING)
         ↓
Admin reviews in admin panel
         ↓
   ┌─────┴──────┐
APPROVED       REJECTED
   ↓
UserRoleAssignment created
User now has the role's permissions
```

### Creating a role request (user)

```typescript
// Enforces: not already assigned, no pending request
createRequest: protectedProcedure
  .input(z.object({ roleId: z.string(), message: z.string().optional() }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    // Business rule: user can't request a role they already have
    const existingRole = await ctx.prisma.userRoleAssignment.findFirst({
      where: { userId, roleId: input.roleId },
    });
    if (existingRole) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Role already assigned' });

    // Business rule: can't have two pending requests for the same role
    const existingRequest = await ctx.prisma.roleRequest.findFirst({
      where: { userId, roleId: input.roleId, status: RoleRequestStatus.PENDING },
    });
    if (existingRequest) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Request already pending' });

    return ctx.prisma.roleRequest.create({
      data: { userId, roleId: input.roleId, requestMessage: input.message, status: 'PENDING' },
      include: { role: true },
    });
  }),
```

### Approving a role request (admin)

```typescript
// Two-step: update request status + create assignment
approveRequest: adminProcedure
  .input(z.object({ id: z.string(), response: z.string().optional() }))
  .mutation(async ({ ctx, input }) => {
    const request = await ctx.prisma.roleRequest.findUnique({
      where: { id: input.id },
      include: { role: true },
    });
    if (!request) throw new TRPCError({ code: 'NOT_FOUND' });
    if (request.status !== 'PENDING') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already processed' });

    // Step 1: mark request as approved
    await ctx.prisma.roleRequest.update({
      where: { id: input.id },
      data: {
        status: 'APPROVED',
        reviewedBy: ctx.session.user.id,
        responseMessage: input.response,
        reviewedAt: new Date(),
      },
    });

    // Step 2: create the role assignment
    await ctx.prisma.userRoleAssignment.create({
      data: { userId: request.userId, roleId: request.roleId },
    });

    return ctx.prisma.roleRequest.findUnique({
      where: { id: input.id },
      include: { user: true, role: true },
    });
  }),
```

---

## 4. Role Invitation Workflow

Admins can invite users by email directly to a role, bypassing the request/approval flow.

```
Admin creates RoleInvitation (token generated, email sent)
         ↓
User receives email with invitation link
         ↓
User visits /accept-invitation/[token]
         ↓
validateInvitation procedure checks token validity + expiry
         ↓
User accepts → acceptInvitation procedure creates UserRoleAssignment
```

### Creating an invitation (admin)

```typescript
createInvitation: adminProcedure
  .input(z.object({ email: z.string().email(), roleId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Guard: user must not already exist
    const existingUser = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) throw new TRPCError({ code: 'BAD_REQUEST', message: 'User already exists' });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await ctx.prisma.roleInvitation.create({
      data: {
        email: input.email,
        roleId: input.roleId,
        invitedBy: ctx.session.user.id,
        token,
        expiresAt,
        status: 'PENDING',
      },
      include: { role: true },
    });

    // TODO: replace console.log with Resend email
    console.info(`Invitation link: /accept-invitation/${token}`);

    return invitation;
  }),
```

### Validating a token (public — called on page load)

```typescript
validateInvitation: publicProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ ctx, input }) => {
    const invitation = await ctx.prisma.roleInvitation.findUnique({
      where: { token: input.token },
      include: { role: true },
    });

    if (!invitation) return { valid: false, reason: 'INVALID_TOKEN' };
    if (invitation.status !== 'PENDING') return { valid: false, reason: 'ALREADY_ACCEPTED', invitation };
    if (invitation.expiresAt < new Date()) return { valid: false, reason: 'EXPIRED', invitation };

    return { valid: true, invitation };
  }),
```

---

## 5. Client-Side Permission Gates

### `usePermissions` hook

```typescript
import { usePermissions } from '@repo/auth';

export function ApprovePostButton({ postId }: { postId: string }) {
  const { hasPermission, isSystemAdmin, isLoading } = usePermissions();

  if (isLoading) return null;

  // Check a specific DB permission
  if (!hasPermission('posts:approve') && !isSystemAdmin) {
    return null;
  }

  return <Button onClick={() => approvePost.mutate({ id: postId })}>Approve</Button>;
}
```

### `PermissionGate` component

```typescript
import { PermissionGate } from '@repo/auth';

// Only renders children if user has the permission (or is system admin)
<PermissionGate permission="posts:approve">
  <ApprovePostButton postId={post.id} />
</PermissionGate>

// With fallback for unauthorized users
<PermissionGate permission="users:manage" fallback={<p>Access denied</p>}>
  <UserManagementPanel />
</PermissionGate>
```

### `AdminGate` component

```typescript
import { AdminGate } from '@repo/auth';

// Only renders children if user is ADMIN or SUPER_ADMIN (Tier 1 check — no DB query)
<AdminGate>
  <AdminOnlyFeature />
</AdminGate>

// With fallback
<AdminGate fallback={<UserDashboard />}>
  <AdminDashboard />
</AdminGate>
```

### `useRoles` hook (Tier 2 — fetches DB roles)

```typescript
import { useRoles } from '@repo/auth';

export function RoleSelector() {
  const { data: roles = [], isLoading } = useRoles();
  //        ↑ all available Role records from database

  return (
    <Select>
      {roles.map((role) => (
        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
      ))}
    </Select>
  );
}
```

---

## 6. Role-Conditional Navigation

The dashboard sidebar conditionally shows the Admin section based on Tier 1 role:

```typescript
// packages/features-dashboard/src/ui/components/layout/dashboard-layout.tsx
const createNavData = (user?: SessionUser) => ({
  navMain: [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Profile', url: '/profile' },
    // Admin nav only renders for ADMIN or SUPER_ADMIN
    ...(user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ? [{ title: 'Admin', url: '/admin' }]
      : []),
  ],
});
```

---

## 7. Summary — Which Check to Use

| Scenario | Use |
|---|---|
| Protect a page/route from unauthenticated users | Middleware matcher + `useSession()` client check |
| Protect admin pages/routes | Middleware admin role check |
| tRPC procedure requiring any logged-in user | `protectedProcedure` |
| tRPC procedure requiring ADMIN/SUPER_ADMIN | `adminProcedure` |
| tRPC procedure allowing admin OR specific DB permission | `requireAdminOrPermission('resource:action')` |
| Conditionally render UI for admins | `<AdminGate>` or `usePermissions().isSystemAdmin` |
| Conditionally render UI for a specific DB permission | `<PermissionGate permission="...">` |
| Server component/action auth check | `getCurrentUser()` from `@/lib/auth` |
