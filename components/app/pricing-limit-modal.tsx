'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function PricingLimitModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(searchParams.get('limit') === 'sessions');
  }, [searchParams]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('limit');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Limite mensuelle atteinte</DialogTitle>
          <DialogDescription>
            Ton plan Free inclut jusqu&apos;à 4 sessions publiées par mois.
            Passe en Pro pour publier en illimité et continuer à créer des
            sessions sans attendre le mois suivant.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
