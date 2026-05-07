import { PageHeader } from '@/components/dashboard';
import { RoleManagementTable } from '@/components/admin';

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Roles" />
      <RoleManagementTable />
    </div>
  );
}
