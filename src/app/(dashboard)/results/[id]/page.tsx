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
  useAuthorizeResult,
  useRevokeAuthorization,
  useAuthorizationLog,
  useCriticalAlerts,
  useAcknowledgeAlert,
  useRescanAlerts,
  useQcTodayStatus,
} from "@/hooks/useResults";
import { useLabAuthStore } from "@/store/lab-auth.store";
import type { AcknowledgeCriticalAlertRequest, AiOutlier, AuthorizationLogEntry, CriticalValueAlert, LabResultRowDto, LabResultRowUpdateRequest } from "@/types/results";

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

/**
 * Hover tooltip — wraps any trigger element and shows a dark popup on hover.
 * Popup opens below the trigger by default; pass side="above" to flip it.
 */
function InfoTooltip({
  trigger,
  children,
  side = "below",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: "above" | "below";
}) {
  return (
    <div className="relative group inline-flex items-center">
      {trigger}
      <div
        className={`absolute z-50 w-80 rounded-xl bg-gray-900 text-white text-xs shadow-2xl p-4
          opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150
          pointer-events-none
          ${side === "above" ? "bottom-full mb-2 left-0" : "top-full mt-2 left-0"}`}
      >
        {/* Arrow */}
        <div
          className={`absolute w-2.5 h-2.5 bg-gray-900 rotate-45 left-4
            ${side === "above" ? "top-full -translate-y-1.5" : "bottom-full translate-y-1.5"}`}
        />
        {children}
      </div>
    </div>
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
  outlierMap: Map<string, AiOutlier>;
}

function RowEditor({ row, reportId, layout, canEdit, outlierMap }: RowEditorProps) {
  const outlier = outlierMap.get(row.testName.trim().toLowerCase());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LabResultRowUpdateRequest>({
    measuredValue: row.measuredValue,
    unit: row.unit ?? "",
    referenceRangeText: row.referenceRangeText ?? "",
    status: row.status ?? "",
  });
  const { mutateAsync: updateRow, isPending } = useUpdateRow(reportId);

  const outlierBg = outlier
    ? outlier.deviation === "SEVERE"
      ? "bg-red-50"
      : outlier.deviation === "MODERATE"
      ? "bg-orange-50"
      : "bg-yellow-50"
    : "";
  const baseRowClass = `hover:bg-opacity-80 ${row.manuallyCorrected ? "bg-yellow-50" : outlierBg}`;

  const handleSave = async () => {
    try {
      await updateRow({ resultId: row.id, data: draft });
      setEditing(false);
      toast.success("Row updated");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to update row");
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
    <td className="px-4 py-3 align-top">
      {row.manuallyCorrected && <span className="text-xs text-yellow-600 block">✎ corrected</span>}
      {outlier && (
        <InfoTooltip
          side="above"
          trigger={
            <span className={`text-xs cursor-help underline decoration-dotted ${
              outlier.deviation === "SEVERE"   ? "text-red-600" :
              outlier.deviation === "MODERATE" ? "text-orange-600" :
                                                 "text-yellow-700"
            }`}>
              ⚠ {outlier.deviation.charAt(0) + outlier.deviation.slice(1).toLowerCase()} deviation
            </span>
          }
        >
          <p className="font-semibold text-white mb-1">{row.testName}</p>
          <p className="text-gray-300 leading-relaxed">{outlier.note}</p>
          <p className="text-gray-500 mt-2 text-xs">
            Deviation: <span className={`font-medium ${
              outlier.deviation === "SEVERE"   ? "text-red-400" :
              outlier.deviation === "MODERATE" ? "text-orange-400" :
                                                 "text-yellow-400"
            }`}>{outlier.deviation}</span>
          </p>
        </InfoTooltip>
      )}
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to save flag decision");
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

interface AuthorizeDialogProps {
  reportId: string;
  mode: "authorize" | "revoke";
  onClose: () => void;
}

function AuthorizeDialog({ reportId, mode, onClose }: AuthorizeDialogProps) {
  const [notes, setNotes] = useState("");
  const { mutateAsync: authorizeResult, isPending: isAuthorizing } = useAuthorizeResult(reportId);
  const { mutateAsync: revokeAuthorization, isPending: isRevoking } = useRevokeAuthorization(reportId);
  const isPending = isAuthorizing || isRevoking;

  const handleSubmit = async () => {
    try {
      if (mode === "authorize") {
        await authorizeResult(notes.trim() || undefined);
        toast.success("Result authorized successfully");
      } else {
        await revokeAuthorization(notes.trim() || undefined);
        toast.success("Authorization revoked");
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? (mode === "authorize" ? "Failed to authorize result" : "Failed to revoke authorization"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          {mode === "authorize" ? "Authorize Result" : "Revoke Authorization"}
        </h3>
        <p className="text-sm text-gray-600">
          {mode === "authorize"
            ? "Authorizing confirms this result has been clinically reviewed and signed off. This action is logged."
            : "Revoking authorization resets the result to preliminary status. This action is logged."}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={mode === "authorize" ? "e.g. Reviewed and verified by Dr. Smith" : "e.g. Value corrected — re-authorization required"}
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
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              mode === "authorize"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isPending
              ? mode === "authorize" ? "Authorizing…" : "Revoking…"
              : mode === "authorize" ? "Authorize" : "Revoke Authorization"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthorizationLogPanel({ reportId }: { reportId: string }) {
  const { data: log, isLoading } = useAuthorizationLog(reportId);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-400">Loading audit trail…</div>;
  }
  if (!log || log.length === 0) {
    return <div className="p-4 text-sm text-gray-400">No authorization events yet.</div>;
  }

  const actionLabel: Record<string, { label: string; color: string }> = {
    SUBMITTED: { label: "Submitted", color: "text-blue-600" },
    AUTHORIZED: { label: "Authorized", color: "text-emerald-600" },
    REVOKED: { label: "Revoked", color: "text-red-600" },
  };

  return (
    <ol className="relative border-l border-gray-200 space-y-4 pl-6 py-2">
      {log.map((entry: AuthorizationLogEntry) => {
        const meta = actionLabel[entry.action] ?? { label: entry.action, color: "text-gray-700" };
        return (
          <li key={entry.id} className="relative">
            <div className="absolute -left-[1.45rem] top-1 w-3 h-3 rounded-full bg-white border-2 border-gray-300" />
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
              <span className="text-xs text-gray-400">
                {format(new Date(entry.occurredAt), "dd MMM yyyy, HH:mm")}
              </span>
            </div>
            {entry.performedByStaffId && (
              <p className="text-xs text-gray-500 mt-0.5">Staff ID: {entry.performedByStaffId}</p>
            )}
            {entry.notes && (
              <p className="text-xs text-gray-600 mt-0.5 italic">&ldquo;{entry.notes}&rdquo;</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface AcknowledgeAlertDialogProps {
  reportId: string;
  alert: CriticalValueAlert;
  onClose: () => void;
}

function AcknowledgeAlertDialog({ reportId, alert, onClose }: AcknowledgeAlertDialogProps) {
  const [notes, setNotes] = useState("");
  const { mutateAsync: acknowledgeAlert, isPending } = useAcknowledgeAlert(reportId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error("Callback notes are required — document who was notified and the outcome.");
      return;
    }
    try {
      await acknowledgeAlert({
        alertId: alert.id,
        data: { callbackNotes: notes.trim() } as AcknowledgeCriticalAlertRequest,
      });
      toast.success(`Critical alert for "${alert.testName}" acknowledged`);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to acknowledge alert");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Acknowledge Critical Alert</h3>
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-red-800">{alert.testName}</p>
          <p className="text-sm text-red-700">
            Value: <span className="font-medium">{alert.measuredValue}</span>
            &nbsp;·&nbsp;Threshold: <span className="font-medium">{alert.threshold}</span>
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Record that the clinical team has been notified of this critical value. Log who was called and the outcome.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Callback Notes <span className="text-red-500">*</span>
            <span className="ml-1 text-xs text-gray-400 font-normal">Required for ISO 15189 / MLSCN compliance</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            required
            placeholder="e.g. Dr. Adaeze called at 14:32 — patient admitted for IV glucose. Callback received by nurse on duty."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !notes.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Acknowledging…" : "Acknowledge"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CriticalAlertsPanel({ reportId }: { reportId: string }) {
  const { data: alerts, isLoading } = useCriticalAlerts(reportId);
  const { mutateAsync: rescan, isPending: isRescanning } = useRescanAlerts(reportId);
  const [selectedAlert, setSelectedAlert] = useState<CriticalValueAlert | null>(null);

  if (isLoading) return null;
  if (!alerts || alerts.length === 0) return null;

  const pendingCount = alerts.filter((a) => a.status === "PENDING_CALLBACK").length;

  const handleRescan = async () => {
    try {
      await rescan();
      toast.success("Critical value detection re-run. Alerts refreshed.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Re-scan failed.");
    }
  };

  return (
    <>
      {selectedAlert && (
        <AcknowledgeAlertDialog
          reportId={reportId}
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
      <div className="rounded-xl border border-red-300 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-red-200 bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-base">🚨</span>
            <h2 className="text-sm font-semibold text-red-800">
              Critical Value Alerts ({alerts.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {pendingCount} unacknowledged
              </span>
            )}
            {pendingCount === 0 && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                All acknowledged
              </span>
            )}
            <button
              onClick={handleRescan}
              disabled={isRescanning}
              title="Re-scan result rows for critical values — use after correcting values"
              className="text-xs text-gray-500 hover:text-gray-700 underline decoration-dotted disabled:opacity-50"
            >
              {isRescanning ? "Re-scanning…" : "Re-scan values"}
            </button>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <p className="text-xs text-red-700">
              All critical value alerts must be acknowledged before this report can be published.
              Log your callback for each alert below.
            </p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {alerts.map((alert) => (
            <div key={alert.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{alert.testName}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    alert.status === "PENDING_CALLBACK"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {alert.status === "PENDING_CALLBACK" ? "Pending Callback" : "Acknowledged"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Value: <span className="font-medium text-red-700">{alert.measuredValue}</span>
                  &nbsp;·&nbsp;Threshold: <span className="font-medium">{alert.threshold}</span>
                </p>
                {alert.acknowledgedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Acknowledged {format(new Date(alert.acknowledgedAt), "dd MMM yyyy, HH:mm")}
                    {alert.callbackNotes && <span className="italic"> — &ldquo;{alert.callbackNotes}&rdquo;</span>}
                  </p>
                )}
              </div>
              {alert.status === "PENDING_CALLBACK" && (
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = use(params);
  const router = useRouter();
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [authDialog, setAuthDialog] = useState<"authorize" | "revoke" | null>(null);

  const staffRole = useLabAuthStore((s) => s.staffRole);
  // Lab owner (staffRole === null) + MANAGER/ADMIN/OWNER can authorize
  const canAuthorize = staffRole === null || ["OWNER", "ADMIN", "MANAGER"].includes(staffRole);
  // Only ADMIN/OWNER (and lab owner) can revoke
  const canRevoke = staffRole === null || ["OWNER", "ADMIN"].includes(staffRole);

  const { data: report, isLoading, isError } = useReport(reportId);

  // Only poll OCR status for PDF reports in non-terminal states
  const needsOcrPolling =
    !!report &&
    report.source === "LAB_PUSH_PDF" &&
    ["UPLOADED", "PROCESSING"].includes(report.processingStatus);

  const { data: ocrStatus } = useOcrStatus(reportId, needsOcrPolling);

  const { mutateAsync: confirmPush, isPending: isConfirming } = useConfirmPush(reportId);
  const { mutateAsync: publishReport, isPending: isPublishing } = usePublishReport();
  const { data: qcStatus } = useQcTodayStatus(report?.instrumentName ?? undefined);

  const handleConfirm = async () => {
    try {
      await confirmPush();
      toast.success("Report confirmed — AI flagging in progress");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to confirm report");
    }
  };

  const handlePublish = async () => {
    try {
      await publishReport(reportId);
      toast.success("Report published — patient can now view results");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to publish report");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading report…</div>;
  }
  if (isError || !report) {
    return <div className="p-8 text-center text-sm text-red-600">Report not found.</div>;
  }

  const isPublished = report.flagStatus === "AUTO_PUBLISHED" || !!report.publishedAt;
  const isAuthorized = report.authorizationStatus === "AUTHORIZED";

  // Build a lowercase testName → outlier lookup for O(1) row highlighting
  const outlierMap = new Map<string, AiOutlier>(
    (report.outliers ?? []).map((o) => [o.testName.trim().toLowerCase(), o])
  );
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
      {authDialog && (
        <AuthorizeDialog
          reportId={reportId}
          mode={authDialog}
          onClose={() => setAuthDialog(null)}
        />
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
            {/* Authorization status badge */}
            {isAuthorized ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                ✓ Authorized
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Preliminary
              </span>
            )}
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
          {isAuthorized && report.authorizedAt && (
            <p className="mt-0.5 text-xs text-gray-400">
              Authorized {format(new Date(report.authorizedAt), "dd MMM yyyy, HH:mm")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
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
              {qcStatus?.isBlocked && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 text-xs font-medium text-red-700">
                  ⚠️ QC blocked — {qcStatus.unresolvedRejectCount} unresolved Westgard REJECT violation{qcStatus.unresolvedRejectCount !== 1 ? "s" : ""} today
                </span>
              )}
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
          {/* Authorization actions */}
          {!isAuthorized && canAuthorize && (
            <button
              onClick={() => setAuthDialog("authorize")}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Authorize
            </button>
          )}
          {isAuthorized && canRevoke && (
            <button
              onClick={() => setAuthDialog("revoke")}
              className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Revoke Authorization
            </button>
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
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-amber-800">
                AI flagged this result as potentially {report.severityHint?.toLowerCase() ?? "critical"}
              </p>
              <InfoTooltip
                side="below"
                trigger={
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-amber-500 text-amber-600 text-xs font-bold cursor-help leading-none">
                    ?
                  </span>
                }
              >
                <p className="font-semibold text-white mb-2">Why was this flagged?</p>
                <p className="text-gray-300 leading-relaxed mb-3">
                  {report.llmSummary ?? "The AI detected values that may require clinical attention before publishing to the patient."}
                </p>

                {(report.outliers?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <p className="font-semibold text-yellow-400 mb-1.5">
                      {report.outliers!.length} out-of-range result{report.outliers!.length > 1 ? "s" : ""}:
                    </p>
                    <ul className="space-y-1.5">
                      {report.outliers!.map((o, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className={`shrink-0 mt-0.5 ${
                            o.deviation === "SEVERE"   ? "text-red-400" :
                            o.deviation === "MODERATE" ? "text-orange-400" :
                                                         "text-yellow-400"
                          }`}>●</span>
                          <span className="leading-snug">
                            <span className="font-medium text-white">{o.testName}</span>
                            {" — "}{o.note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(report.dataQualityWarnings?.length ?? 0) > 0 && (
                  <p className="text-gray-400 border-t border-gray-700 pt-2 mt-1">
                    ⚠ {report.dataQualityWarnings!.length} data quality issue{report.dataQualityWarnings!.length > 1 ? "s" : ""} also detected — see below the table.
                  </p>
                )}

                <p className="text-gray-500 border-t border-gray-700 pt-2 mt-2 text-xs">
                  Severity: <span className="text-white font-medium">{report.severityHint ?? "—"}</span>
                  &nbsp;·&nbsp;Review the highlighted rows below, then Publish or Override.
                </p>
              </InfoTooltip>
            </div>
            <p className="text-xs text-amber-600 mt-0.5">
              Review the highlighted rows below, then publish or override the flag.
            </p>
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

      {/* AI summary card */}
      {report.llmSummary && report.severityHint && (
        <div className={`rounded-xl border px-5 py-4 space-y-1 ${
          report.severityHint === "CRITICAL" ? "bg-red-50 border-red-200" :
          report.severityHint === "MODERATE" ? "bg-orange-50 border-orange-200" :
          report.severityHint === "MILD"     ? "bg-yellow-50 border-yellow-200" :
                                               "bg-green-50 border-green-200"
        }`}>
          <div className="flex items-center gap-2">
            <InfoTooltip
              side="below"
              trigger={
                <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full cursor-help ${
                  report.severityHint === "CRITICAL" ? "bg-red-100 text-red-700" :
                  report.severityHint === "MODERATE" ? "bg-orange-100 text-orange-700" :
                  report.severityHint === "MILD"     ? "bg-yellow-100 text-yellow-700" :
                                                       "bg-green-100 text-green-700"
                }`}>
                  AI · {report.severityHint}
                </span>
              }
            >
              <p className="font-semibold text-white mb-2">Severity levels explained</p>
              <ul className="space-y-1.5 text-gray-300">
                <li><span className="text-green-400 font-medium">NORMAL</span> — all values within reference range; no action required.</li>
                <li><span className="text-yellow-400 font-medium">MILD</span> — minor deviations; watch-and-wait, no urgent action.</li>
                <li><span className="text-orange-400 font-medium">MODERATE</span> — significant deviations; follow-up recommended.</li>
                <li><span className="text-red-400 font-medium">CRITICAL</span> — potentially life-threatening values; urgent clinical review required before publishing.</li>
              </ul>
            </InfoTooltip>
            <span className="text-xs text-gray-500">AI quality screening summary</span>
          </div>
          <p className={`text-sm ${
            report.severityHint === "CRITICAL" ? "text-red-800" :
            report.severityHint === "MODERATE" ? "text-orange-800" :
            report.severityHint === "MILD"     ? "text-yellow-800" :
                                                 "text-green-800"
          }`}>
            {report.llmSummary}
          </p>
        </div>
      )}

      {/* Data quality warnings */}
      {(report.dataQualityWarnings?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-gray-300 bg-gray-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Data Quality Issues ({report.dataQualityWarnings!.length})
          </p>
          <ul className="space-y-1">
            {report.dataQualityWarnings!.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-400 shrink-0">•</span>
                <span><span className="font-medium">{w.testName}:</span> {w.issue}</span>
              </li>
            ))}
          </ul>
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
                    <RowEditor key={row.id} row={row} reportId={reportId} layout={layout} canEdit={canEdit} outlierMap={outlierMap} />
                  ))}
                </tbody>
              </table>
            );
          })()}
      </div>

      {/* Critical value alerts */}
      <CriticalAlertsPanel reportId={reportId} />

      {/* Authorization audit trail */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Authorization Audit Trail</h2>
          {isAuthorized && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Authorized
            </span>
          )}
        </div>
        <div className="px-5 py-4">
          <AuthorizationLogPanel reportId={reportId} />
        </div>
      </div>
    </div>
  );
}
