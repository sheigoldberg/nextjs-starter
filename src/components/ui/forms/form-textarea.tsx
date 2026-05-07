'use client';

import * as React from 'react';

import { Textarea } from '@/components/ui/textarea';
import { FieldError } from 'react-hook-form';

import { FormFieldWrapper } from './form-field-wrapper';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: FieldError;
  required?: boolean;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, description, error, required, className, ...props }, ref) => {
    return (
      <FormFieldWrapper
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
      >
        <Textarea ref={ref} {...props} />
      </FormFieldWrapper>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
