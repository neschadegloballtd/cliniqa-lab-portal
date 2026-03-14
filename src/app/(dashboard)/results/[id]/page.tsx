"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useReport,
  useOcrStatus,
  useUpdateRow,
  useConfirmPush,
  usePublishReport,
  useOverrideFlag,
} from "@/hooks/useResults";
import type { LabResultRowDto, LabResultRowUpdateRequest } from "@/types/results";

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    MANUAL: "bg-gray-100 text-gray-700",
    LAB_PUSH: "bg-blue-100 text-blue-700",
    LAB_PUSH_PDF: "bg-purple-100 text-purple-700",
    PATIENT_UPLOAD: "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[source] ?? "bg-gray-100 text-gray-700"}`}>
      {source.replace("LAB_PUSH_PDF", "PDF").replace("LAB_PUSH", "Manual API").replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    UPLOADED: "bg-gray-100 text-gray-600",
    PROCESSING: "bg-yellow-100 text-yellow-700",
    EXTRACTED: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-indigo-100 text-indigo-700",
    SAVED: "bg-green-100 text-green-700",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

/** Converts a raw OCR status/value to a readable label.
 *  e.g. HIGH_SENSITIVE → High Sensitive, NORMAL → Normal */
function fmt(value: string | undefined | null): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type TableLayout = "standard" | "microbiology" | "imaging";

function getLayout(reportType?: string): TableLayout {
  if (!reportType) return "standard";
  if (reportType === "MICROBIOLOGY") return "microbiology";
  if (reportType === "ULTRASOUND" || reportType === "RADIOLOGY") return "imaging";
  return "standard";
}

interface RowEditorProps {
  row: LabResultRowDto;
  reportId: string;
  layout: TableLayout;
  canEdit: boolean;
}

function RowEditor({ row, reportId, layout, canEdit }: RowEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LabResultRowUpdateRequest>({
    measuredValue: row.measuredValue,
    unit: row.unit ?? "",
    referenceRangeText: row.referenceRangeText ?? "",
    status: row.status ?? "",
  });
  const { mutateAsync: updateRow, isPending } = useUpdateRow(reportId);

  const baseRowClass = `hover:bg-gray-50 ${row.manuallyCorrected ? "bg-yellow-50" : ""}`;

  const handleSave = async () => {
    try {
      await updateRow({ resultId: row.id, data: draft });
      setEditing(false);
      toast.success("Row updated");
    } catch {
      toast.error("Failed to update row");
    }
  };

  const editActions = (colSpan: number) => (
    <td colSpan={colSpan} className="px-4 py-2 text-right">
      <button
        onClick={handleSave}
        disabled={isPending}
        className="mr-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">
        Cancel
      </button>
    </td>
  );

  const editButton = (
    <td className="px-4 py-3 text-right text-sm">
      {canEdit && (
        <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline text-xs">
          Edit
        </button>
      )}
    </td>
  );

  const correctedBadge = (
    <td className="px-4 py-3">
      {row.manuallyCorrected && <span className="text-xs text-yellow-600">✎ corrected</span>}
    </td>
  );

  // ── Microbiology layout ─────────────────────────────────────────────────
  // Columns: Test / Antibiotic | Category | Result | Sensitivity
  if (layout === "microbiology") {
    if (!editing) {
      return (
        <tr className={baseRowClass}>
          <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top">{row.testName}</td>
          <td className="px-4 py-3 text-sm text-gray-500 align-top">{fmt(row.testCategory)}</td>
          <td className="px-4 py-3 text-sm text-gray-900 align-top break-words whitespace-normal">{row.measuredValue || "—"}</td>
          <td className="px-4 py-3 text-sm align-top">
            {row.status ? (
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                /sensitive/i.test(row.status) ? "bg-green-100 text-green-700" :
                /resistant/i.test(row.status) ? "bg-red-100 text-red-700" :
                /intermediate/i.test(row.status) ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {fmt(row.status)}
              </span>
            ) : "—"}
          </td>
          {correctedBadge}
          {editButton}
        </tr>
      );
    }
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.testName}</td>
        <td className="px-4 py-2 text-sm text-gray-500">{fmt(row.testCategory)}</td>
        <td className="px-4 py-2">
          <input
            value={draft.measuredValue ?? ""}
            onChange={(e) => setDraft({ ...draft, measuredValue: e.target.value })}
            className="w-32 rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={draft.status ?? ""}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            className="rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
          >
            <option value="">—</option>
            <option value="SENSITIVE">Sensitive</option>
            <option value="RESISTANT">Resistant</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEGATIVE">Negative</option>
            <option value="NORMAL">Normal</option>
          </select>
        </td>
        {editActions(2)}
      </tr>
    );
  }

  // ── Imaging layout (Ultrasound / Radiology) ─────────────────────────────
  // Columns: Finding | Description / Impression
  if (layout === "imaging") {
    if (!editing) {
      return (
        <tr className={baseRowClass}>
          <td className="px-4 py-3 text-sm font-medium text-gray-900 w-48">{row.testName}</td>
          <td className="px-4 py-3 text-sm text-gray-700 leading-relaxed">{row.measuredValue || "—"}</td>
          {correctedBadge}
          {editButton}
        </tr>
      );
    }
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.testName}</td>
        <td className="px-4 py-2">
          <textarea
            value={draft.measuredValue ?? ""}
            onChange={(e) => setDraft({ ...draft, measuredValue: e.target.value })}
            rows={2}
            className="w-full rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
          />
        </td>
        {editActions(2)}
      </tr>
    );
  }

  // ── Standard layout (Haematology, Biochemistry, Urinalysis, etc.) ───────
  // Columns: Test Name | Category | Value | Unit | Reference Range | Status
  if (!editing) {
    return (
      <tr className={baseRowClass}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.testName}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{fmt(row.testCategory)}</td>
        <td className="px-4 py-3 text-sm text-gray-900">{row.measuredValue}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{row.unit || "—"}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {row.referenceRangeText ||
            (row.referenceRangeLow != null || row.referenceRangeHigh != null
              ? `${row.referenceRangeLow ?? "?"} – ${row.referenceRangeHigh ?? "?"}`
              : "—")}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{fmt(row.status)}</td>
        {correctedBadge}
        {editButton}
      </tr>
    );
  }
  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.testName}</td>
      <td className="px-4 py-2 text-sm text-gray-500">{fmt(row.testCategory)}</td>
      <td className="px-4 py-2">
        <input
          value={draft.measuredValue ?? ""}
          onChange={(e) => setDraft({ ...draft, measuredValue: e.target.value })}
          className="w-24 rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={draft.unit ?? ""}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          className="w-20 rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={draft.referenceRangeText ?? ""}
          onChange={(e) => setDraft({ ...draft, referenceRangeText: e.target.value })}
          className="w-28 rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
        />
      </td>
      <td className="px-4 py-2">
        <select
          value={draft.status ?? ""}
          onChange={(e) => setDraft({ ...draft, status: e.target.value })}
          className="rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none"
        >
          <option value="">—</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="LOW">Low</option>
          <option value="CRITICAL">Critical</option>
          <option value="ABNORMAL">Abnormal</option>
        </select>
      </td>
      {editActions(2)}
    </tr>
  );
}

