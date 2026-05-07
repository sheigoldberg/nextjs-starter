'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, MoreHorizontal, Plus, Shield, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { DataTable } from '@/components/dashboard';
import { DataTableColumnHeader } from '@/components/dashboard';
import { EmptyState } from '@/components/dashboard';

// TODO: Replace with actual tRPC hook in Task 8.0
type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: { id: string; name: string }[];
  _count?: {
    userRoles: number;
  };
};

interface RoleManagementTableProps {
  showHeader?: boolean;
  showMobileCards?: boolean;
  maxItems?: number;
}

export function RoleManagementTable({
  showHeader = true,
  showMobileCards = true,
  maxItems,
}: RoleManagementTableProps) {
  // TODO: Replace with actual tRPC query in Task 8.0
  const roles: Role[] = [];
  const isLoading = false;

  const handleEditRole = (roleId: string) => {
    // TODO: Implement edit role functionality in Task 8.0
    console.log('Edit role:', roleId);
  };

  const handleDeleteRole = (roleId: string) => {
    // TODO: Implement delete role functionality in Task 8.0
    console.log('Delete role:', roleId);
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role Name" />,
      cell: ({ row }) => {
        const name = row.getValue('name') as string;
        return <div className="font-medium">{name}</div>;
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null;
        return (
          <div className="text-sm text-muted-foreground">
            {description || 'No description provided'}
          </div>
        );
      },
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.getValue('permissions') as { id: string; name: string }[];
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.map((permission) => (
              <Badge key={permission.id} variant="outline" className="text-xs">
                {permission.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: '_count',
      header: 'Users',
      cell: ({ row }) => {
        const count = row.getValue('_count') as { userRoles: number } | undefined;
        const userCount = count?.userRoles || 0;
        return (
          <div className="text-sm">
            {userCount} user{userCount !== 1 ? 's' : ''}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const role = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEditRole(role.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteRole(role.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Limit items if maxItems is specified
  const displayRoles = maxItems ? roles.slice(0, maxItems) : roles;

  if (showHeader) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Create and manage custom roles with specific permissions for your platform.
          </p>
        </div>

        {displayRoles.length === 0 && !isLoading ? (
          <EmptyState
            icon={Shield}
            title="No roles found"
            description="Get started by creating your first custom role."
            action={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: Data Table */}
            <div className="hidden md:block">
              <DataTable columns={columns} data={displayRoles} isLoading={isLoading} />
            </div>

            {/* Mobile: Card Layout */}
            {showMobileCards && (
              <div className="block space-y-3 md:hidden">
                {displayRoles.map((role) => (
                  <div key={role.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Shield className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{role.name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 flex-shrink-0 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditRole(role.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {role.permissions.length} permission
                        {role.permissions.length !== 1 ? 's' : ''}
                      </span>
                      <span>
                        {role._count?.userRoles || 0} user
                        {(role._count?.userRoles || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Compact view for admin dashboard
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>
          Create and manage custom roles with specific permissions for your platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayRoles.length === 0 && !isLoading ? (
          <EmptyState
            icon={Shield}
            title="No roles found"
            description="Get started by creating your first custom role."
            action={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: Data Table */}
            <div className="hidden md:block">
              <DataTable columns={columns} data={displayRoles} isLoading={isLoading} />
            </div>

            {/* Mobile: Card Layout */}
            {showMobileCards && (
              <div className="block space-y-3 md:hidden">
                {displayRoles.map((role) => (
                  <div key={role.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Shield className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{role.name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 flex-shrink-0 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditRole(role.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {role.permissions.length} permission
                        {role.permissions.length !== 1 ? 's' : ''}
                      </span>
                      <span>
                        {role._count?.userRoles || 0} user
                        {(role._count?.userRoles || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
