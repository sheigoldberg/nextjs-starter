'use client';

import * as React from 'react';

import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';

type FormError =
  | FieldError
  | Merge<FieldError, FieldErrorsImpl<any>>
  | Merge<FieldError, (FieldError | undefined)[]>
  | undefined;

interface FormFieldWrapperProps {
  label?: string;
  description?: string;
  error?: FormError;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormFieldWrapper({
  label,
  description,
  error,
  required,
  children,
  className,
  htmlFor,
}: FormFieldWrapperProps) {
  return (
    <FormItem className={className}>
      {label && (
        <FormLabel htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </FormLabel>
      )}
      <FormControl>{children}</FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{String(error.message || 'Invalid input')}</FormMessage>}
    </FormItem>
  );
}
