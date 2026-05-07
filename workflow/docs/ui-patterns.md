# UI Patterns — Components, Layout, and Design

How to use the shared UI components, dashboard layout, form suite, data tables, dialogs, and notification system in this monorepo.

---

## 1. Form Component Suite

All form components live in `@repo/ui`. They wrap React Hook Form error handling, labels, and descriptions through a shared `FormFieldWrapper`.

### Component hierarchy

```
FormFieldWrapper        ← label, description, error message wrapper (always rendered)
  ├── FormInput         ← text, email, url, number, password inputs
  ├── FormTextarea      ← multi-line text
  ├── FormSelect        ← dropdown with options array
  └── FormImageUpload   ← file upload with preview
```

### `FormFieldWrapper`

The base wrapper used by all form field components. Handles label, description, error display, and required indicator:

```typescript
import { FormFieldWrapper } from '@repo/ui';

<FormFieldWrapper
  label="Email"
  description="We'll send your confirmation here"
  error={form.formState.errors.email}  // FieldError | undefined
  required
  htmlFor="email"
>
  <Input id="email" {...form.register('email')} />
</FormFieldWrapper>
```

### `FormInput`

```typescript
import { FormInput } from '@repo/ui';

// Using form.register (uncontrolled — preferred for simple fields)
<FormInput
  {...form.register('name')}
  label="Name"
  required
  error={form.formState.errors.name}
  disabled={isSubmitting}
  placeholder="Your name"
/>

// With type
<FormInput
  {...form.register('email')}
  type="email"
  label="Email"
  error={form.formState.errors.email}
/>
```

**Props:** All standard `<input>` HTML attributes + `label?`, `description?`, `error?: FieldError`, `required?: boolean`

### `FormTextarea`

```typescript
import { FormTextarea } from '@repo/ui';

<FormTextarea
  {...form.register('message')}
  label="Message"
  description="Max 500 characters"
  error={form.formState.errors.message}
  rows={4}
  disabled={isSubmitting}
/>
```

**Props:** All standard `<textarea>` HTML attributes + `label?`, `description?`, `error?: FieldError`, `required?: boolean`

### `FormSelect`

Uses a controlled value pattern (not `form.register`):

```typescript
import { FormSelect, type SelectOption } from '@repo/ui';

const statusOptions: SelectOption[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished', disabled: true },
];

<FormSelect
  label="Status"
  required
  error={form.formState.errors.status}
  options={statusOptions}
  value={form.watch('status')}
  onValueChange={(value) => form.setValue('status', value as PostStatus)}
  placeholder="Select a status"
/>
```

**Props:** `label?`, `description?`, `error?`, `required?`, `options: SelectOption[]`, `value?: string`, `onValueChange: (value: string) => void`, `placeholder?`, `disabled?`

### Complete form pattern

```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { FormInput, FormTextarea, Button } from '@repo/ui';
import { useCreateContact } from '@/hooks/use-contacts';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  message: z.string().max(500).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const createContact = useCreateContact();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createContact.mutateAsync(data);
      toast.success('Message sent');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send');
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormInput
          {...form.register('name')}
          label="Name"
          required
          error={form.formState.errors.name}
          disabled={createContact.isPending}
        />
        <FormInput
          {...form.register('email')}
          type="email"
          label="Email"
          required
          error={form.formState.errors.email}
          disabled={createContact.isPending}
        />
        <FormTextarea
          {...form.register('message')}
          label="Message"
          error={form.formState.errors.message}
          rows={4}
        />
        {createContact.error && (
          <p className="text-sm text-destructive">{createContact.error.message}</p>
        )}
        <Button type="submit" disabled={createContact.isPending}>
          {createContact.isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </FormProvider>
  );
}
```

---

## 2. DataTable

From `@repo/features-dashboard`. Wraps TanStack React Table with search, sorting, pagination, and a loading skeleton.

### Column definitions

```typescript
import { type ColumnDef } from '@tanstack/react-table';
import { type RouterOutputs } from '@/utils/api';
import { DataTable } from '@repo/features-dashboard';

// Always derive the row type from RouterOutputs
type Post = RouterOutputs['posts']['getAll']['posts'][number];

const columns: ColumnDef<Post>[] = [
  {
    accessorKey: 'title',              // field name on the row object
    header: 'Title',                   // column header label
    cell: ({ row }) => {
      const post = row.original;       // typed as Post
      return (
        <div>
          <p className="font-medium">{post.title}</p>
          {post.subtitle && <p className="text-sm text-muted-foreground">{post.subtitle}</p>}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (          // sortable header
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    id: 'actions',                     // non-data column (no accessorKey)
    cell: ({ row }) => {
      const post = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => router.push(`/posts/${post.id}/edit`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(post)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

### DataTable usage

```typescript
import { DataTable } from '@repo/features-dashboard';

const { data, isLoading } = usePosts();
const posts = data?.posts ?? [];

<DataTable
  columns={columns}
  data={posts}
  isLoading={isLoading}
  searchKey={['title', 'subtitle']}  // multi-column search (or single string)
  emptyMessage="No posts found."
  showSearch={true}
  showPagination={true}
