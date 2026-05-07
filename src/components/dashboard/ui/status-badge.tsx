'use client';

import { Check, Clock, Eye, EyeOff, FileEdit, X } from 'lucide-react';

import { Badge } from '@/components/ui';
import { cn } from '@/components/ui';

type StatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'UNPUBLISHED';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
  size = 'default',
}: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          icon: FileEdit,
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        };
      case 'PENDING_APPROVAL':
        return {
          label: 'Pending Approval',
          icon: Clock,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 'PUBLISHED':
        return {
          label: 'Published',
          icon: Eye,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'UNPUBLISHED':
        return {
          label: 'Unpublished',
          icon: EyeOff,
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'PENDING':
        return {
          label: 'Pending',
          icon: Clock,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          icon: Check,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          icon: X,
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'SUSPENDED':
        return {
          label: 'Suspended',
          icon: X,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: 'secondary' as const,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs h-5',
    default: 'text-sm h-6',
    lg: 'text-base h-7',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1',
        className
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </Badge>
  );
}
