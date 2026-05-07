# Type Patterns — tRPC, Prisma, Zod, and Client Data Flow

How types flow through this monorepo: from the Prisma schema to the tRPC router, through Zod schemas and React Query hooks, into UI components — with the complete Option C architecture for type-safe server actions.

---

## The Type Flow

```
packages/database/prisma/schema.prisma
           ↓  (Prisma generates model types and enums)
packages/features-*/src/*/types/
├── schemas.ts   ← Zod schemas (shared between tRPC input + React Hook Form)
├── types.ts     ← Manual types (UI state, domain logic, re-exported Prisma enums)
└── guards.ts    ← Runtime type guard functions
           ↓
packages/api-*/src/routers/*.ts   ← input from Zod schemas, output inferred from Prisma
           ↓  (tRPC infers full router type)
apps/sheigoldberg.com/src/server/api/root.ts   (AppRouter type)
           ↓
apps/sheigoldberg.com/src/utils/api.ts         (RouterOutputs, RouterInputs helpers)
           ↓
packages/features-*/src/*/hooks/*.ts           (thin wrappers — no type exports)
           ↓
Component files                                (extract types from RouterOutputs directly)
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
type Post = RouterOutputs['posts']['getAll'][number];
type Lead = RouterOutputs['leadManagement']['lead']['get'];
type PostAuthor = RouterOutputs['posts']['getAll'][number]['author'];
```

---

### Layer 2 — Zod-schema types (required in four specific situations)

Layer 2 is used when Prisma cannot express the type, when the data crosses a trust boundary, or when TypeScript's structural inference produces types that are too complex to use safely. **The Zod schema is the source of truth. TypeScript types are derived from it via `z.infer<>` — never written by hand.**

```typescript
// ✅ Layer 2 — schema is the source, type is derived
export const assessmentResultSchema = z.object({ ... });
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
```

The same schema serves three jobs: it defines the TypeScript type, validates data on the write path (into the DB), and parses data on the read path (out of the DB).

---

### The four triggers for Layer 2

#### Trigger 1 — Prisma `Json` fields

This is the most common trigger. When a column is `Json` or `Json?`, Prisma types it as `string | number | boolean | JsonObject | JsonArray | null`. This is useless — you need a Zod schema to express the actual shape.

**Write path:** validate and strip before inserting.
**Read path:** parse in the tRPC procedure so components receive a real typed value via `RouterOutputs`, not raw `Prisma.Json`.

```typescript
// packages/features-lead-score/src/server/schemas.ts
export const assessmentResultSchema = z.object({
  diagnostic: diagnosticResultSchema,
  intent: intentProfileSchema,
  decision: decisionOutputSchema,
});
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;

// packages/features-lead-score/src/server/router.ts — parse in the router, never in the component
getAssessment: publicProcedure.input(getAssessmentSchema).query(async ({ ctx, input }) => {
  const assessment = await ctx.prisma.assessment.findUnique({ where: { id: input.assessmentId } });
  // Parse here — throws INTERNAL_SERVER_ERROR on corruption, never silently returns garbage
  const results = assessmentResultSchema.parse(assessment.results);
  const answers = answersSchema.parse(assessment.answers);
  return { ...assessment, results, answers }; // results is now AssessmentResult, not Prisma.Json
})

// ❌ WRONG — never cast in the component
const result = data.results as unknown as AssessmentResult;

// ✅ CORRECT — component gets RouterOutputs['leadScore']['getAssessment']['results']
// which is AssessmentResult, fully typed, no cast needed
const result = data.results;
```

**Writing to a `Json` field:** Prisma's write type is `InputJsonValue`, not `Record<string, unknown>`. Cast explicitly when writing from an already-validated value:

```typescript
import { Prisma } from '@prisma/client';

metadata: metadata as Prisma.InputJsonValue | undefined
```

If the value is validated by a Zod schema before this point (as in the lead ingestion flow), the cast is safe — Zod has already confirmed the shape is valid JSON.

---

#### Trigger 2 — External data boundaries

Any data that enters the system from outside — webhook payloads, form submissions, third-party API responses — must be validated at the boundary. TypeScript types only exist at compile time; a webhook can send anything at runtime.

