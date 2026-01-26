"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function CheckoutButton({
  sku,
  label,
  variant = "default",
}: {
  sku: "premium_monthly" | "premium_yearly" | "premium_lifetime" | "boost_pack_5";
  label: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
}) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Stripe checkout error");
      }

      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Paiement indisponible",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleCheckout} disabled={loading}>
      {label}
    </Button>
  );
}
