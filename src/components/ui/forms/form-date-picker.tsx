'use client';

import * as React from 'react';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { FieldError } from 'react-hook-form';

import { Button } from '@/components/ui';
import { Calendar } from '@/components/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { cn } from '@/components/ui';

import { FormFieldWrapper } from './form-field-wrapper';

interface FormDatePickerProps {
  label?: string;
  description?: string;
  error?: FieldError;
  required?: boolean;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FormDatePicker({
  label,
  description,
  error,
  required,
  value,
  onChange,
  disabled,
  placeholder = 'Pick a date',
  className,
}: FormDatePickerProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
        </PopoverContent>
      </Popover>
    </FormFieldWrapper>
  );
}
