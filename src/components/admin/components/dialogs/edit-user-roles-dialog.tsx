'use client';

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormCheckbox,
  ScrollArea,
} from '@/components/ui';

// TODO: Replace with actual Role type from tRPC in Task 8.0
type Role = {
  id: string;
  name: string;
  description: string | null;
};

type User = {
  id: string;
  name: string | null;
  email: string;
  assignedRoles: { id: string; name: string }[];
};

const editRolesSchema = z.object({
  roleIds: z.array(z.string()),
});

type EditRolesFormData = z.infer<typeof editRolesSchema>;

interface EditUserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  availableRoles: Role[];
  onSave: (userId: string, roleIds: string[]) => Promise<void>;
}

export function EditUserRolesDialog({
  open,
  onOpenChange,
  user,
  availableRoles,
  onSave,
}: EditUserRolesDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<EditRolesFormData>({
    resolver: zodResolver(editRolesSchema),
    defaultValues: {
      roleIds: user?.assignedRoles.map((role) => role.id) || [],
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        roleIds: user.assignedRoles.map((role) => role.id),
      });
    }
  }, [user, form]);

  const handleSubmit = async (data: EditRolesFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await onSave(user.id, data.roleIds);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update user roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const watchedRoleIds = form.watch('roleIds');

  const toggleRole = (roleId: string) => {
    const currentRoles = watchedRoleIds;
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((id) => id !== roleId)
      : [...currentRoles, roleId];
    form.setValue('roleIds', newRoles);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User Roles</DialogTitle>
          <DialogDescription>
            Assign custom roles to <span className="font-medium">{user.name || user.email}</span>.
            Users will inherit all permissions from their assigned roles.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {availableRoles.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No roles available. Create roles in the Roles management page.
              </div>
            ) : (
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                  >
                    <FormCheckbox
                      checked={watchedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      label={role.name}
                      description={role.description || undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
