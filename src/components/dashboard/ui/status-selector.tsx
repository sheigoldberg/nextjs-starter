'use client';

import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { ConfirmDialog } from '../dialogs/confirm-dialog';
import { StatusBadge } from './status-badge';

type StatusType = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'UNPUBLISHED';

interface StatusOption {
  value: StatusType;
  label: string;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}

interface StatusSelectorProps {
  value: StatusType;
  onChange: (status: StatusType) => void | Promise<void>;
  allowedStatuses?: StatusType[];
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'DRAFT',
    label: 'Draft',
  },
  {
    value: 'PENDING_APPROVAL',
    label: 'Pending Approval',
  },
  {
    value: 'PUBLISHED',
    label: 'Published',
    requiresConfirmation: true,
    confirmationTitle: 'Publish content?',
    confirmationDescription:
      'This will make the content publicly visible. Are you sure you want to publish?',
  },
  {
    value: 'UNPUBLISHED',
    label: 'Unpublished',
    requiresConfirmation: true,
    confirmationTitle: 'Unpublish content?',
    confirmationDescription:
      'This will hide the content from public view. Are you sure you want to unpublish?',
  },
];

export function StatusSelector({
  value,
  onChange,
  allowedStatuses,
  disabled,
  className,
  isLoading = false,
}: StatusSelectorProps) {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<StatusType | null>(null);

  const availableStatuses = React.useMemo(() => {
    const options = allowedStatuses
      ? DEFAULT_STATUS_OPTIONS.filter((option) => allowedStatuses.includes(option.value))
      : DEFAULT_STATUS_OPTIONS;
    return options;
  }, [allowedStatuses]);

  const handleStatusChange = (newStatus: string) => {
    const statusOption = availableStatuses.find((option) => option.value === newStatus);

    if (statusOption?.requiresConfirmation) {
      setPendingStatus(newStatus as StatusType);
      setShowConfirmation(true);
    } else {
      onChange(newStatus as StatusType);
    }
  };

  const handleConfirm = async () => {
    if (pendingStatus) {
      await onChange(pendingStatus);
      setPendingStatus(null);
    }
  };

  const handleCancel = () => {
    setPendingStatus(null);
    setShowConfirmation(false);
  };

  const currentStatusOption = availableStatuses.find((option) => option.value === pendingStatus);

  return (
    <>
      <Select value={value} onValueChange={handleStatusChange} disabled={disabled || isLoading}>
        <SelectTrigger className={className}>
          <SelectValue>
            <StatusBadge status={value} size="sm" />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <StatusBadge status={option.value} size="sm" />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentStatusOption?.requiresConfirmation && (
        <ConfirmDialog
          open={showConfirmation}
          onOpenChange={handleCancel}
          title={currentStatusOption.confirmationTitle || 'Confirm status change'}
          description={
            currentStatusOption.confirmationDescription || 'Are you sure you want to proceed?'
          }
          onConfirm={handleConfirm}
          variant={currentStatusOption.value === 'UNPUBLISHED' ? 'destructive' : 'default'}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
