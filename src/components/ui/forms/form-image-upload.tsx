'use client';

import * as React from 'react';

import { ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { FieldError } from 'react-hook-form';

import { Button } from '@/components/ui';
import { Progress } from '@/components/ui';
import { cn } from '@/components/ui';

import { FormFieldWrapper } from './form-field-wrapper';

interface FormImageUploadProps {
  label?: string;
  description?: string;
  error?: FieldError;
  required?: boolean;
  value?: string;
  onChange: (url: string | undefined) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

export function FormImageUpload({
  label,
  description,
  error,
  required,
  value,
  onChange,
  onUpload,
  disabled,
  className,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}: FormImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = React.useCallback(
    (file: File): string | null => {
      if (!acceptedFormats.includes(file.type)) {
        return `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      return null;
    },
    [acceptedFormats, maxSizeMB]
  );

  const handleFile = React.useCallback(
    async (file: File) => {
      setUploadError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const url = await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        onChange(url);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUpload, onChange, validateFile]
  );

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        await handleFile(file);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleFileSelect = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDelete = React.useCallback(() => {
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      <div className="space-y-4">
        {value && value.trim() !== '' ? (
          <div className="relative">
            <img
              src={value}
              alt="Upload preview"
              className="max-h-64 w-full rounded-lg border object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleDelete}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors',
              isDragging && 'border-primary bg-primary/5',
              disabled && 'cursor-not-allowed opacity-50',
              !disabled && 'cursor-pointer hover:border-primary hover:bg-muted/50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              disabled={disabled}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-2">
                <Upload className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Click to upload an image</p>
                  <p className="text-xs text-muted-foreground/70">
                    {acceptedFormats.map((format) => format.split('/')[1]).join(', ')} • Max{' '}
                    {maxSizeMB}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4" />
            {uploadError}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
}
