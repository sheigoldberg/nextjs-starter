'use client';

import * as React from 'react';

import { FieldError } from 'react-hook-form';

import { Checkbox } from '@/components/ui';
import { FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui';

interface FormCheckboxProps {
  label?: string;
  description?: string;
  error?: FieldError;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  disabled,
  className,
}: FormCheckboxProps) {
  return (
    <FormItem className={className}>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          id={label}
        />
        {label && (
          <FormLabel htmlFor={label} className="cursor-pointer font-normal">
            {label}
          </FormLabel>
        )}
      </div>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error.message}</FormMessage>}
    </FormItem>
  );
}
