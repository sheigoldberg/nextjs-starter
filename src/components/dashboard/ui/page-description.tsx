'use client';

import { cn } from '@/components/ui';

interface PageDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageDescription({ children, className }: PageDescriptionProps) {
  return <p className={cn('text-muted-foreground', className)}>{children}</p>;
}
