import { PageHeader } from '@/components/dashboard';
import { UsersTable } from '@/components/admin';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Users" />
      <UsersTable />
    </div>
  );
}
