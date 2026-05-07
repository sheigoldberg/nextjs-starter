import { PageHeader } from '@/components/dashboard';
import { ProfileClientPage } from '@/components/profile';

export default function ProfileEditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />
      <ProfileClientPage />
    </div>
  );
}
