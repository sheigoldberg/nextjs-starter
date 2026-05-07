import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        {process.env.NEXT_PUBLIC_APP_DISPLAY_NAME || 'My App'}
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        Built with nextjs-starter — Next.js 14, tRPC, Prisma, NextAuth, RBAC, and shadcn/ui.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
