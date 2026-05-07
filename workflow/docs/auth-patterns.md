# Authentication Patterns

How authentication works in this monorepo: JWT strategy, Google OAuth, session types, server-side utilities, middleware, and protected routes.

---

## Architecture Overview

```
Google OAuth
     ↓
NextAuth v4 (JWT strategy)
     ↓  (JWT callback enriches token with id + role)
JWT stored in cookie
     ↓
getServerSession(authOptions)     ← server components, server actions, tRPC context
useSession()                      ← client components
getToken({ req })                 ← middleware (edge runtime)
```

**JWT strategy (not database sessions):** Sessions are stored in a signed JWT cookie, not in the database. This means:

- No `Session` table in Prisma schema
- Auth checks use `getServerSession()` not `getSession()`
- The JWT callback is the only place to enrich session data from the database
- Token data is available instantly without a DB query on every request

---

## 1. NextAuth Configuration

Auth is configured once per app using `createAuthOptions()` from `@repo/auth-config`:

```typescript
// apps/sheigoldberg.com/src/lib/auth.ts
import { createAuthOptions } from '@repo/auth-config';

import env from '@/config/env/server';
import { prisma } from '@/lib/prisma';

export const authOptions = createAuthOptions({
  prisma,
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
});
```

**What `createAuthOptions` configures:**

- `PrismaAdapter` — automatically creates/syncs `User`, `Account`, `Session` records
- JWT session strategy (no database sessions)
- Google OAuth with `openid email profile` scopes
- `allowDangerousEmailAccountLinking: true` — links Google accounts to existing users by email
- JWT callback — enriches token with `id` and `role` from the Prisma user
- Session callback — populates `session.user` with `id` and `role` from token

**The NextAuth route handler (one file, no custom logic):**

```typescript
// apps/sheigoldberg.com/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth/next';

import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## 2. Session Type Augmentation

NextAuth's default `Session` type does not include `id` or `role`. The monorepo extends it using TypeScript module augmentation in `packages/auth/src/types/session.ts`:

```typescript
// packages/auth/src/types/session.ts
import { UserRole } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
    accessToken?: string;
  }

  interface User {
    role: UserRole; // available in JWT callback's `user` param
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    accessToken?: string;
  }
}
```

**This file must be imported** wherever `authOptions` is used, so the type augmentation is applied. `@repo/auth-config` imports it automatically:

```typescript
// packages/auth-config/src/create-auth-options.ts
import '@repo/auth/src/types/session';

// apply type augmentation
```

After this, `session.user.id` and `session.user.role` are fully typed throughout the codebase.

---

## 3. JWT Callback Flow

The JWT callback runs on every sign-in and token refresh. It's the only place to enrich the JWT with database values:

```typescript
// Inside createAuthOptions — runs at sign-in
async jwt({ token, user, account }) {
  if (user) {
    // `user` is only present on initial sign-in
    return {
      ...token,
      id: user.id,           // Prisma user.id
      role: user.role,       // Prisma user.role (UserRole enum)
      accessToken: account?.access_token,
    };
  }
  return token;  // subsequent requests just pass token through
},

// Session callback — runs on every session access
async session({ session, token }) {
  return {
    ...session,
    user: {
      ...session.user,
      id: token.id,          // from JWT
      role: token.role,      // from JWT
    },
  };
},
```

**Key implication:** `role` in the session comes from the JWT token, which was set at sign-in time. If a user's role changes in the database, they must sign out and back in for the session to reflect the new role.

---

## 4. Server-Side Auth Utilities

Two utilities in `apps/sheigoldberg.com/src/lib/auth.ts` for use in server components, server actions, and non-tRPC API routes:

```typescript
// Get the current user (or null if not authenticated)
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

// Require a specific role — throws if not authorized
export async function checkRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Not authorized');
  }
  return user;
}
```

**Usage pattern in server components and actions:**

```typescript
// Server component
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <div>Welcome {user.name}</div>;
}

// Server action (Option C pattern)
'use server';
import { getCurrentUser } from '@/lib/auth';

