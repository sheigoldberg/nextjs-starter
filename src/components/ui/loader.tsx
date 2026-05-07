'use client';

import { useEffect, useState } from 'react';

import { Loader2, Settings } from 'lucide-react';

interface LoaderProps {
  message?: string;
  submessage?: string;
  showAfterMs?: number;
}

export function Loader({
  message = 'Loading...',
  submessage = 'We will be with you shortly',
  showAfterMs = 300,
}: LoaderProps) {
  const [show, setShow] = useState(showAfterMs <= 0);

  useEffect(() => {
    // If showAfterMs is 0 or negative, show immediately
    if (showAfterMs <= 0) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, showAfterMs);

    return () => clearTimeout(timer);
  }, [showAfterMs]);

  if (!show) return null;

  return (
    <div className="bg-background/95 absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="relative">
          <Settings className="text-primary h-16 w-16" />
          <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full" />
          <div className="bg-primary/10 absolute inset-0 rounded-full" />
        </div>

        <div className="space-y-2">
          <h2 className="text-foreground text-2xl font-bold tracking-tight">{message}</h2>
          <p className="text-muted-foreground">{submessage}</p>
        </div>

        <div className="text-primary flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Please wait...</span>
        </div>
      </div>
    </div>
  );
}
