import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuthButton } from '@/lib/auth';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            {process.env.NEXT_PUBLIC_APP_DISPLAY_NAME || 'My App'}
          </p>
        </div>
        <AuthButton />
      </div>
    </main>
  );
}
