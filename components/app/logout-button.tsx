"use client";

import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        void handleLogout();
      }}
      className="gap-2"
    >
      <LogOut className="h-4 w-4 text-slate-500" />
      Se déconnecter
    </DropdownMenuItem>
  );
}
