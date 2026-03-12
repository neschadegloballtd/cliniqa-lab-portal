"use client";

import { formatDistanceToNow } from "date-fns";
import { CalendarDays, FlaskConical, AlertTriangle } from "lucide-react";
import { useDashboardOverview, useRecentActivity } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
          label="Bookings Today"
          value={overview?.totalBookingsToday}
          loading={overviewLoading}
        />
        <StatCard
          icon={<FlaskConical className="h-5 w-5 text-amber-500" />}
          label="Pending AI Flags"
          value={overview?.pendingFlagsCount}
          loading={overviewLoading}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Unresolved Pre-Analytical"
          value={overview?.unresolvedPreAnalyticalCount}
          loading={overviewLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {activityLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : activity && activity.length > 0 ? (
            activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{item.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                </span>
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
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-3xl font-bold">
        {loading ? "—" : (value ?? 0)}
      </p>
    </div>
  );
}