/>
```

**Props:**
| Prop | Type | Default | Purpose |
|---|---|---|---|
| `columns` | `ColumnDef<T>[]` | required | Column definitions |
| `data` | `T[]` | required | Row data |
| `isLoading` | `boolean` | `false` | Shows skeleton while loading |
| `searchKey` | `string \| string[]` | — | Enable global search on these fields |
| `emptyMessage` | `string` | `'No results found.'` | Empty state text |
| `showSearch` | `boolean` | `true` | Show search input |
| `showPagination` | `boolean` | `true` | Show pagination controls |

---

## 3. ConfirmDialog

For any destructive action that requires user confirmation before executing.

### State management pattern

```typescript
import { ConfirmDialog } from '@repo/features-dashboard';
import { useState } from 'react';

type Post = RouterOutputs['posts']['getAll']['posts'][number];

export function PostsPage() {
  // Track which record is pending deletion
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const deletePost = useDeletePost();

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
      await deletePost.mutateAsync({ id: postToDelete.id });
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setPostToDelete(null);  // always clear, whether success or failure
    }
  };

  return (
    <>
      {/* Trigger from anywhere */}
      <Button
        variant="destructive"
        onClick={() => setPostToDelete(post)}
      >
        Delete
      </Button>

      {/* Dialog driven by state */}
      <ConfirmDialog
        open={postToDelete !== null}
        onOpenChange={(open) => !open && setPostToDelete(null)}
        title="Delete Post"
        description={`Are you sure you want to delete "${postToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={deletePost.isPending}
      />
    </>
  );
}
```

**Props:**
| Prop | Type | Default | Purpose |
|---|---|---|---|
| `open` | `boolean` | required | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | required | Close handler |
| `title` | `string` | required | Dialog title |
| `description` | `string` | required | Dialog body text |
| `onConfirm` | `() => void \| Promise<void>` | required | Called on confirm click |
| `variant` | `'default' \| 'destructive'` | `'default'` | Destructive shows warning icon |
| `isLoading` | `boolean` | `false` | Shows spinner, disables buttons |
| `confirmLabel` | `string` | `'Confirm'` | Confirm button text |
| `cancelLabel` | `string` | `'Cancel'` | Cancel button text |

---

## 4. AppSidebar and Dashboard Layout

### NavItem structure

```typescript
// packages/features-dashboard/src/ui/components/layout/app-sidebar.tsx

export interface NavItem {
  title: string;
  url: string;
  icon?: JSX.Element;           // lucide-react icon
  isActive?: boolean;           // highlights active state
  items?: NavItem[];            // nested sub-items (collapsible)
}

export interface DataStructure {
  title: string;
  url: string;
  navMain: NavItem[];
}
```

### Configuring navigation with role-conditional items

```typescript
// Build nav data from session — role-conditional sections
const createNavData = (user?: { role?: string }): DataStructure => ({
  title: 'sheigoldberg.com',
  url: '/',
  navMain: [
    { title: 'Public Site', url: '/' },
    { title: 'Profile', url: '/profile' },

    // Admin section only visible to ADMIN / SUPER_ADMIN
    ...(user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ? [{ title: 'Admin', url: '/admin' }]
      : []),

    {
      title: 'Dashboard',
      url: '/dashboard',
      items: [                  // ← nested items render as collapsible sub-menu
        { title: 'Posts', url: '/dashboard/posts' },
        { title: 'Analytics', url: '/dashboard/analytics' },
      ],
    },
  ],
});
```

### Dashboard layout anatomy

```
SidebarProvider                  ← manages sidebar open/closed state
├── AppSidebar                   ← left sidebar with nav items
│   ├── SidebarHeader
│   │   ├── DashboardUserButton  ← user avatar + name
│   │   └── SearchForm
│   └── SidebarContent
│       └── NavItems (collapsible)
└── SidebarInset                 ← main content area
    ├── header
    │   ├── SidebarTrigger       ← hamburger icon (mobile)
    │   ├── DynamicBreadcrumb    ← auto-generated from pathname
    │   └── [custom header actions]
    └── content
        └── children (page content)
```

### Wiring the dashboard layout in an app

```typescript
// apps/sheigoldberg.com/src/app/(dashboard)/layout.tsx
import { DashboardLayout } from '@repo/features-dashboard/ui';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

The `DashboardLayout` handles session access, nav building, and sidebar wiring internally.

### Page width within the dashboard

The dashboard layout provides a responsive max-width container. Individual pages use the full available width — no additional width wrapper needed unless you want to constrain a specific page:

```typescript
// Narrow pages (forms, profiles)
<div className="mx-auto w-full max-w-2xl space-y-6">

// Standard pages
<div className="space-y-6">  {/* uses layout's container */}

// Wide data tables
<div className="w-full space-y-6">
```

See [`dashboard-ux.md`](./dashboard-ux.md) for full layout width guidelines.

---

## 5. Toast Notifications

Uses `sonner`. Always used in mutation `onSuccess`/`onError` callbacks:

```typescript
import { toast } from 'sonner';

// In a mutation hook or component
const deletePost = useDeletePost();

// Trigger toast on outcome
try {
  await deletePost.mutateAsync({ id });
  toast.success('Post deleted successfully');
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Failed to delete post');
}

// With action button
toast.success('Post published', {
  action: {
    label: 'View',
    onClick: () => router.push(`/posts/${slug}`),
  },
});

// Promise-based (shows loading → success/error automatically)
toast.promise(deletePost.mutateAsync({ id }), {
  loading: 'Deleting...',
  success: 'Post deleted',
  error: 'Failed to delete',
});
```

**`Toaster` must be in the root layout** (already wired in `apps/sheigoldberg.com`):

```typescript
// apps/sheigoldberg.com/src/app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
```

---

## 6. Loading Patterns

### Spinner (inline, small actions)

```typescript
<Button disabled={mutation.isPending}>
  {mutation.isPending ? (
    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
  ) : (
    'Save Changes'
  )}
</Button>
```

### Skeleton (while query is loading)

```typescript
import { Skeleton } from '@repo/ui';

if (isLoading) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### DataTable skeleton (built-in)

Passing `isLoading={true}` to `DataTable` automatically shows a skeleton with the correct number of columns.

---

## 7. Theme (Dark/Light Mode)

`next-themes` is wired in the root providers with class-based theming:

```typescript
<NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</NextThemesProvider>
```

Tailwind CSS uses `class` strategy — add `dark:` variants to support dark mode:

```typescript
<div className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
```

Toggling the theme:

```typescript
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </Button>
  );
}
```

---

## 8. Card Data Display — Label/Value Pairs

### The rule

Use `grid grid-cols-[auto_1fr]` for label/value pairs inside cards. Never use `justify-between`.

**Why `justify-between` is wrong here:** it pushes values to the far right edge, creating a wide gap that forces the eye to jump across the card. The wider the card, the worse it gets. It also breaks when values wrap.

**Why `grid grid-cols-[auto_1fr]` is right:** the label column is only as wide as its longest word. Values start immediately after, anchored left. Everything reads left-to-right naturally.

### The pattern

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-base">Lead info</CardTitle>
  </CardHeader>
  <CardContent>
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Status</dt>
      <dd><Badge variant="outline">New</Badge></dd>

      <dt className="text-muted-foreground">Owner</dt>
      <dd>Shei Goldberg</dd>

      <dt className="text-muted-foreground">Created</dt>
      <dd>05 Jan 2026</dd>
    </dl>
  </CardContent>
</Card>
```

Use `<dl>` / `<dt>` / `<dd>` — they are semantically correct for definition/description lists and have no default browser styling that conflicts with Tailwind.

For conditional rows, wrap in a fragment:

```tsx
{lead.source && (
  <>
    <dt className="text-muted-foreground">Source</dt>
    <dd className="capitalize">{lead.source}</dd>
  </>
)}
```

### When `justify-between` IS correct

`justify-between` belongs in **toolbars and navigation bars** — places where you intentionally want one group anchored left and another anchored right (e.g. a page header with a title on the left and a button on the right). It is not for displaying data.

```tsx
{/* Correct use of justify-between — page header */}
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">Leads</h1>
  <Button>New Lead</Button>
</div>

{/* Wrong — data display */}
<div className="flex items-center justify-between">
  <span className="text-muted-foreground">Status</span>
  <Badge>New</Badge>  {/* ← don't do this */}
</div>
```

### Inline metadata strings

For activity feeds or anywhere you have multiple small metadata pieces on one line (channel, direction, timestamp), put them all inline separated by `·` rather than splitting some to the right:

```tsx
{/* Correct — all metadata reads left-to-right */}
<p className="text-xs text-muted-foreground">
  whatsapp · outbound · 05 Jan 2026, 14:32
</p>

{/* Wrong — date pushed right */}
<div className="flex justify-between text-xs text-muted-foreground">
  <span>whatsapp · outbound</span>
  <span>05 Jan 2026, 14:32</span>  {/* ← don't do this */}
</div>
```

---

## 9. Badge and Status Patterns

```typescript
import { Badge } from '@repo/ui';

// Status badges — use semantic variants
<Badge variant="default">Published</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="outline">Pending</Badge>

// Mapping enum values to badge variants
const POST_STATUS_BADGE: Record<PostStatus, { label: string; variant: BadgeVariant }> = {
  PUBLISHED:   { label: 'Published', variant: 'default' },
  DRAFT:       { label: 'Draft', variant: 'secondary' },
  UNPUBLISHED: { label: 'Unpublished', variant: 'outline' },
  PENDING:     { label: 'Pending Review', variant: 'secondary' },
};

function StatusBadge({ status }: { status: PostStatus }) {
  const { label, variant } = POST_STATUS_BADGE[status];
  return <Badge variant={variant}>{label}</Badge>;
}
```

---

## 9. Icon Usage

All icons are from `lucide-react`:

```typescript
import { Check, Clock, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';

// Inline with text
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Post
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <MoreHorizontal className="h-4 w-4" />
  <span className="sr-only">Actions</span>
</Button>
```

Standard icon sizes: `h-4 w-4` (small, inline), `h-5 w-5` (medium, standalone), `h-8 w-8` (large, feature).