```typescript
// validate inbound Make.com webhook payload
const body = webhookPayloadSchema.safeParse(rawBody);
if (!body.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
// body.data is now typed and safe to use
```

tRPC `.input(schema)` handles this automatically for all tRPC procedures. External REST handlers (like `/api/lead-management/ingest`) need explicit parse calls.

---

#### Trigger 3 — Recursive / circular types

When a data structure references itself (tree nodes, comment threads, nested categories), TypeScript's type inference can struggle with the recursion. Zod's `z.lazy()` breaks the cycle:

```typescript
// ❌ TypeScript alone — type inference can fail or produce deep circular types
type Comment = { id: string; replies: Comment[] };

// ✅ Zod with z.lazy() — schema explicitly declares the recursion
type Comment = z.infer<typeof commentSchema>;

const commentSchema: z.ZodType<Comment> = z.lazy(() =>
  z.object({
    id: z.string(),
    content: z.string(),
    replies: z.array(commentSchema), // safe recursion
  })
);
```

Use this pattern whenever a Prisma model has a self-referential relation and you need to type deeply nested query results.

---

#### Trigger 4 — Cross-package type sharing without circular imports

When Package A and Package B both need a shared type, but one package can't import from the other (circular dependency), define the schema in a lower-level shared package (e.g., `@repo/database`) and import the type from there.

```typescript
// @repo/database/src/shared-schemas.ts
export const metadataSchema = z.record(z.string());
export type Metadata = z.infer<typeof metadataSchema>;

// Package A imports the schema for validation
// Package B imports the type for its component props
// Neither package depends on the other
```

This also applies when a complex deeply-nested Prisma type would produce an unusable function signature. Defining a clean Zod schema creates a named, flat type that functions can accept explicitly — avoiding `(item: RouterOutputs['a']['b']['c'][number]['d']['e'])` in function signatures.

---

### Decision table

| Situation | Layer | Source of truth |
|---|---|---|
| Prisma column is a scalar (`String`, `Int`, `DateTime`, enum, relation) | 1 | Prisma schema → inferred via `RouterOutputs` |
| Prisma column is `Json` / `Json?` | 2 | Zod schema → `z.infer<>` + `.parse()` in router |
| Data enters from outside the system (webhook, API, form) | 2 | Zod schema → validate at the boundary |
| Type references itself (tree, thread, nested category) | 2 | Zod schema with `z.lazy()` |
| Two packages need the same type but can't import each other | 2 | Zod schema in a shared lower-level package |
| UI state, form state, client-only toggles | — | Manual type in `types.ts` (no Zod, no Prisma) |

---

### The Layer 2 implementation contract

When you identify a Layer 2 situation, all three of the following must be present — not just one or two:

1. **Schema defined in `server/schemas.ts` or a shared package** — exported, named, used as the single source of truth
2. **TypeScript type derived via `z.infer<>`** — never a hand-written interface that duplicates the schema
3. **`.parse()` or `.safeParse()` called at the data boundary** — on write AND on read for Json fields, on entry for external boundaries

---

## 2. Manual Type File Organization

Every feature in `packages/features-*/src/[feature-name]/` follows a three-file type structure:

```
types/
├── types.ts     — UI state, form state, re-exported Prisma enums, utility functions
├── schemas.ts   — Zod schemas + z.infer<> type exports (shared with tRPC + forms)
└── guards.ts    — Runtime type guard functions (when needed)
```

### `types.ts` — client-side domain types

```typescript
// packages/features-dashboard/src/profile/types/types.ts

// Re-export Prisma enums so consumers import from the feature package
// (not directly from @prisma/client — keeps imports stable if schema moves)
export type { PostStatus } from '@prisma/client';

// UI and form state (client-only concerns)
export interface ProfileFormState {
  isEditing: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface ProfilePageState {
  showDeleteConfirmation: boolean;
  activeTab: 'profile' | 'security' | 'preferences';
}

// Utility/helper functions alongside domain types
export const generateSlug = (title: string): string =>
  title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
```

### `schemas.ts` — Zod schemas as the single source of truth

