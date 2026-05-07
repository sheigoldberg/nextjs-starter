# Data Patterns — Prisma Query Conventions

How this monorepo queries the database: `select` vs `include`, pagination, filtering, nested writes, and multi-step mutations.

---

## Architecture Overview

All database access goes through **tRPC procedures** that hold the single Prisma query. Server actions never call Prisma directly — they call tRPC procedures and receive typed results (see [type-patterns.md](./type-patterns.md) for Option C). Raw SQL is never used.

---

## 1. `select` vs `include`

### When to use `select` (lean queries)

Use `select` when you need specific fields from a single model with no nested relations:

```typescript
// Profile query — only the fields the UI needs
return ctx.prisma.user.findUnique({
  where: { id: ctx.session.user.id },
  select: {
    id: true,
    name: true,
    email: true,
    image: true,
  },
});
```

### When to use `include` (eager loading relations)

Use `include` to fetch a model with its related records in a single query:

```typescript
return ctx.prisma.post.findMany({
  include: {
    author: true,      // full author record
    tags: {
      include: {
        tag: true,     // join table → full Tag record
      },
    },
  },
});
```

### `select` inside `include` (hybrid — preferred for lists)

When fetching lists with nested relations, use `select` inside `include` to limit which fields are returned from the nested model. This avoids over-fetching:

```typescript
return ctx.prisma.roleRequest.findMany({
  where: { status: RoleRequestStatus.PENDING },
  include: {
    user: {
      select: {           // ← select controls which user fields come back
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
  orderBy: { createdAt: 'desc' },
});
```

**Rule of thumb:**
- Single entity detail view → `include` with full relation
- List query with relations → `include` + `select` on each relation
- No relations needed → pure `select`

---

## 2. Cursor-Based Pagination

Used for infinite scroll / "load more" patterns. Cursor pagination is stable — it doesn't skip records when new rows are inserted during pagination.

### Pattern: `take: limit + 1` + pop + `nextCursor`

```typescript
// packages/features-posts/src/server/router.ts
getAll: publicProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().optional(),      // ID of the last item from previous page
      status: z.nativeEnum(PostStatus).optional(),
      search: z.string().optional(),
    }).optional()
  )
  .query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 10;

    const posts = await ctx.prisma.post.findMany({
      take: limit + 1,                              // fetch one extra to detect next page
      cursor: input?.cursor ? { id: input.cursor } : undefined,
      where: { /* ... filters ... */ },
      orderBy: { publishedAt: 'desc' },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();                 // remove the extra item
      nextCursor = nextItem?.id;                    // use its ID as the next page cursor
    }

    return { posts, nextCursor };
  }),
```

### Client consumption (TanStack Query `useInfiniteQuery`)

```typescript
const { data, fetchNextPage, hasNextPage } = api.posts.getAll.useInfiniteQuery(
  { limit: 10 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    //                                       ↑ undefined = no more pages
  }
);

// Flatten pages for rendering
const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];
```

### Offset/limit pagination (admin tables)

For admin tables where data doesn't change while paginating, offset-based pagination is simpler:

```typescript
return ctx.prisma.user.findMany({
  take: input?.limit,
  skip: input?.offset,
  orderBy: { createdAt: 'desc' },
  include: { /* ... */ },
});
```

---

## 3. Filtering Patterns

### Conditional spread (build filters dynamically)

Only include a filter in the `where` clause if the input is provided:

```typescript
const posts = await ctx.prisma.post.findMany({
  where: {
    ...(isPublic ? { status: PostStatus.PUBLISHED } : {}),
    ...(input?.status && { status: input.status }),
    ...(input?.tagSlugs && input.tagSlugs.length > 0 && {
      tags: {
        some: {
          tag: { slug: { in: input.tagSlugs } },
        },
      },
    }),
    ...searchCondition,
  },
});
```

### Multi-field text search (OR)

Build the search condition separately, then spread it in:

```typescript
const searchCondition = input?.search
  ? {
      OR: [
        { title: { contains: input.search, mode: 'insensitive' as const } },
        { subtitle: { contains: input.search, mode: 'insensitive' as const } },
        { contentPlainText: { contains: input.search, mode: 'insensitive' as const } },
        {
          tags: {
            some: {
              tag: {
                name: { contains: input.search, mode: 'insensitive' as const },
              },
            },
          },
        },
      ],
    }
  : {};

const posts = await ctx.prisma.post.findMany({
  where: {
    ...searchCondition,
    // other filters...
  },
});
```

**Rules:**
- Always use `mode: 'insensitive' as const` for case-insensitive text search
- Build complex conditions outside the query for readability
- `OR` is an array — each element is an alternative condition
- Nested `some` traverses into related models

### Common filter operators

```typescript
// Equality
where: { status: PostStatus.PUBLISHED }

// In array
where: { slug: { in: slugs } }

// Contains (case-insensitive)
where: { name: { contains: search, mode: 'insensitive' } }

// Multiple conditions (implicit AND)
where: { userId: id, roleId: roleId }

// Relation exists (some)
where: { tags: { some: { tag: { slug: 'design' } } } }

// Null check
where: { publishedAt: { not: null } }

// Date range
where: { createdAt: { gte: startDate, lte: endDate } }
```

---

## 4. Nested Writes

Use nested writes to create/update related records in a single Prisma query. This avoids separate queries and is preferred over sequential mutations.

### Create with many-to-many (join table)

```typescript
// Create post + its tag associations in one mutation
const post = await ctx.prisma.post.create({
  data: {
    ...postData,
    authorId: ctx.session.user.id,
    tags: {
      create: tagIds.map((tagId) => ({
        tag: { connect: { id: tagId } },  // connect to existing Tag
      })),
    },
  },
  include: {
    tags: { include: { tag: true } },
  },
});
```

Pattern: `create` on the join model (`PostTag`) with `connect` to link to existing related records.

### Update: delete all + recreate (replace pattern)

When updating a many-to-many relationship, the cleanest approach is delete all existing join records then recreate:

```typescript
const post = await ctx.prisma.post.update({
  where: { id: input.id },
  data: {
    ...updateData,
    tags: {
      deleteMany: {},                     // clear all existing PostTag rows
      create: tagIds.map((tagId) => ({
        tag: { connect: { id: tagId } },  // recreate with new selection
      })),
    },
  },
  include: {
    tags: { include: { tag: true } },
  },
});
```

### `createMany` for batch inserts

```typescript
if (roleIds.length > 0) {
  await ctx.prisma.userRoleAssignment.createMany({
    data: roleIds.map((roleId) => ({
      userId,
      roleId,
    })),
  });
}
```

### `deleteMany` for bulk deletes

```typescript
// Delete all assignments for a user
await ctx.prisma.userRoleAssignment.deleteMany({
  where: { userId },
});

// Delete specific records
await ctx.prisma.userRoleAssignment.deleteMany({
  where: { userId: input.userId, roleId: input.roleId },
});
```

---

## 5. Multi-Step Mutations

When a mutation requires multiple database operations or side effects, use sequential `await` calls. Use try/catch around non-critical side effects to allow partial success.

### Pattern: create → side effect → update status

```typescript
submitAssessment: publicProcedure
  .input(submitAssessmentSchema)
  .mutation(async ({ ctx, input }) => {
    // Step 1: Create the primary record first
    const assessment = await ctx.prisma.assessment.create({
      data: {
        ...input,
        emailSent: false,
        status: AssessmentStatus.COMPLETED,
      },
    });

    // Step 2: Non-critical side effect in try/catch
    // Don't let email failure roll back the record creation
    try {
      await sendResultsEmail({ assessment, configId: input.configId });

      // Step 3: Update status only after side effect succeeds
      await ctx.prisma.assessment.update({
        where: { id: assessment.id },
        data: { emailSent: true, emailSentAt: new Date() },
      });
    } catch (error) {
      console.error('Failed to send results email:', error);
      // Don't throw — assessment is saved, email can be resent manually
    }

    return { assessmentId: assessment.id };
  }),
```

**Rules:**
- Always create the primary record first
- Wrap non-critical side effects (email, webhooks) in try/catch
- Update status fields after side effects succeed
- Return the minimum needed — not the full record if callers don't need it

