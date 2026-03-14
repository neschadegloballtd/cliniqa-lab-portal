"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSubscriptionStatus, useCancelSubscription } from "@/hooks/useSubscription";
import type { LabTier } from "@/types/auth";
import type { SubscriptionStatus, BillingCycle } from "@/types/subscription";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<LabTier, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PREMIUM_B2B: "Premium",
};

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  TRIAL: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  NONE: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  NONE: "No subscription",
};

const CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
};

function formatDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy");
}

function trialDaysLeft(trialEndDate: string): number {
  const ms = new Date(trialEndDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── Cancel confirm dialog ────────────────────────────────────────────────────

interface CancelDialogProps {
  onConfirm: () => void;
  onClose: () => void;
  isCancelling: boolean;
}

function CancelDialog({ onConfirm, onClose, isCancelling }: CancelDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Cancel subscription?</h3>
        <p className="mt-2 text-sm text-gray-500">
          Your access will remain active until the end of the current billing period. After that,
          your account will revert to read-only.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isCancelling ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, isLoading, isError } = useSubscriptionStatus();
  const { mutateAsync: cancel, isPending: isCancelling } = useCancelSubscription();

  const handleCancel = async () => {
    try {
      await cancel();
      toast.success("Subscription cancelled. Access continues until period end.");
      setShowCancelDialog(false);
    } catch {
      toast.error("Failed to cancel subscription.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading…</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-sm text-red-600">Failed to load subscription status.</div>
    );
  }

  const daysLeft = data.inTrial && data.trialEndDate ? trialDaysLeft(data.trialEndDate) : null;
  const canCancel =
    data.subscriptionStatus === "ACTIVE" && !data.cancelAtPeriodEnd;
  const isFree = data.tier === "FREE";

  return (
    <>
      {showCancelDialog && (
        <CancelDialog
          onConfirm={handleCancel}
          onClose={() => setShowCancelDialog(false)}
          isCancelling={isCancelling}
        />
      )}

      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Subscription</h1>

        {/* Current plan card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Current Plan
              </p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900">
                {TIER_LABELS[data.tier]}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[data.subscriptionStatus]}`}
            >
              {STATUS_LABELS[data.subscriptionStatus]}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.billingCycle && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Billing Cycle
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {CYCLE_LABELS[data.billingCycle]}
                </dd>
              </div>
            )}

            {data.currentPeriodEnd && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {data.cancelAtPeriodEnd ? "Access Ends" : "Next Payment"}
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {formatDate(data.currentPeriodEnd)}
                </dd>
              </div>
            )}

            {data.inTrial && data.trialEndDate && (
              <div className="col-span-full rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-medium text-blue-800">
                  Trial active —{" "}
                  {daysLeft === 0
                    ? "expires today"
                    : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
                </p>
                <p className="mt-0.5 text-xs text-blue-600">
                  Trial ends {formatDate(data.trialEndDate)}. Upgrade before it expires to keep
                  full access.
                </p>
              </div>
            )}

            {data.cancelAtPeriodEnd && (
              <div className="col-span-full rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  Your subscription is cancelled and will not renew. Access continues until{" "}
                  {data.currentPeriodEnd ? formatDate(data.currentPeriodEnd) : "period end"}.
                </p>
              </div>
            )}
          </dl>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            {(isFree || data.subscriptionStatus === "EXPIRED" || data.subscriptionStatus === "NONE" || data.subscriptionStatus === "CANCELLED") && (
              <Link
                href="/subscription/upgrade"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Upgrade Plan
              </Link>
            )}

            {data.inTrial && (
              <Link
                href="/subscription/upgrade"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Upgrade Now
              </Link>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="rounded-lg border border-red-300 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cancel Subscription
              </button>
            )}

            {data.subscriptionStatus === "ACTIVE" && !canCancel && !data.cancelAtPeriodEnd && (
              <Link
                href="/subscription/upgrade"
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Change Plan
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
