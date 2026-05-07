import { PageHeader } from '@/components/dashboard';
import { RoleRequestsTable } from '@/components/admin';

export default function AdminRoleRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Role Requests" />
      <RoleRequestsTable />
    </div>
  );
}