```typescript
// packages/features-posts/src/types/schemas.ts
import { PostStatus } from '@prisma/client';
import { z } from 'zod';

// Base schema for creation
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  content: z.any(),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),  // ← always z.nativeEnum
  tagIds: z.array(z.string()).optional(),
});

// Update schema: all fields optional + id required
export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string(),
});

// Types always derived from schemas — never written by hand
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
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
export interface CreatePostInput {
  title: string;
  slug: string;
  // ... manually maintained
}
```

### `guards.ts` — runtime type checking

```typescript
// packages/features-posts/src/types/guards.ts
import { PostStatus } from '@prisma/client';

export function isPublishedPost(post: { status: PostStatus }): boolean {
  return post.status === PostStatus.PUBLISHED;
}

export function isDraft(post: { status: PostStatus }): boolean {
  return post.status === PostStatus.DRAFT;
}
```

---

## 3. The Shared Schema Pattern (tRPC + React Hook Form)

The same Zod schema is the single source of truth for both the API input validation and the form validation. This means form errors and API errors are governed by identical rules:

```typescript
// The schema is defined once in types/schemas.ts
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Used in tRPC router for API input validation:
update: protectedProcedure
  .input(profileFormSchema)          // ← same schema
  .mutation(async ({ ctx, input }) => { ... })

// Used in React Hook Form for client-side validation:
const form = useForm<ProfileFormValues>({
  resolver: zodResolver(profileFormSchema),  // ← same schema
});
```

When validation rules change (e.g. minimum name length changes from 2 to 3 characters), you change the schema once and both API and form validation update automatically.

---

## 4. Option C Architecture — tRPC Procedures and Server Actions

**This is the required pattern for all new tRPC work in this monorepo.**

Option C separates concerns cleanly:

| Responsibility | Where it lives | What it does |
|---|---|---|
| Input validation | Zod `.input()` on the procedure | Rejects malformed requests before they reach the handler |
| Business logic | Server action (`lib/actions.ts`) | Auth checks, business rules, notifications, pre-mutation validation |
| Database query | tRPC procedure handler | Owns the single Prisma query — this is where types are inferred |

### Why Option C produces zero type drift

The tRPC procedure's return type is inferred directly from its Prisma query. If the server action queries the database and returns results, that return type lives outside the tRPC type system and must be maintained manually.

**Option C keeps the database query inside the procedure.** This means Prisma's output flows directly into `RouterOutputs` with no manual type maintenance.

### The complete Option C pattern

```typescript
// 1. lib/actions.ts — business logic only, 'use server' directive
'use server';

import { getCurrentUser } from '@/lib/auth';

export async function validateProfileUpdate(data: {
  name?: string;
}): Promise<{
  success: boolean;
  validatedData?: typeof data & { userId: string };
  error?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required' };

  // Business logic: validation rules that go beyond what Zod can express
  if (data.name && data.name.trim().length === 0) {
    return { success: false, error: 'Name cannot be empty' };
  }

  // Side effects: notifications, audit logs, external service calls
  // await sendProfileUpdateEmail(currentUser.email)

  return {
    success: true,
    validatedData: { ...data, userId: currentUser.id },
  };
}


// 2. tRPC router — calls action for business logic, owns the DB query
update: protectedProcedure
  .input(z.object({ name: z.string().min(2).optional() }))
  .mutation(async ({ ctx, input }) => {
    // Call server action for business logic
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

**Server action (`lib/actions.ts`):**
- Authentication and authorization checks that aren't covered by middleware
- Business rules that depend on external state or multiple conditions
- Sending emails, notifications, audit logs
- Pre-mutation validation that requires database lookups (e.g. "does this user have a pending request?")
- Returns `{ success, validatedData?, error? }` — minimal metadata only

**tRPC procedure handler:**
- The single Prisma database query (always)
- Zod input validation (always — use `.input()`)
- Calling the server action (when business logic is complex)
- Simple inline checks are acceptable for straightforward validations

**Anti-patterns:**
```typescript
// ❌ WRONG — server action queries DB and returns data
export async function createPost(data: CreatePostData) {
  const post = await prisma.post.create({ data, include: { author: true } });
  return { success: true, data: post };  // ← type lives outside tRPC
}

