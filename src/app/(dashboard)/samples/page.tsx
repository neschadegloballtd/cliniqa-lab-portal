"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, QrCode } from "lucide-react";
import { useSamples } from "@/hooks/useSamples";
import type { SampleStatus } from "@/types/sample";
import {
  SAMPLE_STATUS_LABELS,
  SAMPLE_STATUS_COLORS,
  TAT_STATUS_LABELS,
  TAT_STATUS_COLORS,
} from "@/types/sample";
import { useBranchStore } from "@/store/branch.store";
import { formatDistanceToNow } from "date-fns";

const STATUS_TABS: Array<{ label: string; value: SampleStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Registered", value: "REGISTERED" },
  { label: "Collected", value: "COLLECTED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Received", value: "RECEIVED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Resulted", value: "RESULTED" },
  { label: "Archived", value: "ARCHIVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function SamplesPage() {
  const [activeStatus, setActiveStatus] = useState<SampleStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const activeBranchName = useBranchStore((s) => s.activeBranchName);

  const { data, isLoading } = useSamples({
    status: activeStatus === "ALL" ? undefined : activeStatus,
    page,
    size: 20,
  });

  const samples = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Samples</h1>
          {activeBranchName && (
            <p className="text-sm text-muted-foreground mt-0.5">{activeBranchName}</p>
          )}
        </div>
        <Link
          href="/samples/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Register Sample
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveStatus(tab.value); setPage(0); }}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeStatus === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Barcode</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">TAT</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : samples.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No samples found.
                </td>
              </tr>
            ) : (
              samples.map((sample) => (
                <tr key={sample.id} className={`hover:bg-muted/30 transition-colors ${sample.tatStatus === "BREACHED" ? "bg-red-50" : sample.tatStatus === "AT_RISK" ? "bg-amber-50" : ""}`}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                    >
                      <QrCode className="h-3.5 w-3.5 shrink-0" />
                      {sample.barcode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{sample.testName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {sample.pendingPatientName ?? (sample.patientId ? "Registered patient" : "—")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{sample.sampleType ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${SAMPLE_STATUS_COLORS[sample.status]}`}>
                      {SAMPLE_STATUS_LABELS[sample.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sample.tatStatus ? (
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TAT_STATUS_COLORS[sample.tatStatus]}`}>
                        {TAT_STATUS_LABELS[sample.tatStatus]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(sample.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-border px-3 py-1 disabled:opacity-40 hover:bg-muted"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-border px-3 py-1 disabled:opacity-40 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
