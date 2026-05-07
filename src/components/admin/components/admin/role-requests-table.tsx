'use client';

import * as React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { Check, Clock, MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui';
import {
  useAllRoleRequests,
  useApproveRoleRequest,
  useRejectRoleRequest,
} from '@/components/admin';
import { DataTable } from '@/components/dashboard';
import { DataTableColumnHeader } from '@/components/dashboard';
import { ConfirmDialog } from '@/components/dashboard';
import { EmptyState } from '@/components/dashboard';
import { type RouterOutputs } from '@/utils/api';

// Extract type from tRPC router
type RoleRequest = RouterOutputs['roleRequests']['getAllRequests'][number];

interface RoleRequestsTableProps {
  showHeader?: boolean;
  showMobileCards?: boolean;
  maxItems?: number;
}

export function RoleRequestsTable({
  showHeader = true,
  showMobileCards = true,
  maxItems,
}: RoleRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = React.useState<RoleRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [adminResponse, setAdminResponse] = React.useState('');

  // Fetch data
  const { data: requests = [], isLoading } = useAllRoleRequests();

  // Mutations
  const approveRequestMutation = useApproveRoleRequest();
  const rejectRequestMutation = useRejectRoleRequest();

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await approveRequestMutation.mutateAsync({
        id: selectedRequest.id,
        response: adminResponse || undefined,
      });
      toast.success('Role request approved successfully');
      setShowApproveDialog(false);
      setAdminResponse('');
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await rejectRequestMutation.mutateAsync({
        id: selectedRequest.id,
        response: adminResponse || undefined,
      });
      toast.success('Role request rejected');
      setShowRejectDialog(false);
      setAdminResponse('');
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const columns: ColumnDef<RoleRequest>[] = [
    {
      accessorKey: 'user',
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const user = row.getValue('user') as RoleRequest['user'];
        return (
          <div>
            <div className="font-medium">{user.name || 'No name'}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requested Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as RoleRequest['role'];
        return (
          <div>
            <div className="font-medium">{role.name}</div>
            {role.description && (
              <div className="text-sm text-muted-foreground">{role.description}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'requestMessage',
      header: 'User Message',
      cell: ({ row }) => {
        const message = row.getValue('requestMessage') as string | null;
        return (
          <div className="max-w-md truncate text-sm">
            {message || <span className="text-muted-foreground">No message</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const config = {
          PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
          APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
          REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
        }[status] || { label: status, className: '' };
        return <Badge className={config.className}>{config.label}</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return <div className="text-sm">{new Date(date).toLocaleDateString()}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original;
        const isPending = request.status === 'PENDING';

        if (!isPending) {
          return (
            <div className="text-sm text-muted-foreground">
              {request.reviewedAt && (
                <>Responded {new Date(request.reviewedAt).toLocaleDateString()}</>
              )}
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequest(request);
                setShowApproveDialog(true);
              }}
            >
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequest(request);
                setShowRejectDialog(true);
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  // Limit items if maxItems is specified
  const displayRequests = maxItems ? requests.slice(0, maxItems) : requests;

  if (showHeader) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Requests</h1>
          <p className="text-muted-foreground">
            Review and respond to user requests for additional roles and permissions.
          </p>
        </div>

        {displayRequests.length === 0 && !isLoading ? (
          <EmptyState
            icon={Clock}
            title="No role requests"
            description="There are no role requests at the moment."
          />
        ) : (
          <>
            {/* Desktop: Data Table */}
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={displayRequests}
                searchKey={['user', 'role']}
                isLoading={isLoading}
              />
            </div>

            {/* Mobile: Card Layout */}
            {showMobileCards && (
              <div className="block space-y-3 md:hidden">
                {displayRequests.map((request: RoleRequest) => {
                  const statusConfigMap: Record<string, { label: string; className: string }> = {
                    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
                    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
                    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
                  };
                  const statusConfig = statusConfigMap[request.status] || { label: request.status, className: '' };

                  return (
                    <div key={request.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="truncate font-medium">
                            {request.user.name || 'No name'}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            {request.user.email}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                          {request.status === 'PENDING' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium">{request.role.name}</div>
                        {request.role.description && (
                          <div className="text-xs text-muted-foreground">
                            {request.role.description}
                          </div>
                        )}
                      </div>

                      {request.requestMessage && (
                        <div className="text-sm">
                          <div className="mb-1 text-xs font-medium text-muted-foreground">
                            User Message:
                          </div>
                          <div className="text-sm">{request.requestMessage}</div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <ConfirmDialog
          open={showApproveDialog}
          onOpenChange={setShowApproveDialog}
          title="Approve Role Request"
          description={
            selectedRequest
              ? `Grant ${selectedRequest.role.name} role to ${selectedRequest.user.name || selectedRequest.user.email}?`
              : ''
          }
          confirmLabel="Approve"
          onConfirm={handleApprove}
          variant="default"
        />

        <ConfirmDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Role Request"
          description={
            selectedRequest
              ? `Reject ${selectedRequest.role.name} role request from ${selectedRequest.user.name || selectedRequest.user.email}?`
              : ''
          }
          confirmLabel="Reject"
          onConfirm={handleReject}
          variant="destructive"
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
            <Clock className="h-5 w-5" />
            Role Requests
          </CardTitle>
          <CardDescription>
            Review and respond to user requests for additional roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayRequests.length === 0 && !isLoading ? (
            <EmptyState
              icon={Clock}
              title="No role requests"
              description="There are no role requests at the moment."
            />
          ) : (
            <>
              {/* Desktop: Data Table */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={displayRequests}
                  searchKey={['user', 'role']}
                  isLoading={isLoading}
                />
              </div>

              {/* Mobile: Card Layout */}
              {showMobileCards && (
                <div className="block space-y-3 md:hidden">
                  {displayRequests.map((request: RoleRequest) => {
                    const statusConfigMap: Record<string, { label: string; className: string }> = {
                      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
                      APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
                      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
                    };
                    const statusConfig = statusConfigMap[request.status] || { label: request.status, className: '' };

                    return (
                      <div key={request.id} className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="truncate font-medium">
                              {request.user.name || 'No name'}
                            </div>
                            <div className="truncate text-sm text-muted-foreground">
                              {request.user.email}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                            {request.status === 'PENDING' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowApproveDialog(true);
                                    }}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium">{request.role.name}</div>
                          {request.role.description && (
                            <div className="text-xs text-muted-foreground">
                              {request.role.description}
                            </div>
                          )}
                        </div>

                        {request.requestMessage && (
                          <div className="text-sm">
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              User Message:
                            </div>
                            <div className="text-sm">{request.requestMessage}</div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Requested {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title="Approve Role Request"
        description={
          selectedRequest
            ? `Grant ${selectedRequest.role.name} role to ${selectedRequest.user.name || selectedRequest.user.email}?`
            : ''
        }
        confirmLabel="Approve"
        onConfirm={handleApprove}
        variant="default"
      />

      <ConfirmDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Reject Role Request"
        description={
          selectedRequest
            ? `Reject ${selectedRequest.role.name} role request from ${selectedRequest.user.name || selectedRequest.user.email}?`
            : ''
        }
        confirmLabel="Reject"
        onConfirm={handleReject}
        variant="destructive"
      />
    </>
  );
}