// ❌ WRONG — procedure calls action then queries DB twice
create: protectedProcedure.mutation(async ({ ctx, input }) => {
  const result = await createPost(input);        // query 1 (in action)
  return ctx.prisma.post.findUnique({ where: { id: result.data.id } }); // query 2
})

// ✅ CORRECT — action handles business logic, procedure owns the single query
export async function validateCreatePost(data) {
  // business logic only — no DB mutations
}
create: protectedProcedure.mutation(async ({ ctx, input }) => {
  const { success, error } = await validateCreatePost(input);
  if (!success) throw new TRPCError({ message: error });
  return ctx.prisma.post.create({ data: input, include: { author: true } }); // single query
})
```

---

## 5. tRPC Router Types

### Input types come from Zod — never write them manually

```typescript
// packages/api-rbac/src/routers/role-requests.ts
import { createRoleRequestSchema } from '@repo/auth'; // import shared schema

export const roleRequestsRouter = createTRPCRouter({
  createRequest: protectedProcedure
    .input(createRoleRequestSchema)   // ← import from schemas.ts
    .mutation(async ({ ctx, input }) => {
      // input is fully typed from the Zod schema
      return ctx.prisma.roleRequest.create({ ... });
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

### Prisma JSON fields — use Layer 2 (see section 1)

`Json` columns are the primary trigger for the Layer 2 Zod schema pattern. Do not cast at the component level. Define a Zod schema, parse in the tRPC router, and let the type flow through `RouterOutputs`. See the full treatment in section 1 under "Trigger 1 — Prisma Json fields."

When writing to a Prisma `Json` field from an already-validated `Record<string, unknown>`, the write type requires an explicit cast:

```typescript
import { Prisma } from '@prisma/client';

metadata: metadata as Prisma.InputJsonValue | undefined
```

### Prisma enums in Zod — always `z.nativeEnum()`

```typescript
import { RoleRequestStatus } from '@repo/database';

// ✅ CORRECT — stays in sync with Prisma schema automatically
const updateStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(RoleRequestStatus),
});

// ❌ WRONG — duplicates the Prisma enum and will drift when the enum changes
const updateStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});
```

---

## 6. The `api.ts` Bridge

Every app exposes two type helpers. These are the only place where router types become accessible to the client:

```typescript
// apps/sheigoldberg.com/src/utils/api.ts
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

Hooks in `packages/features-*/src/*/hooks/` are thin wrappers over tRPC calls. Rules:
- Call `api.router.procedure.useQuery()` or `.useMutation()`
- Handle cache invalidation in `onSuccess`
- **Never export types** — components extract types from `RouterOutputs` directly

```typescript
// packages/features-dashboard/src/profile/hooks/use-profile.ts
'use client';

import { api } from '@/utils/api';

/**
 * Thin tRPC wrappers. Do NOT export types from hook files.
 * ✅ CORRECT: Components extract types directly from RouterOutputs
 * ❌ WRONG:   Export types from hook files (creates type drift)
 */

export function useProfile() {
  return api.profile.get.useQuery();
}

export function useUpdateProfile() {
  const utils = api.useUtils();

  return api.profile.update.useMutation({
    onSuccess: (data) => {
      utils.profile.get.setData(undefined, data);  // update cache immediately
      void utils.profile.get.invalidate();          // then refetch in background
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return api.profile.delete.useMutation({
    onSuccess: () => {
      queryClient.clear();  // wipe entire cache on account deletion
    },
  });
}
```

---

## 8. Extracting Types in Components

Components declare their own types using `RouterOutputs` at the top of the file.

### Basic extraction

```typescript
// apps/sheigoldberg.com/src/app/(dashboard)/profile/page.tsx
import { type RouterOutputs } from '@/utils/api';

// Single object (findUnique → can be null)
type Profile = RouterOutputs['profile']['get'];

// Array item (findMany → array, extract single item)
type Role = RouterOutputs['roles']['getAll'][number];
type RoleRequest = RouterOutputs['roleRequests']['getUserRequests'][number];

// Nested field
type PostAuthor = RouterOutputs['posts']['getAll'][number]['author'];
```

### `NonNullable` for optional outputs

When a procedure uses `findUnique` it returns `T | null`. Use `NonNullable` to access nested fields:

```typescript
type Profile = RouterOutputs['profile']['get']           // User | null
type ProfileName = NonNullable<Profile>['name']           // string
type ProfileImage = NonNullable<Profile>['image']         // string | null (field itself is nullable)
type ProfileBio = NonNullable<NonNullable<Profile>['bio']> // string (double-unwrap if nested nullable)
```

### Input types for form schemas

Use `RouterInputs` when you need the type of what a mutation accepts:

```typescript
type UpdateProfileInput = RouterInputs['profile']['update'];
// equivalent to z.infer<typeof updateProfileSchema> but derived from the router
```

---

## 9. Query Hooks

### Standard query

```typescript
const { data: profile, isLoading, isError } = useProfile();
```

### Conditional query — don't run until data is available

```typescript
export function usePost(id: string | undefined) {
  return api.posts.getById.useQuery(
    { id: id || '' },
    { enabled: !!id }  // query only fires when id is truthy
  );
}
```

### Multiple parallel queries

```typescript
// All hooks run simultaneously — React Query batches them
const { data: profile, isLoading: profileLoading } = useProfile();
const { data: roles = [], isLoading: rolesLoading } = useRoles();
const { data: roleRequests = [] } = useUserRoleRequests();

const isLoading = profileLoading || rolesLoading;
```

Default values (`= []`) prevent null/undefined handling downstream before data loads.

---

## 10. Form Patterns

### Schema → form setup → submission

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

// Schema defined locally (or imported from types/schemas.ts for shared schemas)
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '' },      // used once at mount — for forms that don't load data
    values: { name: profile?.name || '' },  // re-syncs reactively when data arrives
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
- `values` — re-evaluated whenever the value changes; use for edit forms where you wait for a query to load

### Form wrapper component pattern

For features that have both create and edit flows, extract the form UI into a wrapper component:

```typescript
// packages/features-posts/src/components/post-form.tsx

interface PostFormProps {
  defaultValues?: Partial<PostFormData>;
  onSubmit: (data: PostFormData) => Promise<void>;  // caller decides what mutation to call
  isLoading?: boolean;
}

export function PostForm({ defaultValues, onSubmit, isLoading }: PostFormProps) {
  const methods = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { status: PostStatus.DRAFT, ...defaultValues },
  });
  // ... form rendering
}

// Create page — owns the mutation
function CreatePostPage() {
  const createPost = useCreatePost();
  return (
    <PostForm onSubmit={(data) => createPost.mutateAsync(data)} />
  );
}

// Edit page — same form UI, different mutation
function EditPostPage({ postId }: { postId: string }) {
  const { data: post } = usePost(postId);
  const updatePost = useUpdatePost();
  return (
    <PostForm
      defaultValues={post ?? undefined}
      onSubmit={(data) => updatePost.mutateAsync({ ...data, id: postId })}
    />
  );
}
```

### Loading skeleton while query is in flight

```typescript
export function EditProfileForm() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form renders only after data is available
  return <form>{/* ... */}</form>;
}
```

### Computed fields with `watch` + `useEffect`

```typescript
const { watch, setValue } = form;
const watchedTitle = watch('title');

// Auto-generate slug from title
useEffect(() => {
  if (watchedTitle && !defaultValues?.slug) {
    setValue('slug', slugify(watchedTitle));
  }
}, [watchedTitle, setValue, defaultValues?.slug]);
```

---

## 11. Mutation Hooks and Cache Invalidation

### Preferred: `api.useUtils()` invalidation (type-safe)

```typescript
export function useApproveRoleRequest() {
  const utils = api.useUtils();

  return api.roleRequests.approveRequest.useMutation({
    onSuccess: () => {
      void utils.roleRequests.invalidate();   // all roleRequests queries
      void utils.userRoles.invalidate();      // related data that also changed
    },
  });
}
```

### Specific invalidation by ID

When you know exactly which record changed, invalidate specifically:

```typescript
export function useUpdatePost() {
  const utils = api.useUtils();

  return api.posts.update.useMutation({
    onSuccess: (data) => {
      void utils.posts.getAll.invalidate();              // list changed
      void utils.posts.getById.invalidate({ id: data.id }); // this specific post changed
    },
  });
}
```

### Direct cache update (skip the refetch)

When `onSuccess` already has the new server data, write it directly to cache:

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

### Cache wipe on logout or account deletion

```typescript
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return api.profile.delete.useMutation({
    onSuccess: () => {
      queryClient.clear();  // wipe ALL cached data — user's session is gone
    },
  });
}
```

### Fallback: predicate-based invalidation (cross-router)

Use when you need to invalidate queries across router boundaries with a string match:

```typescript
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return api.tags.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => JSON.stringify(query.queryKey).includes('tags'),
      });
    },
  });
};
```

Prefer `api.useUtils()` when you can name the router path. Use predicate-based as a fallback.

---

## 12. Optimistic Updates

For mutations where the UI should update before the server confirms success:

```typescript
export function useTogglePostPublished() {
  const utils = api.useUtils();

  return api.posts.togglePublished.useMutation({
    // 1. Before mutation fires — update cache speculatively
    onMutate: async ({ id, published }) => {
      await utils.posts.getAll.cancel();           // cancel in-flight refetches
      const previousPosts = utils.posts.getAll.getData();  // snapshot for rollback

      utils.posts.getAll.setData(undefined, (old) =>
        old?.map((post) => (post.id === id ? { ...post, published } : post))
      );

      return { previousPosts };  // pass snapshot to onError
    },

    // 2. On failure — restore snapshot
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        utils.posts.getAll.setData(undefined, context.previousPosts);
      }
    },

    // 3. Always refetch after settle to sync with server truth
    onSettled: () => {
      void utils.posts.getAll.invalidate();
    },
  });
}
```

**Use optimistic updates for:** toggling booleans, reordering items, counters.
**Do NOT use for:** form submissions, record creation (no server-generated ID yet), external service calls (payment, email).

---

## 13. Mutation State in UI

```typescript
const submitContact = api.contact.submitContact.useMutation({
  onSuccess: () => form.reset(),
});