### Pattern: approve request + create assignment (two-step)

```typescript
approveRequest: adminProcedure
  .input(z.object({ id: z.string(), response: z.string().optional() }))
  .mutation(async ({ ctx, input }) => {
    // Guard: validate state before mutating
    const request = await ctx.prisma.roleRequest.findUnique({ where: { id: input.id } });
    if (!request) throw new TRPCError({ code: 'NOT_FOUND' });
    if (request.status !== 'PENDING') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already processed' });
    }

    // Step 1: Update the request status
    await ctx.prisma.roleRequest.update({
      where: { id: input.id },
      data: {
        status: 'APPROVED',
        reviewedBy: ctx.session.user.id,
        reviewedAt: new Date(),
        responseMessage: input.response,
      },
    });

    // Step 2: Create the side-effect record
    await ctx.prisma.userRoleAssignment.create({
      data: { userId: request.userId, roleId: request.roleId },
    });

    // Step 3: Return the updated record with relations
    return ctx.prisma.roleRequest.findUnique({
      where: { id: input.id },
      include: { user: true, role: true },
    });
  }),
```

**Note on transactions:** This codebase does not use `prisma.$transaction()`. Multi-step mutations use sequential awaits. For operations that must be atomic (all-or-nothing), add `prisma.$transaction()` explicitly — but only when genuinely needed.

---

## 6. Count Queries

### Count related records without fetching them

Use `_count` inside `select`/`include` to get relation counts efficiently:

```typescript
return ctx.prisma.role.findMany({
  include: {
    _count: {
      select: {
        userRoles: true,   // returns { userRoles: 3 }
      },
    },
  },
});

// Access in component:
// role._count.userRoles  → 3
```

### Conditional count (filtered)

```typescript
include: {
  _count: {
    select: {
      posts: {
        where: {
          post: { status: PostStatus.PUBLISHED },   // only count published
        },
      },
    },
  },
},
```

### Count for validation before deletion

```typescript
const postsCount = await ctx.prisma.postTag.count({
  where: { tagId: input.id },
});
if (postsCount > 0) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: `Cannot delete tag — used by ${postsCount} post(s)`,
  });
}
```

---

## 7. Existence Checks with `findFirst`

Use `findFirst` to check if a record exists before a mutation. Returns `null` if not found:

```typescript
// Guard: prevent duplicate role assignment
const existingRole = await ctx.prisma.userRoleAssignment.findFirst({
  where: { userId, roleId: input.roleId },
});
if (existingRole) {
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'Role already assigned' });
}

// Guard: prevent duplicate pending request
const existingRequest = await ctx.prisma.roleRequest.findFirst({
  where: { userId, roleId: input.roleId, status: RoleRequestStatus.PENDING },
});
if (existingRequest) {
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'Request already pending' });
}
```

---

## 8. Ordering

### Single field

```typescript
orderBy: { publishedAt: 'desc' }
orderBy: { createdAt: 'asc' }
```

### Multiple fields (array)

```typescript
orderBy: [
  { status: 'asc' },
  { createdAt: 'desc' },
]
```

---

## 9. Summary — Which Query to Use

| Scenario | Use |
|---|---|
| Single entity, specific fields, no relations | `findUnique` with `select` |
| Single entity with nested data | `findUnique` with `include` |
| List with nested relations | `findMany` with `include` + `select` on nested |
| Existence check | `findFirst` — returns null if not found |
| Infinite scroll / load more | Cursor pagination: `take: limit + 1`, `cursor`, `nextCursor` |
| Admin table with page numbers | Offset pagination: `skip`, `take` |
| Many-to-many create | Nested `create` + `connect` inside parent create |
| Many-to-many update (replace) | `deleteMany: {}` then nested `create` |
| Batch insert | `createMany` |
| Bulk delete | `deleteMany` with `where` |
| Count related records | `_count` in `select`/`include` |
| Validate before delete | `count()` query |
| Create + side effect | Sequential awaits, try/catch around side effect |
| Atomic multi-step | `prisma.$transaction()` (use only when genuinely needed) |
