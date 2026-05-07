'use client';

import { Card, CardContent, CardHeader, CardTitle, NavigationOutlineButton, UserAvatar } from '@/components/ui';

import { DeleteAccountButton } from './delete-account-button';

// User profile from NextAuth session
interface UserProfile {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

interface ProfileClientProps {
  profile: UserProfile;
  isProfileLoading: boolean;
  profileError: Error | null;
}

export function ProfileClient({ profile, isProfileLoading, profileError }: ProfileClientProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground">Manage your profile details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <UserAvatar
            name={profile.name}
            image={profile.image}
            email={profile.email}
            className="h-24 w-24"
            fallbackClassName="text-2xl"
          />
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">{profile.name ?? 'User'}</h2>
            <p className="text-sm text-muted-foreground">{profile.email ?? ''}</p>
            {profile.phone && (
              <p className="text-sm text-muted-foreground">Phone: {profile.phone}</p>
            )}
            {profile.whatsapp && (
              <p className="text-sm text-muted-foreground">WhatsApp: {profile.whatsapp}</p>
            )}
          </div>
          <div className="flex w-full justify-center gap-3 pt-4">
            <NavigationOutlineButton href="/profile/edit">Edit Profile</NavigationOutlineButton>
            <DeleteAccountButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
