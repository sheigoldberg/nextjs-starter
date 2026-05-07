'use client';

import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormField,
  FormInput,
  FormSelect,
  type SelectOption,
} from '@/components/ui';

// TODO: Replace with actual Role type from tRPC in Task 8.0
type Role = {
  id: string;
  name: string;
  description: string | null;
};

const invitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  roleId: z.string().min(1, 'Please select a role'),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface SendInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRoles: Role[];
  onSend: (data: InvitationFormData) => Promise<void>;
}

export function SendInvitationDialog({
  open,
  onOpenChange,
  availableRoles,
  onSend,
}: SendInvitationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      roleId: '',
    },
  });

  const handleSubmit = async (data: InvitationFormData) => {
    setIsLoading(true);
    try {
      await onSend(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to send invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: SelectOption[] = availableRoles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Invitation</DialogTitle>
          <DialogDescription>
            Invite a new user to join the platform with a specific role. They will receive an email
            with a link to accept the invitation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: ControllerRenderProps<InvitationFormData, 'email'> }) => (
                <FormInput
                  {...field}
                  label="Email Address"
                  placeholder="user@example.com"
                  type="email"
                  required
                  error={form.formState.errors.email}
                  description="The email address of the person you want to invite"
                />
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }: { field: ControllerRenderProps<InvitationFormData, 'roleId'> }) => (
                <FormSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  label="Role"
                  placeholder="Select a role"
                  options={roleOptions}
                  required
                  error={form.formState.errors.roleId}
                  description="The role that will be assigned to the invited user"
                />
              )}
            />
          </form>
        </Form>

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
            disabled={isLoading || !form.formState.isValid}
            className="min-w-[80px]"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
