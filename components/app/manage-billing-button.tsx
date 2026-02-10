'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function ManageBillingButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleOpenBillingPortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(
          payload.error || "Impossible d'ouvrir la gestion de l'abonnement.",
        );
      }

      window.location.href = payload.url;
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'ouvrir la gestion de l'abonnement.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleOpenBillingPortal} disabled={isLoading}>
      {isLoading ? 'Ouverture...' : "Gérer l'abonnement"}
    </Button>
  );
}
