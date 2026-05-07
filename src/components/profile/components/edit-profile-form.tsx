'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import { Input } from '@/components/ui';
import { useProfile, useUpdateProfile } from '@/components/profile';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || '',
    },
    values: {
      name: profile?.name || '',
    },
    mode: 'onChange',
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Profile updated successfully');
      router.push('/profile');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  }

  if (isProfileLoading) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {profile?.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Email is connected to your Google account and cannot be changed.
              </p>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<ProfileFormValues, 'name'> }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