// Drive UI from mutation state
const isSubmitting = submitContact.isPending;
const isSuccess = submitContact.isSuccess;
const error = submitContact.error;
```

| Property | Type | When true |
|---|---|---|
| `isPending` | `boolean` | Mutation is in flight — disable submit button |
| `isSuccess` | `boolean` | Last mutation succeeded — show success state |
| `isError` | `boolean` | Last mutation failed — show error message |
| `error` | `TRPCClientError` | Populated when `isError` is true |

```typescript
// Complete pattern
if (isSuccess) return <SuccessMessage />;

return (
  <form onSubmit={form.handleSubmit(async (data) => {
    await submitContact.mutateAsync(data);
  })}>
    {/* fields */}
    {submitContact.error && <ErrorMessage message={submitContact.error.message} />}
    <Button disabled={isSubmitting}>
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </Button>
  </form>
);
```

---

## Rules at a Glance

| Rule | Do | Don't |
|---|---|---|
| Server data types | `RouterOutputs['router']['procedure']` | Write a manual type that mirrors a Prisma model |
| Client-only types | `types.ts` in the feature's `types/` folder | Put UI state types in a hook or component file |
| Input types | `z.infer<typeof schema>` in `schemas.ts` | Write a manual TypeScript input type |
| Output types | Let TypeScript infer from the Prisma return value | Annotate the return type on a procedure |
| Prisma enums in Zod | `z.nativeEnum(PrismaEnum)` | `z.enum(['A', 'B', 'C'])` |
| Schema for forms | Same schema for tRPC `.input()` and `zodResolver()` | Separate Zod schema for form vs API |
| Hook exports | Return the hook result directly | Export a TypeScript type from a hook file |
| Option C: DB queries | Always in the tRPC procedure handler | Inside a server action |
| Option C: business logic | In a `'use server'` action file | Scattered inline throughout procedures |
| Optional outputs | `NonNullable<RouterOutputs['r']['get']>['field']` | Access nested fields on a nullable type directly |
| Cache invalidation | `utils.router.invalidate()` — prefer named paths | Predicate-based unless crossing router boundaries |
| Optimistic rollback | Always implement `onError` to restore snapshot | Skip rollback — optimistic updates must be reversible |
