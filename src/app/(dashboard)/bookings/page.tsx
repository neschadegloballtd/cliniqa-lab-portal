"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useBookings } from "@/hooks/useBookings";
import type { BookingStatus } from "@/types/bookings";

type StatusFilter = BookingStatus | "ALL";

const STATUS_TABS: StatusFilter[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SAMPLE_COLLECTED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SAMPLE_COLLECTED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function BookingsPage() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useBookings({
    status: activeStatus,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
  });

  const handleStatusChange = (s: StatusFilter) => {
    setActiveStatus(s);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Booking
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStatus === s
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Date range:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <div className="p-8 text-center text-sm text-gray-500">Loading bookings…</div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-red-600">Failed to load bookings.</div>
        )}
        {!isLoading && !isError && (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {["Patient", "Test", "Appointment", "Status", "Created", ""].map((h) => (
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
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No bookings found.
                    </td>
                  </tr>
                )}
                {data?.content.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {b.patientPhone ?? b.patientEmail ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="font-medium">{b.testName}</span>
                      {b.testCategory && (
                        <span className="ml-1 text-xs text-gray-400">({b.testCategory})</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {b.appointmentAt
                        ? format(new Date(b.appointmentAt), "dd MMM yyyy, HH:mm")
                        : <span className="text-gray-400">Walk-in</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">
                      {format(new Date(b.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link href={`/bookings/${b.id}`} className="text-blue-600 hover:underline">
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
