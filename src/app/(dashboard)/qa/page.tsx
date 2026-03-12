"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useLabAuthStore } from "@/store/lab-auth.store";
import {
  useQaOverview,
  useQaTurnaround,
  useQaRejectionRates,
  useQaVolumes,
} from "@/hooks/useQa";

// ── Tier gate ─────────────────────────────────────────────────────────────────

function UpgradeGate() {
  return (
    <div className="relative">
      {/* Blurred preview skeleton */}
      <div className="pointer-events-none select-none filter blur-sm opacity-40 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-24" />
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 h-64" />
          <div className="rounded-xl border border-gray-200 bg-white p-6 h-64" />
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-lg text-center max-w-sm mx-auto">
          <div className="mb-2 text-3xl">📊</div>
          <h2 className="text-lg font-semibold text-amber-900 mb-1">QA Dashboard</h2>
          <p className="text-sm text-amber-700 mb-4">
            Turnaround times, rejection rates, and volume trends are available on the{" "}
            <span className="font-semibold">BASIC</span> plan and above.
          </p>
          <Link
            href="/subscription/upgrade"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Upgrade to BASIC →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "default" | "green" | "red" | "amber";
}

function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  const accentClass = {
    default: "text-gray-900",
    green: "text-green-700",
    red: "text-red-600",
    amber: "text-amber-600",
  }[accent];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Section skeleton ──────────────────────────────────────────────────────────

function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-gray-200 bg-white p-6 ${className}`}>
      <div className="h-4 w-40 rounded bg-gray-200 mb-4" />
      <div className="h-48 rounded bg-gray-100" />
    </div>
  );
}

// ── Overview section ─────────────────────────────────────────────────────────

function OverviewSection() {
  const { data, isLoading, isError } = useQaOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-24" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600 bg-red-50 rounded-lg p-4">
        Failed to load overview stats.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Reports Published" value={data.totalReportsPublished} accent="green" />
      <StatCard label="Reports Pending" value={data.totalReportsPending} accent="amber" />
      <StatCard label="Bookings" value={data.totalBookings} />
      <StatCard
        label="Avg Turnaround"
        value={`${data.avgTurnaroundHours.toFixed(1)}h`}
        accent={data.avgTurnaroundHours > 48 ? "red" : "green"}
        sub="Last 30 days"
      />
      <StatCard label="Flagged Results" value={data.flaggedResultsCount} accent={data.flaggedResultsCount > 0 ? "amber" : "default"} />
      <StatCard
        label="Rejection Rate"
        value={`${data.rejectionRatePercent.toFixed(1)}%`}
        accent={data.rejectionRatePercent > 10 ? "red" : "default"}
        sub="Pre-analytical"
      />
    </div>
  );
}

// ── Turnaround bar chart ──────────────────────────────────────────────────────

function TurnaroundSection() {
  const { data, isLoading, isError } = useQaTurnaround();

  if (isLoading) return <ChartSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">Failed to load turnaround data.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "dd MMM"),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Turnaround Time — Last 30 Days
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            unit="h"
          />
          <Tooltip
            formatter={(val: number) => [`${val.toFixed(1)}h`, "Avg Turnaround"]}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="avgHours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Hours" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Rejection rates horizontal bar ───────────────────────────────────────────

function RejectionRatesSection() {
  const { data, isLoading, isError } = useQaRejectionRates();

  if (isLoading) return <ChartSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">Failed to load rejection rate data.</p>
      </div>
    );
  }

  // Sort descending by count for readability
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Rejection Rates by Reason
      </h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400">No rejections recorded.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 40)}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="reason"
              type="category"
              width={160}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: string) =>
                val
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              }
            />
            <Tooltip
              formatter={(val: number, _name, props) => [
                `${val} (${props.payload?.percent?.toFixed(1) ?? 0}%)`,
                "Count",
              ]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Volumes dual-line chart ───────────────────────────────────────────────────

function VolumesSection() {
  const { data, isLoading, isError } = useQaVolumes();

  if (isLoading) return <ChartSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">Failed to load volume data.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "dd MMM"),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Volumes — Last 30 Days
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            labelStyle={{ fontSize: 12 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (value === "bookings" ? "Bookings" : "Reports Published")}
          />
          <Line
            type="monotone"
            dataKey="bookings"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="reports"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QaDashboardPage() {
  const tier = useLabAuthStore((s) => s.tier);
  const isFree = tier === "FREE";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">QA Dashboard</h1>
        {!isFree && (
          <p className="text-xs text-gray-400">Data reflects the last 30 days</p>
        )}
      </div>

      {isFree ? (
        <UpgradeGate />
      ) : (
        <>
          <OverviewSection />

          <TurnaroundSection />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RejectionRatesSection />
            <VolumesSection />
          </div>
        </>
      )}
    </div>
  );
}