interface OverrideDialogProps {
  reportId: string;
  onClose: () => void;
}

function OverrideDialog({ reportId, onClose }: OverrideDialogProps) {
  const [decision, setDecision] = useState("REVIEWED_NORMAL");
  const [notes, setNotes] = useState("");
  const { mutateAsync: overrideFlag, isPending } = useOverrideFlag();

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error("Reviewer notes are required");
      return;
    }
    try {
      await overrideFlag({ reportId, data: { reviewerNotes: notes, decision } });
      toast.success("Flag decision saved");
      onClose();
    } catch {
      toast.error("Failed to save flag decision");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Override AI Flag</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="REVIEWED_NORMAL">Reviewed — Normal</option>
            <option value="REVIEWED_CRITICAL">Reviewed — Critical</option>
            <option value="OVERRIDDEN">Override (dismiss AI flag)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Notes *</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Explain your review decision…"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = use(params);
  const router = useRouter();
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  const { data: report, isLoading, isError } = useReport(reportId);

  // Only poll OCR status for PDF reports in non-terminal states
  const needsOcrPolling =
    !!report &&
    report.source === "LAB_PUSH_PDF" &&
    ["UPLOADED", "PROCESSING"].includes(report.processingStatus);

  const { data: ocrStatus } = useOcrStatus(reportId, needsOcrPolling);

  const { mutateAsync: confirmPush, isPending: isConfirming } = useConfirmPush(reportId);
  const { mutateAsync: publishReport, isPending: isPublishing } = usePublishReport();

  const handleConfirm = async () => {
    try {
      await confirmPush();
      toast.success("Report confirmed — AI flagging in progress");
    } catch {
      toast.error("Failed to confirm report");
    }
  };

  const handlePublish = async () => {
    try {
      await publishReport(reportId);
      toast.success("Report published — patient can now view results");
    } catch {
      toast.error("Failed to publish report");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading report…</div>;
  }
  if (isError || !report) {
    return <div className="p-8 text-center text-sm text-red-600">Report not found.</div>;
  }

  const isPublished = report.flagStatus === "AUTO_PUBLISHED" || !!report.publishedAt;
  const canConfirm = report.source === "LAB_PUSH_PDF" && report.processingStatus === "EXTRACTED";
  const canPublish =
    !isPublished &&
    !!report.flagStatus &&
    ["PENDING_REVIEW", "REVIEWED_NORMAL", "REVIEWED_CRITICAL"].includes(report.flagStatus);
  const canEdit =
    !isPublished &&
    ["EXTRACTED", "CONFIRMED", "PENDING_CLAIM"].includes(report.processingStatus);

  return (
    <div className="space-y-6">
      {showOverrideDialog && (
        <OverrideDialog reportId={reportId} onClose={() => setShowOverrideDialog(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-blue-600 hover:underline"
          >
            ← Back to Results
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Report {report.labReportRef ?? reportId.slice(0, 8)}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <SourceBadge source={report.source} />
            <StatusBadge status={report.processingStatus} />
            {ocrStatus?.ocrConfidence !== undefined && (
              <span className="text-xs text-gray-400">
                OCR confidence: {(ocrStatus.ocrConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {report.reportDate && (
            <p className="mt-1 text-sm text-gray-500">
              Report date: {format(new Date(report.reportDate), "dd MMM yyyy")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canConfirm && (
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isConfirming ? "Confirming…" : "Confirm & Flag"}
            </button>
          )}
          {canPublish && (
            <>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isPublishing ? "Publishing…" : "Publish"}
              </button>
              <button
                onClick={() => setShowOverrideDialog(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Override Flag
              </button>
            </>
          )}
        </div>
      </div>

      {/* OCR polling state */}
      {needsOcrPolling && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <span className="animate-spin text-blue-600">⟳</span>
          <p className="text-sm text-blue-700">
            OCR is running — this page will update automatically when extraction is complete.
          </p>
        </div>
      )}

      {/* AI flag status banner */}
      {!report.flagStatus && ["CONFIRMED", "PENDING_CLAIM"].includes(report.processingStatus) && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
          <span className="text-gray-400">⟳</span>
          <p className="text-sm text-gray-600">AI quality screening is running…</p>
        </div>
      )}
      {report.flagStatus === "PENDING_REVIEW" && (
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="text-amber-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800">AI flagged this result as potentially critical</p>
            <p className="text-xs text-amber-600 mt-0.5">Review the results below, then publish or override the flag.</p>
          </div>
        </div>
      )}
      {isPublished && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <span className="text-green-600">✓</span>
          <p className="text-sm text-green-700">
            This report has been published — the patient can view their results.
          </p>
        </div>
      )}

      {/* Results table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">
            Test Results ({report.results.length})
          </h2>
        </div>

        {report.results.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {["UPLOADED", "PROCESSING"].includes(report.processingStatus)
              ? "Waiting for OCR extraction…"
              : "No results extracted."}
          </div>
        ) : (() => {
            const layout = getLayout(report.reportType);

            // Column headers per layout
            const headers: string[] =
              layout === "microbiology"
                ? ["Test / Antibiotic", "Category", "Result", "Sensitivity", "Notes", ""]
                : layout === "imaging"
                ? ["Finding", "Description / Impression", "Notes", ""]
                : ["Test Name", "Category", "Value", "Unit", "Reference Range", "Status", "Notes", ""];

            // Fixed column widths per layout (colgroup) — prevents long text blowing out neighbours
            const colWidths: string[] =
              layout === "microbiology"
                ? ["w-[22%]", "w-[14%]", "w-[34%]", "w-[16%]", "w-[8%]", "w-[6%]"]
                : layout === "imaging"
                ? ["w-[22%]", "w-[62%]", "w-[10%]", "w-[6%]"]
                : ["w-[22%]", "w-[12%]", "w-[12%]", "w-[8%]", "w-[18%]", "w-[12%]", "w-[10%]", "w-[6%]"];

            return (
              <table className="min-w-full table-fixed divide-y divide-gray-100">
                <colgroup>
                  {colWidths.map((w, i) => <col key={i} className={w} />)}
                </colgroup>
                <thead>
                  <tr className="bg-gray-50">
                    {headers.map((h, i) => (
                      <th
                        key={`${h}-${i}`}
                        className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.results.map((row) => (
                    <RowEditor key={row.id} row={row} reportId={reportId} layout={layout} canEdit={canEdit} />
                  ))}
                </tbody>
              </table>
            );
          })()}
      </div>
    </div>
  );
}
