'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui';
import { Button } from '@/components/ui';
import { useDeleteAccount } from '@/components/profile';

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();

      toast.success('Account deleted successfully');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-card dark:border-border dark:bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground dark:text-foreground">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground dark:text-muted-foreground">
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDeleteAccount();
            }}
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