export async function validateAdminAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  if (user.role !== 'ADMIN') return { success: false, error: 'Not authorized' };
  return { success: true, validatedData: { userId: user.id } };
}
```

---

## 5. tRPC Context — Session in Procedures

The tRPC context factory provides `session` to all procedures via `ctx.session`:

```typescript
// apps/sheigoldberg.com/src/server/api/context.ts
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function createTRPCContext(opts: CreateNextContextOptions) {
  const session = await getServerSession(authOptions);
  return { prisma, session };
}
```

Inside a procedure:

```typescript
protectedProcedure.query(async ({ ctx }) => {
  // ctx.session.user.id — typed as string (from session type augmentation)
  // ctx.session.user.role — typed as UserRole
  return ctx.prisma.user.findUnique({ where: { id: ctx.session.user.id } });
});
```

`protectedProcedure` middleware throws `UNAUTHORIZED` if `ctx.session` is null. `adminProcedure` additionally requires `role === 'ADMIN' || role === 'SUPER_ADMIN'`.

---

## 6. Client-Side Session Access

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function ProfileButton() {
  const { data: session, status } = useSession();
  //            ↑ typed with augmented Session — session.user.id and session.user.role available

  if (status === 'loading') return <Skeleton />;
  if (!session) return <SignInButton />;

  return <div>{session.user.name} ({session.user.role})</div>;
}
```

`status` values: `'loading'` | `'authenticated'` | `'unauthenticated'`

---

## 7. Provider Setup

The root `providers.tsx` wires the complete client-side provider stack. Order matters:

```typescript
// apps/sheigoldberg.com/src/app/providers.tsx
'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import superjson from 'superjson';
import { PHProvider } from '@/lib/posthog/posthog-provider';
import { api } from '@/utils/api';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,   // 5 minutes — data considered fresh
          gcTime: 10 * 60 * 1000,     // 10 minutes — cache retained after unmount
        },
      },
    })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,   // handles Date, BigInt, Map, Set serialization
        }),
      ],
    })
  );

  return (
    <PHProvider>                                          {/* PostHog analytics */}
      <api.Provider client={trpcClient} queryClient={queryClient}>  {/* tRPC */}
        <QueryClientProvider client={queryClient}>       {/* React Query */}
          <SessionProvider>                              {/* NextAuth */}
            <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </NextThemesProvider>
          </SessionProvider>
        </QueryClientProvider>
      </api.Provider>
    </PHProvider>
  );
}
```

**Why `superjson`:** tRPC serializes responses as JSON. JavaScript `Date` objects become strings without superjson. With superjson, Prisma `DateTime` fields arrive as real `Date` objects in components.

**React Query defaults:**

- `staleTime: 5min` — queries won't refetch on focus/remount if data is less than 5 minutes old
- `gcTime: 10min` — cached data is retained for 10 minutes after a query unmounts (enables fast back-navigation)

---

## 8. Middleware — Edge-Level Route Protection

```typescript
// apps/sheigoldberg.com/src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req });

  // 1. No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. Admin routes require ADMIN or SUPER_ADMIN role
  if (pathname.startsWith('/admin')) {
    const userRole = token.role as string;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      const url = new URL('/unauthorized', req.url);
      url.searchParams.set('reason', 'insufficient_permissions');
      url.searchParams.set('attempted_route', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. Pass user context in headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-role', String(token.role) || 'USER');
  requestHeaders.set('x-user-id', token.sub || '');
  requestHeaders.set('x-user-country', req.geo?.country || 'US');

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Only run middleware on these routes — public routes are NOT matched
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*', '/settings/:path*'],
};
```

**Two-layer protection strategy:**

1. **Middleware (edge)** — fast, runs before the page renders, handles unauthenticated redirects and admin role checks
2. **Page/component level (client)** — secondary check using `useSession()` for rendering decisions; provides a graceful fallback UI rather than a hard redirect

**The `x-user-*` headers** allow server components to read user context without calling `getServerSession()` again:

```typescript
// Server component — read from headers instead of calling getServerSession
import { headers } from 'next/headers';

const userId = headers().get('x-user-id');
const userRole = headers().get('x-user-role');
```

---

## 9. Anti-Patterns

```typescript
// ❌ WRONG — using getSession() (client-side only, doesn't work in server components)
const session = await getSession();

// ✅ CORRECT — getServerSession with authOptions
const session = await getServerSession(authOptions);

// ❌ WRONG — defining authOptions inline in the NextAuth route handler
export default NextAuth({ providers: [...] });

// ✅ CORRECT — authOptions in lib/auth.ts, imported everywhere needed
export const authOptions = createAuthOptions({ prisma, ... });

// ❌ WRONG — accessing session.user.id without type augmentation import
// Will cause TypeScript error: Property 'id' does not exist
import '@repo/auth/src/types/session';  // ← this import is what enables the types

// ❌ WRONG — assuming role changes take effect immediately in session
// Role is embedded in JWT at sign-in. Must sign out/in to reflect DB changes.
```
