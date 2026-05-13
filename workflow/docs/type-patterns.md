# Type Patterns — tRPC, Prisma, Zod, and Client Data Flow

How types flow through this app: from the Prisma schema to the tRPC router, through Zod schemas and React Query hooks, into UI components — with the complete Option C architecture for type-safe server actions.

---

## The Type Flow

```
prisma/schema.prisma
       ↓  (Prisma generates model types and enums)
src/lib/auth/types/          ← domain types, Zod schemas, re-exported enums
src/server/api/routers/      ← input from Zod schemas, output inferred from Prisma
       ↓  (tRPC infers full router type)
src/server/api/root.ts       (AppRouter type)
       ↓
src/utils/api.ts             (RouterOutputs, RouterInputs helpers)
       ↓
src/hooks/                   (thin wrappers — no type exports)
       ↓
Component files              (extract types from RouterOutputs directly)
```

---

## 1. The Two-Layer Type Architecture

This codebase uses two distinct layers of type safety. Understanding which layer a type belongs in, and why, is the most important architectural rule.

---

### Layer 1 — Prisma-inferred types (the default)

When a Prisma column has a concrete type — `String`, `Int`, `DateTime`, an enum, or a relation — TypeScript infers the full type from `ctx.prisma.*` return values. The type flows automatically:

```
Prisma schema → ctx.prisma.*() return type → RouterOutputs → component
```

You never write these types. If the schema changes, every component that uses the affected field updates at compile time with zero manual work.

**Use `RouterOutputs` for all Layer 1 data.** Never copy-paste or manually recreate types that Prisma already knows.

```typescript
// ✅ Layer 1 — derived from Prisma
type User = RouterOutputs['profile']['get'];
type Role = RouterOutputs['roles']['getAll'][number];
type RoleRequest = RouterOutputs['roleRequests']['getUserRequests'][number];
```

---

### Layer 2 — Zod-schema types (required in three specific situations)

Layer 2 is used when Prisma cannot express the type, when data crosses a trust boundary, or when TypeScript's structural inference produces types too complex to use safely. **The Zod schema is the source of truth. TypeScript types are derived from it via `z.infer<>` — never written by hand.**

```typescript
// ✅ Layer 2 — schema is the source, type is derived
export const updateProfileSchema = z.object({ name: z.string().min(2) });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

The same schema serves three jobs: it defines the TypeScript type, validates data on the write path (into the DB), and parses data on the read path (out of the DB).

---

### The three triggers for Layer 2

#### Trigger 1 — Prisma `Json` fields

When a column is `Json` or `Json?`, Prisma types it as `string | number | boolean | JsonObject | JsonArray | null`. This is useless — you need a Zod schema to express the actual shape.

**Write path:** validate and strip before inserting.
**Read path:** parse in the tRPC procedure so components receive a real typed value via `RouterOutputs`, not raw `Prisma.Json`.

```typescript
// src/lib/auth/types/schemas.ts
export const metadataSchema = z.record(z.string());
export type Metadata = z.infer<typeof metadataSchema>;

// src/server/api/routers/profile.ts — parse in the router, never in the component
get: protectedProcedure.query(async ({ ctx }) => {
  const user = await ctx.prisma.user.findUnique({ where: { id: ctx.session.user.id } });
  // Parse here — throws on corruption, never silently returns garbage
  const metadata = metadataSchema.parse(user.metadata);
  return { ...user, metadata }; // metadata is now Metadata, not Prisma.Json
})

// ❌ WRONG — never cast in the component
const metadata = data.metadata as unknown as Metadata;

// ✅ CORRECT — component gets RouterOutputs['profile']['get']['metadata']
// which is Metadata, fully typed, no cast needed
const metadata = data.metadata;
```

**Writing to a `Json` field:** Prisma's write type is `InputJsonValue`. Cast explicitly when writing from an already-validated value:

```typescript
import { Prisma } from '@prisma/client';

