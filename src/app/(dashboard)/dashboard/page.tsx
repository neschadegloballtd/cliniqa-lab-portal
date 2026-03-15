"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  FlaskConical,
  AlertTriangle,
  BarChart2,
} from "lucide-react";
import { useDashboardOverview, useRecentActivity } from "@/hooks/useDashboard";
import { useBranchStore } from "@/store/branch.store";

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const activeBranchName = useBranchStore((s) => s.activeBranchName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {activeBranchName && (
          <span className="text-sm text-muted-foreground">
            Showing data for{" "}
            <span className="font-medium text-foreground">{activeBranchName}</span>
          </span>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
          label="Bookings (last 30d)"
          value={overview?.bookingsLast30Days}
          loading={overviewLoading}
          href="/bookings"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-indigo-500" />}
          label="Total Bookings"
          value={overview?.totalBookings}
          loading={overviewLoading}
          href="/bookings"
        />
        <StatCard
          icon={<FlaskConical className="h-5 w-5 text-amber-500" />}
          label="Results Pushed"
          value={overview?.totalResultsPushed}
          loading={overviewLoading}
          href="/results"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Unresolved Errors"
          value={overview?.unresolvedErrors}
          loading={overviewLoading}
          href="/pre-analytical"
        />
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <Link href="/qa" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <BarChart2 className="h-3.5 w-3.5" />
            QA Dashboard
          </Link>
        </div>
        <div className="divide-y divide-border">
          {activityLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : activity && activity.items.length > 0 ? (
            activity.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm">{item.title}</span>
                  {item.subtitle && (
                    <span className="ml-2 text-xs text-muted-foreground">{item.subtitle}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.type === "PRE_ANALYTICAL_ERROR" ? "Pre-analytical" : "Booking"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No recent activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  loading: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border p-4 space-y-2 block hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-3xl font-bold">
        {loading ? "—" : (value ?? 0)}
      </p>
    </Link>
  );
}
