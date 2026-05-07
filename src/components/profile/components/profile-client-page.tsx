'use client';

import { Loader } from '@/components/ui';
import { useSession } from 'next-auth/react';

import { ProfileClient } from './profile-client';

export function ProfileClientPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Loader message="Loading Profile" submessage="Retrieving your information..." />;
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <h2 className="text-2xl font-bold">Not signed in</h2>
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  // Use session data directly instead of tRPC profile query
  return (
    <ProfileClient profile={session.user as any} isProfileLoading={false} profileError={null} />
  );
}
