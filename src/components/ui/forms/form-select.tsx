'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldError } from 'react-hook-form';

import { FormFieldWrapper } from './form-field-wrapper';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps {
  label?: string;
  description?: string;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  description,
  error,
  required,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
  disabled,
  className,
}: FormSelectProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
}
