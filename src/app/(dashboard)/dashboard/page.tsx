import { auth } from '@/auth';
import { PageHeader } from '@/components/dashboard';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <p className="text-muted-foreground text-sm">
        {`Welcome back${session?.user?.name ? `, ${session.user.name}` : ''}.`}
        {' '}Add features by creating new routes and tRPC procedures.
      </p>
    </div>
  );
}
