"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVerifySubscription } from "@/hooks/useSubscription";
import { useLabAuthStore } from "@/store/lab-auth.store";
import type { LabTier } from "@/types/auth";

const TIER_LABELS: Record<LabTier, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PREMIUM_B2B: "Premium",
};

export default function VerifySubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = use(searchParams);
  const router = useRouter();
  const setAuth = useLabAuthStore((s) => s.setAuth);
  const authState = useLabAuthStore((s) => s);

  const { data, isLoading, isError } = useVerifySubscription(reference ?? null);

  // On success, update tier in auth store so sidebar/TierBanner reflect new tier immediately
  useEffect(() => {
    if (data?.success && data.tier && authState.accessToken) {
      setAuth({
        accessToken: authState.accessToken,
        labId: authState.labId!,
        labName: authState.labName!,
        email: authState.email!,
        tier: data.tier,
        status: authState.status!,
        inTrial: false,
        trialEndDate: null,
      });
    }
  }, [data, authState.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect to /subscription after 4s on success
  useEffect(() => {
    if (data?.success) {
      const timer = setTimeout(() => router.push("/subscription"), 4000);
      return () => clearTimeout(timer);
    }
  }, [data?.success, router]);

  if (!reference) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-semibold text-red-800">Invalid Link</h2>
          <p className="mt-2 text-sm text-red-600">
            No payment reference found. Please go back and try again.
          </p>
          <Link
            href="/subscription"
            className="mt-4 inline-block rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Subscription
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">❌</p>
          <h2 className="text-lg font-semibold text-red-800">Verification Failed</h2>
          <p className="mt-2 text-sm text-red-600">
            We could not verify your payment. If you were charged, contact support.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/subscription/upgrade"
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              Try Again
            </Link>
            <Link
              href="/subscription"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              My Subscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data.success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-semibold text-amber-800">Payment Not Completed</h2>
          <p className="mt-2 text-sm text-amber-700">
            {data.message || "Your payment was not successful. No charge has been made."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/subscription/upgrade"
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center max-w-sm">
        <p className="text-5xl mb-3">🎉</p>
        <h2 className="text-lg font-semibold text-green-800">Payment Successful!</h2>
        <p className="mt-2 text-sm text-green-700">
          Welcome to <span className="font-semibold">{TIER_LABELS[data.tier]}</span>. Your
          account has been upgraded.
        </p>
        <p className="mt-3 text-xs text-green-600">Redirecting to your subscription page…</p>
        <Link
          href="/subscription"
          className="mt-4 inline-block rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          View Subscription
        </Link>
      </div>
    </div>
  );
}
