'use client';

import * as React from 'react';

import { FieldError } from 'react-hook-form';

import { Input } from '@/components/ui';

import { FormFieldWrapper } from './form-field-wrapper';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: FieldError;
  required?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, description, error, required, className, ...props }, ref) => {
    return (
      <FormFieldWrapper
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
      >
        <Input ref={ref} {...props} />
      </FormFieldWrapper>
    );
  }
);

FormInput.displayName = 'FormInput';
