"use client";

import { ToastProviderContext } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProviderContext>
      {children}
      <Toaster />
    </ToastProviderContext>
  );
}
