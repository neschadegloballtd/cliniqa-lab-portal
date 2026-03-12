"use client";

import Link from "next/link";
import { differenceInDays } from "date-fns";
import { useLabAuthStore } from "@/store/lab-auth.store";

export default function TierBanner() {
  const { inTrial, trialEndDate, tier } = useLabAuthStore((s) => ({
    inTrial: s.inTrial,
    trialEndDate: s.trialEndDate,
    tier: s.tier,
  }));

  if (!inTrial || !trialEndDate) return null;

  const daysLeft = differenceInDays(new Date(trialEndDate), new Date());

  if (daysLeft < 0) return null;

  return (
    <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800">
      <span>
        <span className="font-semibold">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</span> left in your trial
        {tier === "FREE" && " — upgrade to unlock all features"}
      </span>
      <Link
        href="/subscription/upgrade"
        className="ml-4 rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
      >
        Upgrade
      </Link>
    </div>
  );
}
