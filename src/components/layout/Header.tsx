"use client";

import { useLabAuthStore } from "@/store/lab-auth.store";
import { useLogout } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

export default function Header() {
  const labName = useLabAuthStore((s) => s.labName);
  const logout = useLogout();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <span className="text-sm font-medium text-muted-foreground">{labName}</span>
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </header>
  );
}
