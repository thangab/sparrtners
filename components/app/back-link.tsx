'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type BackLinkProps = {
  label: string;
  fallbackHref: string;
  className?: string;
};

export function BackLink({ label, fallbackHref, className }: BackLinkProps) {
  const router = useRouter();

  const handleClick = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn(
        'group h-9 rounded-full border-slate-200 bg-white/90 px-3 text-slate-700 shadow-sm backdrop-blur hover:border-slate-300 hover:bg-white hover:text-slate-900',
        className,
      )}
      aria-label={label}
    >
      <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
