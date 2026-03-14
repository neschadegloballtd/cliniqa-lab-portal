"use client";

import { useRouter } from "next/navigation";
import { useLabAuthStore } from "@/store/lab-auth.store";
import { ShieldAlert } from "lucide-react";

export default function SessionExpiredModal() {
  const router = useRouter();
  const sessionExpired = useLabAuthStore((s) => s.sessionExpired);
  const clearAuth = useLabAuthStore((s) => s.clearAuth);

  if (!sessionExpired) return null;

  function handleLoginAgain() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Session expired</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Your session is no longer valid. Please log in again to continue.
        </p>
        <button
          onClick={handleLoginAgain}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Log in again
        </button>
      </div>
    </div>
  );
}
