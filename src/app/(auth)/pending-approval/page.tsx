"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLogout } from "@/hooks/useAuth";

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const logout = useLogout();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold">Pending Approval</h1>
          <p className="text-muted-foreground">
            Your account{email ? ` (${email})` : ""} has been registered and is
            awaiting verification by the Cliniqa team. You&apos;ll receive an
            email once your account is approved.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4 text-left space-y-2">
          <p className="text-sm font-medium">What happens next?</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Our team reviews your registration details</li>
            <li>You may be asked to upload verification documents</li>
            <li>Approval typically takes 1–3 business days</li>
            <li>You&apos;ll receive an email with next steps</li>
          </ul>
        </div>

        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-sm text-muted-foreground hover:text-foreground underline disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense>
      <PendingApprovalContent />
    </Suspense>
  );
}
