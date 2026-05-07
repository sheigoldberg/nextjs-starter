'use client';

import * as React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, MoreHorizontal, Plus, UserCog, Users } from 'lucide-react';

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
import { EditUserRolesDialog } from '@/components/admin';
import { SendInvitationDialog } from '@/components/admin';
import { DataTable } from '@/components/dashboard';
import { DataTableColumnHeader } from '@/components/dashboard';
import { EmptyState } from '@/components/dashboard';

// TODO: Replace with actual tRPC hook in Task 8.0
type User = {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  assignedRoles: { id: string; name: string }[];
  createdAt: Date;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
};

interface UsersTableProps {
  showHeader?: boolean;
  showMobileCards?: boolean;
  maxItems?: number;
}

export function UsersTable({
  showHeader = true,
  showMobileCards = true,
  maxItems,
}: UsersTableProps) {
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);

  // TODO: Replace with actual tRPC query in Task 8.0
  const users: User[] = [];
  const isLoading = false;

  // TODO: Replace with actual tRPC query in Task 8.0
  const availableRoles: Role[] = [];

  const handleSaveUserRoles = async (userId: string, roleIds: string[]) => {
    // TODO: Implement tRPC mutation in Task 8.0
    console.log('Saving roles for user:', userId, 'Roles:', roleIds);
    // await api.userRoles.assignRole.mutate({ userId, roleIds });
  };

  const handleSendInvitation = async (data: {
    email: string;
    roleId: string;
    message?: string;
  }) => {
    // TODO: Implement tRPC mutation in Task 8.0
    console.log('Sending invitation:', data);
    // await api.invitations.createInvitation.mutate(data);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const name = row.getValue('name') as string | null;
        return <div className="font-medium">{name || 'No name'}</div>;
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        return <div className="text-sm">{email}</div>;
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Base Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <div className="text-sm">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {role}
            </span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'assignedRoles',
      header: 'Assigned Roles',
      cell: ({ row }) => {
        const roles = row.getValue('assignedRoles') as { id: string; name: string }[];
        if (roles.length === 0) {
          return <div className="text-sm text-muted-foreground">None</div>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
              >
                {role.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Registered" />,
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return <div className="text-sm">{new Date(date).toLocaleDateString()}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;

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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setShowEditDialog(true);
                }}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Edit Roles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Limit items if maxItems is specified
  const displayUsers = maxItems ? users.slice(0, maxItems) : users;

  if (showHeader) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and assign custom roles with specific permissions.
          </p>
        </div>

        {displayUsers.length === 0 && !isLoading ? (
          <EmptyState
            icon={UserCog}
            title="No users found"
            description="Get started by inviting users to your platform."
            action={
              <Button onClick={() => setShowInviteDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: Data Table */}
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={displayUsers}
                searchKey={['email', 'name']}
                isLoading={isLoading}
              />
            </div>

            {/* Mobile: Card Layout */}
            {showMobileCards && (
              <div className="block space-y-3 md:hidden">
                {displayUsers.map((user) => (
                  <div key={user.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="min-w-0 flex-1 cursor-pointer space-y-1"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="truncate font-medium">{user.name || 'No name'}</div>
                        <div className="truncate text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {user.role}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Roles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {user.assignedRoles && user.assignedRoles.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          Assigned Roles:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.assignedRoles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Registered {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <EditUserRolesDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={selectedUser}
          availableRoles={availableRoles}
          onSave={handleSaveUserRoles}
        />

        <SendInvitationDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          availableRoles={availableRoles}
          onSend={handleSendInvitation}
        />
      </div>
    );
  }

  // Compact view for admin dashboard
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
          <CardDescription>
            Manage user accounts and assign custom roles with specific permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 && !isLoading ? (
            <EmptyState
              icon={UserCog}
              title="No users found"
              description="Get started by inviting users to your platform."
              action={
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop: Data Table */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={displayUsers}
                  searchKey={['email', 'name']}
                  isLoading={isLoading}
                />
              </div>

              {/* Mobile: Card Layout */}
              {showMobileCards && (
                <div className="block space-y-3 md:hidden">
                  {displayUsers.map((user) => (
                    <div key={user.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div
                          className="min-w-0 flex-1 cursor-pointer space-y-1"
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="truncate font-medium">{user.name || 'No name'}</div>
                          <div className="truncate text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {user.role}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Roles
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {user.assignedRoles && user.assignedRoles.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs font-medium text-muted-foreground">
                            Assigned Roles:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {user.assignedRoles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                              >
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Registered {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EditUserRolesDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={selectedUser}
        availableRoles={availableRoles}
        onSave={handleSaveUserRoles}
      />

      <SendInvitationDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        availableRoles={availableRoles}
        onSend={handleSendInvitation}
      />
    </>
  );
}