metadata: metadata as Prisma.InputJsonValue | undefined
```

---

#### Trigger 2 — External data boundaries

Any data that enters the system from outside — webhook payloads, form submissions, third-party API responses — must be validated at the boundary. TypeScript types only exist at compile time; a webhook can send anything at runtime.

```typescript
// validate an inbound webhook payload
const body = webhookPayloadSchema.safeParse(rawBody);
if (!body.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
// body.data is now typed and safe to use
```

tRPC `.input(schema)` handles this automatically for all tRPC procedures. External REST handlers (like `/api/webhooks/...`) need explicit parse calls.

---

#### Trigger 3 — Recursive / circular types

When a data structure references itself (tree nodes, comment threads, nested categories), TypeScript's type inference can struggle. Zod's `z.lazy()` breaks the cycle:

```typescript
// ❌ TypeScript alone — type inference can fail or produce deep circular types
type Comment = { id: string; replies: Comment[] };

// ✅ Zod with z.lazy() — schema explicitly declares the recursion
type Comment = z.infer<typeof commentSchema>;

const commentSchema: z.ZodType<Comment> = z.lazy(() =>
  z.object({
    id: z.string(),
    content: z.string(),
    replies: z.array(commentSchema),
  })
);
```

---

### Decision table

| Situation | Layer | Source of truth |
|---|---|---|
| Prisma column is a scalar (`String`, `Int`, `DateTime`, enum, relation) | 1 | Prisma schema → inferred via `RouterOutputs` |
| Prisma column is `Json` / `Json?` | 2 | Zod schema → `z.infer<>` + `.parse()` in router |
| Data enters from outside the system (webhook, API, form) | 2 | Zod schema → validate at the boundary |
| Type references itself (tree, thread, nested category) | 2 | Zod schema with `z.lazy()` |
| UI state, form state, client-only toggles | — | Manual type in component or `types/` folder |

---

### The Layer 2 implementation contract

When you identify a Layer 2 situation, all three of the following must be present:

1. **Schema defined in `src/lib/auth/types/schemas.ts` or a router's local `schemas.ts`** — exported, named, single source of truth
2. **TypeScript type derived via `z.infer<>`** — never a hand-written interface that duplicates the schema
3. **`.parse()` or `.safeParse()` called at the data boundary** — on write AND on read for Json fields, on entry for external boundaries

---

## 2. Type File Organization

Feature types live close to their router or in `src/lib/auth/types/`:

```
src/lib/auth/types/
├── session.ts    ← NextAuth module augmentation (id, role on session)
├── system.ts     ← UserRole enum, permission types
├── rbac.ts       ← RBAC role/permission types
└── schemas.ts    ← Zod schemas + z.infer<> type exports

src/server/api/routers/
└── profile.ts    ← Zod input schemas inline or imported from auth/types/schemas.ts
```

### Zod schemas — schema is the source of truth

```typescript
// src/lib/auth/types/schemas.ts
import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().optional(),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  id: z.string(),
});

// Types always derived from schemas — never written by hand
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
```

**The schema composition pattern:**
```typescript
const updateSchema = createSchema.partial().extend({ id: z.string() })
//                               ↑ all fields become optional
//                                              ↑ add required id field
```

**Never write this:**
```typescript
// ❌ WRONG — type can drift from schema
export interface CreateRoleInput {
  name: string;
  description?: string;
}
```

---

## 3. The Shared Schema Pattern (tRPC + React Hook Form)

The same Zod schema is the single source of truth for both the API input validation and the form validation:

```typescript
// Schema defined once in src/lib/auth/types/schemas.ts (or inline for simple cases)
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Used in tRPC router for API input validation:
update: protectedProcedure
  .input(profileFormSchema)          // ← same schema
  .mutation(async ({ ctx, input }) => { ... })

// Used in React Hook Form for client-side validation:
const form = useForm<z.infer<typeof profileFormSchema>>({
  resolver: zodResolver(profileFormSchema),  // ← same schema
});
```

---

## 4. Option C Architecture — tRPC Procedures and Server Actions

**This is the required pattern for all new tRPC work.**

| Responsibility | Where it lives | What it does |
|---|---|---|
| Input validation | Zod `.input()` on the procedure | Rejects malformed requests before they reach the handler |
| Business logic | Server action (`src/lib/actions.ts`) | Auth checks, business rules, notifications, pre-mutation validation |
| Database query | tRPC procedure handler | Owns the single Prisma query — this is where types are inferred |

### Why Option C produces zero type drift

The tRPC procedure's return type is inferred directly from its Prisma query. If the server action queries the database and returns results, that return type lives outside the tRPC type system and must be maintained manually.

**Option C keeps the database query inside the procedure.** This means Prisma's output flows directly into `RouterOutputs` with no manual type maintenance.

### The complete Option C pattern

```typescript
// 1. src/lib/actions.ts — business logic only, 'use server' directive
'use server';

import { getCurrentUser } from '@/lib/auth';

export async function validateProfileUpdate(data: {
  name?: string;
}): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required' };

  if (data.name && data.name.trim().length === 0) {
    return { success: false, error: 'Name cannot be empty' };
  }

  return { success: true };
}


// 2. src/server/api/routers/profile.ts — calls action for business logic, owns the DB query
update: protectedProcedure
  .input(z.object({ name: z.string().min(2).optional() }))
  .mutation(async ({ ctx, input }) => {
    const result = await validateProfileUpdate(input);
    if (!result.success) throw new TRPCError({ code: 'BAD_REQUEST', message: result.error });

    // tRPC procedure owns the single database query
    // Return type is inferred from Prisma here — this is what flows into RouterOutputs
    return ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: { name: input.name },
      select: { id: true, name: true, email: true, image: true },
    });
  }),
