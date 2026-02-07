'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';

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
    <Button variant="ghost" onClick={handleClick} className={className}>
      <ChevronLeft className="mr-1 h-4 w-4" /> {label}
    </Button>
  );
}
