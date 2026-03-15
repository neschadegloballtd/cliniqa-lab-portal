"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLabPendingAlerts } from "@/hooks/useResults";

/**
 * Persistent red warning bar shown at the top of every dashboard page
 * whenever there are unacknowledged critical value alerts.
 *
 * Clicking "Review now" links to the results list filtered to show pending
 * critical alerts — each report with a pending alert is visible there.
 */
export default function CriticalAlertsBanner() {
  const { data: alerts } = useLabPendingAlerts();
  const count = alerts?.length ?? 0;

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-red-600 px-4 py-2 text-sm text-white">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1 font-medium">
        {count === 1
          ? "1 critical value alert requires callback documentation before the report can be published."
          : `${count} critical value alerts require callback documentation before reports can be published.`}
      </span>
      <Link
        href="/results?flagStatus=REVIEWED_CRITICAL"
        className="shrink-0 rounded border border-white/40 px-3 py-0.5 text-xs font-semibold hover:bg-white/20 transition-colors"
      >
        Review now
      </Link>
    </div>
  );
}