```

### What belongs in server actions vs. procedures

**Server action (`src/lib/actions.ts`):**
- Auth checks beyond what middleware covers
- Business rules that depend on external state or multiple conditions
- Sending emails, notifications, audit logs
- Pre-mutation validation requiring DB lookups
- Returns `{ success, error? }` — minimal metadata only

**tRPC procedure handler:**
- The single Prisma database query (always)
- Zod input validation (always — use `.input()`)
- Calling the server action when business logic is complex

**Anti-patterns:**
```typescript
// ❌ WRONG — server action queries DB and returns data
export async function createInvitation(data: CreateInvitationData) {
  const invitation = await prisma.invitation.create({ data });
  return { success: true, data: invitation };  // ← type lives outside tRPC
}

// ✅ CORRECT — action handles business logic, procedure owns the single query
export async function validateCreateInvitation(data: CreateInvitationData) {
  // business logic only — no DB mutations
}
create: protectedProcedure.mutation(async ({ ctx, input }) => {
  const { success, error } = await validateCreateInvitation(input);
  if (!success) throw new TRPCError({ message: error });
  return ctx.prisma.invitation.create({ data: input }); // single query
})
```

---

## 5. tRPC Router Types

### Input types come from Zod — never write them manually

```typescript
// src/server/api/routers/roles.ts
import { createRoleSchema } from '@/lib/auth/types/schemas';

export const rolesRouter = createTRPCRouter({
  create: adminProcedure
    .input(createRoleSchema)   // ← import from schemas
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.role.create({ data: input });
    }),
});
```

### Output types are inferred from Prisma — never annotate them

```typescript
// ✅ CORRECT — TypeScript infers return type from Prisma
getUserRequests: protectedProcedure.query(async ({ ctx }) => {
  return ctx.prisma.roleRequest.findMany({
    where: { userId: ctx.session.user.id },
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  });
}),

// ❌ WRONG — manual annotation can drift from what Prisma actually returns
getUserRequests: protectedProcedure.query(async ({ ctx }): Promise<RoleRequest[]> => {
  return ctx.prisma.roleRequest.findMany({ ... });
}),
```

### Prisma enums in Zod — always `z.nativeEnum()`

```typescript
import { UserRole } from '@prisma/client';

// ✅ CORRECT — stays in sync with Prisma schema automatically
const updateRoleSchema = z.object({
  id: z.string(),
  role: z.nativeEnum(UserRole),
});

// ❌ WRONG — duplicates the Prisma enum and will drift
const updateRoleSchema = z.object({
  id: z.string(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});
```

---

## 6. The `api.ts` Bridge

`src/utils/api.ts` is the single point where router types become accessible to the client:

```typescript
// src/utils/api.ts
import { createTRPCReact } from '@trpc/react-query';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from '@/server/api/root';

export const api = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
```

`RouterOutputs` is the single source of truth for all server data types on the client. Never manually define types that mirror what tRPC already returns.

---

## 7. Thin Hook Pattern

Hooks in `src/hooks/` are thin wrappers over tRPC calls. Rules:
- Call `api.router.procedure.useQuery()` or `.useMutation()`
- Handle cache invalidation in `onSuccess`
- **Never export types** — components extract types from `RouterOutputs` directly

```typescript
// src/hooks/use-profile.ts
'use client';

import { api } from '@/utils/api';

export function useProfile() {
  return api.profile.get.useQuery();
}

export function useUpdateProfile() {
  const utils = api.useUtils();

  return api.profile.update.useMutation({
    onSuccess: (data) => {
      utils.profile.get.setData(undefined, data);  // update cache immediately
      void utils.profile.get.invalidate();          // safety refetch in background
    },
  });
}
```

---

## 8. Extracting Types in Components

Components declare their own types using `RouterOutputs` at the top of the file.

```typescript
import { type RouterOutputs } from '@/utils/api';

// Single object (findUnique → can be null)
type Profile = RouterOutputs['profile']['get'];

// Array item (findMany → array, extract single item)
type Role = RouterOutputs['roles']['getAll'][number];
type RoleRequest = RouterOutputs['roleRequests']['getUserRequests'][number];

// Nested field
type RolePermission = RouterOutputs['roles']['getAll'][number]['permissions'][number];
```

### `NonNullable` for optional outputs

```typescript
type Profile = RouterOutputs['profile']['get']          // User | null
type ProfileName = NonNullable<Profile>['name']          // string | null
type ProfileImage = NonNullable<Profile>['image']        // string | null
```

### Input types for forms

```typescript
type UpdateProfileInput = RouterInputs['profile']['update'];
// equivalent to z.infer<typeof updateProfileSchema> but derived from the router
```

---

## 9. Session Types

NextAuth session types are augmented in `src/lib/auth/types/session.ts` and flow through to all server components and tRPC procedures:

```typescript
// src/lib/auth/types/session.ts
declare module 'next-auth' {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession['user'];
    accessToken?: string;
  }
  interface User { role: UserRole; }
}

