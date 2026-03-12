"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { usePreAnalyticalErrors } from "@/hooks/usePreAnalytical";
import {
  REJECTION_REASON_LABELS,
  type PreAnalyticalFilter,
  type RejectionReason,
} from "@/types/pre-analytical";

const FILTERS: PreAnalyticalFilter[] = ["ALL", "UNRESOLVED", "RESOLVED"];

export default function PreAnalyticalPage() {
  const [filter, setFilter] = useState<PreAnalyticalFilter>("UNRESOLVED");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = usePreAnalyticalErrors({ filter, page });

  const handleFilterChange = (f: PreAnalyticalFilter) => {
    setFilter(f);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Pre-Analytical Errors</h1>
        <Link
          href="/pre-analytical/log"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Log Error
        </Link>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-1 w-fit rounded-xl bg-gray-100 p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-red-600">Failed to load errors.</div>
        )}
        {!isLoading && !isError && (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {["Rejection Reason", "Test", "Sample Type", "Resample By", "Status", "Logged", ""].map((h) => (
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
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      No pre-analytical errors found.
                    </td>
                  </tr>
                )}
                {data?.content.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                        {REJECTION_REASON_LABELS[e.rejectionReason as RejectionReason] ?? e.rejectionReason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{e.testName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{e.sampleType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {e.resampleBy
                        ? format(new Date(e.resampleBy), "dd MMM yyyy")
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {e.resolved ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Unresolved
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                      {format(new Date(e.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link
                        href={`/pre-analytical/${e.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-600">
                  Page {data.number + 1} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={data.first}
                    className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.last}
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
