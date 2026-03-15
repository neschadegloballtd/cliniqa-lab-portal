"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useReports } from "@/hooks/useResults";
import type { AuthorizationStatus, FlagStatus, ProcessingStatus } from "@/types/results";

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

function AuthBadge({ status }: { status: AuthorizationStatus }) {
  if (status === "AUTHORIZED") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Authorized
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      Preliminary
    </span>
  );
}

export default function ResultsPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");          // debounced
  const [flagStatus, setFlagStatus] = useState("");
  const [processingStatus, setProcessingStatus] = useState("");
  const [authorizationStatus, setAuthorizationStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounce: only fire the query 400 ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when any filter changes
  const handleFlagStatus   = (v: string) => { setFlagStatus(v);          setPage(0); };
  const handleProcStatus   = (v: string) => { setProcessingStatus(v);    setPage(0); };
  const handleAuthStatus   = (v: string) => { setAuthorizationStatus(v); setPage(0); };
  const handleDateFrom     = (v: string) => { setDateFrom(v);            setPage(0); };
  const handleDateTo       = (v: string) => { setDateTo(v);              setPage(0); };

  const { data, isLoading, isError } = useReports(
    page,
    20,
    search || undefined,
    flagStatus || undefined,
    processingStatus || undefined,
    authorizationStatus || undefined,
    dateFrom || undefined,
    dateTo || undefined,
  );

  const hasFilters = !!search || !!flagStatus || !!processingStatus || !!authorizationStatus || !!dateFrom || !!dateTo;

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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search by phone or email */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by phone or email…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setSearch(""); setPage(0); }}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Authorization status filter */}
        <select
          value={authorizationStatus}
          onChange={(e) => handleAuthStatus(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All auth statuses</option>
          <option value="PRELIMINARY">Preliminary</option>
          <option value="AUTHORIZED">Authorized</option>
        </select>

        {/* Flag status filter */}
        <select
          value={flagStatus}
          onChange={(e) => handleFlagStatus(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All flag statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="REVIEWED_NORMAL">Reviewed — Normal</option>
          <option value="REVIEWED_CRITICAL">Reviewed — Critical</option>
          <option value="AUTO_PUBLISHED">Auto Published</option>
          <option value="OVERRIDDEN">Overridden</option>
        </select>

        {/* Processing status filter */}
        <select
          value={processingStatus}
          onChange={(e) => handleProcStatus(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="EXTRACTED">Extracted (PDF)</option>
          <option value="PENDING_CLAIM">Awaiting Patient</option>
          <option value="FAILED">Failed</option>
        </select>

        {/* Date range filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => handleDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => handleDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearchInput(""); setSearch(""); setFlagStatus(""); setProcessingStatus(""); setAuthorizationStatus(""); setDateFrom(""); setDateTo(""); setPage(0); }}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
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
                  {["Ref", "Date", "Results", "Status", "Flag Status", "Authorization", "Severity", "Created", ""].map((h) => (
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
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
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
                    <td className="whitespace-nowrap px-4 py-3">
                      <AuthBadge status={r.authorizationStatus} />
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