declare module 'next-auth/jwt' {
  interface JWT { id: string; role: UserRole; accessToken?: string; }
}
```

**In tRPC context** (`src/server/api/trpc.ts`), the session is narrowed to a plain type for safe use throughout procedures:

```typescript
type CreateContextOptions = {
  session: { user: { id: string; role: string }; expires?: string } | null;
  prisma: PrismaClient;
};
```

**Accessing session in a protected procedure:**

```typescript
update: protectedProcedure.mutation(async ({ ctx }) => {
  // ctx.session.user.id and ctx.session.user.role are always defined here
  return ctx.prisma.user.update({ where: { id: ctx.session.user.id }, data: { ... } });
})
```

---

## 10. Query Hooks

### Standard query

```typescript
const { data: profile, isLoading, isError } = useProfile();
```

### Conditional query — don't run until data is available

```typescript
export function useRoleById(id: string | undefined) {
  return api.roles.getById.useQuery(
    { id: id ?? '' },
    { enabled: !!id }  // query only fires when id is truthy
  );
}
```

### Multiple parallel queries

```typescript
const { data: profile, isLoading: profileLoading } = useProfile();
const { data: roles = [], isLoading: rolesLoading } = useRoles();

const isLoading = profileLoading || rolesLoading;
```

Default values (`= []`) prevent null/undefined handling downstream before data loads.

---

## 11. Mutation Hooks and Cache Invalidation

### Preferred: `api.useUtils()` invalidation (type-safe)

```typescript
export function useApproveRoleRequest() {
  const utils = api.useUtils();

  return api.roleRequests.approveRequest.useMutation({
    onSuccess: () => {
      void utils.roleRequests.invalidate();
      void utils.userRoles.invalidate();
    },
  });
}
```

### Direct cache update (skip the refetch)

```typescript
export function useUpdateProfile() {
  const utils = api.useUtils();

  return api.profile.update.useMutation({
    onSuccess: (data) => {
      utils.profile.get.setData(undefined, data);  // instant update, no round-trip
      void utils.profile.get.invalidate();          // safety refetch in background
    },
  });
}
```

### Cache wipe on account deletion

```typescript
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return api.profile.delete.useMutation({
    onSuccess: () => {
      queryClient.clear();  // wipe ALL cached data
    },
  });
}
```

---

## 12. Form Patterns

### Schema → form setup → submission

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: { name: profile?.name ?? '' },  // re-syncs reactively when data arrives
    mode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Profile updated');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  });
}
```

**`defaultValues` vs `values`:**
- `defaultValues` — evaluated once at mount; use for forms that don't prefill from a query
- `values` — re-evaluated when the value changes; use for edit forms that wait for a query to load

---

## 13. Mutation State in UI

```typescript
const updateProfile = api.profile.update.useMutation();

const isSubmitting = updateProfile.isPending;
const isSuccess = updateProfile.isSuccess;
```

| Property | When true |
|---|---|
| `isPending` | Mutation is in flight — disable submit button |
| `isSuccess` | Last mutation succeeded — show success state |
| `isError` | Last mutation failed — show error message |
| `error` | Populated when `isError` is true |

---

## Rules at a Glance

| Rule | Do | Don't |
|---|---|---|
| Server data types | `RouterOutputs['router']['procedure']` | Write a manual type that mirrors a Prisma model |
| Client-only types | Inline or in a local `types.ts` | Put UI state types in a hook file |
| Input types | `z.infer<typeof schema>` in `schemas.ts` | Write a manual TypeScript input type |
| Output types | Let TypeScript infer from the Prisma return value | Annotate the return type on a procedure |
| Prisma enums in Zod | `z.nativeEnum(PrismaEnum)` | `z.enum(['A', 'B', 'C'])` |
| Schema for forms | Same schema for tRPC `.input()` and `zodResolver()` | Separate Zod schema for form vs API |
| Hook exports | Return the hook result directly | Export a TypeScript type from a hook file |
| Option C: DB queries | Always in the tRPC procedure handler | Inside a server action |
| Option C: business logic | In a `'use server'` action file | Scattered inline throughout procedures |
| Optional outputs | `NonNullable<RouterOutputs['r']['get']>['field']` | Access nested fields on a nullable type directly |
| Cache invalidation | `utils.router.invalidate()` — prefer named paths | Predicate-based unless crossing router boundaries |
| Session in procedures | `ctx.session.user.id` (always defined in `protectedProcedure`) | Re-fetch the session inside a procedure |
