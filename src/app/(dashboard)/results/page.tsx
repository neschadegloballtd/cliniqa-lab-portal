"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useReports } from "@/hooks/useResults";
import type { FlagStatus, ProcessingStatus } from "@/types/results";

function StatusBadge({ status }: { status: ProcessingStatus }) {
  if (status === "PENDING_CLAIM") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        Awaiting patient
      </span>
    );
  }
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Confirmed
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {status}
    </span>
  );
}

function FlagBadge({ status }: { status?: FlagStatus }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<FlagStatus, { label: string; className: string }> = {
    PENDING_REVIEW: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800" },
    REVIEWED_NORMAL: { label: "Normal", className: "bg-green-100 text-green-800" },
    REVIEWED_CRITICAL: { label: "Critical", className: "bg-red-100 text-red-800" },
    OVERRIDDEN: { label: "Overridden", className: "bg-gray-100 text-gray-700" },
    AUTO_PUBLISHED: { label: "Auto Published", className: "bg-blue-100 text-blue-700" },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function ResultsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useReports(page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Lab Results</h1>
        <Link
          href="/results/push"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Push Results
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <div className="p-8 text-center text-sm text-gray-500">Loading reports…</div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-red-600">Failed to load reports.</div>
        )}
        {!isLoading && !isError && (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {["Ref", "Date", "Results", "Status", "Flag Status", "Severity", "Created", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.content.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                      No reports yet. Push your first result.
                    </td>
                  </tr>
                )}
                {data?.content.map((r) => (
                  <tr key={r.reportId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {r.labReportRef ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {r.reportDate ? format(new Date(r.reportDate), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {r.resultCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={r.processingStatus} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <FlagBadge status={r.flagStatus} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {r.severityHint ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                      {format(new Date(r.createdAt), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link
                        href={`/results/${r.reportId}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-600">
                  Page {data.page + 1} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={data.page === 0}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.page >= data.totalPages - 1}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
