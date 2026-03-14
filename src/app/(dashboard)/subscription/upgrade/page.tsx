"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useInitializeSubscription } from "@/hooks/useSubscription";
import type { LabTier } from "@/types/auth";
import type { BillingCycle } from "@/types/subscription";

// ── Pricing data ─────────────────────────────────────────────────────────────

interface PlanPrice {
  monthly: number;
  annual: number; // total per year
}

const PRICES: Record<Exclude<LabTier, "FREE">, PlanPrice> = {
  BASIC: { monthly: 15_000, annual: 120_000 },
  PREMIUM_B2B: { monthly: 40_000, annual: 350_000 },
};

const PLAN_FEATURES: Record<Exclude<LabTier, "FREE">, string[]> = {
  BASIC: [
    "Unlimited result uploads",
    "Patient notifications",
    "Bookings management",
    "Pre-analytical error tracking",
    "QA Dashboard",
    "Up to 3 staff accounts",
  ],
  PREMIUM_B2B: [
    "Everything in Basic",
    "Unlimited staff accounts",
    "Priority support",
    "Advanced analytics & exports",
    "Custom branding",
    "Dedicated account manager",
  ],
};

function formatNaira(kobo: number): string {
  return `₦${kobo.toLocaleString("en-NG")}`;
}

function annualMonthlySaving(tier: Exclude<LabTier, "FREE">): number {
  const { monthly, annual } = PRICES[tier];
  return monthly * 12 - annual;
}

// ── Plan card ─────────────────────────────────────────────────────────────────

interface PlanCardProps {
  tier: Exclude<LabTier, "FREE">;
  cycle: BillingCycle;
  selected: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

function PlanCard({ tier, cycle, selected, onSelect, isLoading }: PlanCardProps) {
  const prices = PRICES[tier];
  const isPremium = tier === "PREMIUM_B2B";
  const displayPrice =
    cycle === "MONTHLY" ? prices.monthly : Math.round(prices.annual / 12);
  const saving = annualMonthlySaving(tier);

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 transition-all ${
        isPremium
          ? selected
            ? "border-indigo-600 bg-indigo-50"
            : "border-indigo-200 bg-white"
          : selected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {isPremium && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
            Best Value
          </span>
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900">
        {tier === "BASIC" ? "Basic" : "Premium"}
      </h3>

      <div className="mt-3 flex items-end gap-1">
        <span className="text-3xl font-bold text-gray-900">{formatNaira(displayPrice)}</span>
        <span className="mb-1 text-sm text-gray-500">/mo</span>
      </div>

      {cycle === "ANNUAL" && (
        <p className="mt-0.5 text-xs text-green-600 font-medium">
          {formatNaira(saving)} saved vs monthly
        </p>
      )}

      {cycle === "ANNUAL" && (
        <p className="text-xs text-gray-400">Billed {formatNaira(prices.annual)}/year</p>
      )}

      <ul className="mt-5 space-y-2">
        {PLAN_FEATURES[tier].map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 text-green-500 shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          isPremium
            ? selected
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            : selected
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-blue-300 text-blue-700 hover:bg-blue-50"
        }`}
      >
        {isLoading && selected ? "Redirecting…" : `Get ${tier === "BASIC" ? "Basic" : "Premium"}`}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedTier, setSelectedTier] = useState<Exclude<LabTier, "FREE"> | null>(null);

  const { mutateAsync: initialize, isPending } = useInitializeSubscription();

  const handleSelect = async (tier: Exclude<LabTier, "FREE">) => {
    setSelectedTier(tier);
    try {
      const res = await initialize({ tier, billingCycle: cycle });
      const url = res.data?.authorizationUrl;
      if (!url) throw new Error("No authorization URL returned");
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setSelectedTier(null);
    }
  };

  const basicSaving = annualMonthlySaving("BASIC");
  const premiumSaving = annualMonthlySaving("PREMIUM_B2B");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Upgrade Your Plan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose the plan that fits your lab. Cancel anytime.
        </p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          {(["MONTHLY", "ANNUAL"] as BillingCycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
                cycle === c
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {c === "MONTHLY" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>
        {cycle === "ANNUAL" && (
          <p className="text-xs text-green-600 font-medium">
            Save up to {formatNaira(premiumSaving)} per year
          </p>
        )}
      </div>

      {/* Annual savings callout */}
      {cycle === "ANNUAL" && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-3">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Annual billing</span> saves you{" "}
            <span className="font-semibold">{formatNaira(basicSaving)}</span> on Basic and{" "}
            <span className="font-semibold">{formatNaira(premiumSaving)}</span> on Premium
            compared to monthly.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PlanCard
          tier="BASIC"
          cycle={cycle}
          selected={selectedTier === "BASIC"}
          onSelect={() => handleSelect("BASIC")}
          isLoading={isPending}
        />
        <PlanCard
          tier="PREMIUM_B2B"
          cycle={cycle}
          selected={selectedTier === "PREMIUM_B2B"}
          onSelect={() => handleSelect("PREMIUM_B2B")}
          isLoading={isPending}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Payments are processed securely via Paystack. You will be redirected to complete payment.
      </p>
    </div>
  );
}
