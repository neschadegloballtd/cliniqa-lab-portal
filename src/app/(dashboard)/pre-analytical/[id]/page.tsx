"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  usePreAnalyticalError,
  useResolvePreAnalyticalError,
  useNotifyPatient,
} from "@/hooks/usePreAnalytical";
import { REJECTION_REASON_LABELS, type RejectionReason } from "@/types/pre-analytical";

export default function PreAnalyticalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showResolvePanel, setShowResolvePanel] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: error, isLoading, isError } = usePreAnalyticalError(id);
  const { mutateAsync: resolve, isPending: isResolving } = useResolvePreAnalyticalError(id);
  const { mutateAsync: notifyPatient, isPending: isNotifying } = useNotifyPatient(id);

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error("Resolution notes are required");
      return;
    }
    try {
      await resolve({ resolutionNotes });
      toast.success("Error marked as resolved");
      setShowResolvePanel(false);
    } catch {
      toast.error("Failed to resolve error");
    }
  };

  const handleNotify = async () => {
    try {
      await notifyPatient();
      toast.success("Patient notified");
    } catch {
      toast.error("Failed to notify patient");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Loading…</div>;
  if (isError || !error) return <div className="p-8 text-center text-sm text-red-600">Error not found.</div>;

  const hasPatient = error.patientId || error.pendingPatientPhone || error.pendingPatientEmail;
  const notifyChannel = error.patientId ? "push" : error.pendingPatientEmail ? "email" : error.pendingPatientPhone ? "sms" : null;

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
        ← Back to Pre-Analytical
      </button>

      {/* Main card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
              {REJECTION_REASON_LABELS[error.rejectionReason as RejectionReason] ?? error.rejectionReason}
            </span>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              error.resolved
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {error.resolved ? "Resolved" : "Unresolved"}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Test</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{error.testName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Sample Type</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{error.sampleType}</dd>
          </div>
          {hasPatient && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Patient</dt>
              <dd className="mt-0.5 text-sm text-gray-900 space-y-0.5">
                {error.patientId && <span className="block text-gray-500 text-xs">Registered patient</span>}
                {error.pendingPatientPhone && <span className="block">{error.pendingPatientPhone}</span>}
                {error.pendingPatientEmail && <span className="block">{error.pendingPatientEmail}</span>}
              </dd>
            </div>
          )}
          {error.resampleBy && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Resample By</dt>
              <dd className="mt-0.5 text-sm text-gray-900">
                {format(new Date(error.resampleBy), "dd MMM yyyy")}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Logged</dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {format(new Date(error.createdAt), "dd MMM yyyy, HH:mm")}
            </dd>
          </div>
          {error.rejectionNotes && (
            <div className="col-span-full">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Notes</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{error.rejectionNotes}</dd>
            </div>
          )}
        </dl>

        {/* Resolution info */}
        {error.resolved && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-1">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Resolution</p>
            {error.rejectionNotes && (
              <p className="text-sm text-green-900">{error.rejectionNotes}</p>
            )}
            {error.resolvedAt && (
              <p className="text-xs text-green-600">
                Resolved {format(new Date(error.resolvedAt), "dd MMM yyyy, HH:mm")}
              </p>
            )}
          </div>
        )}

        {/* Patient notification info */}
        {error.patientNotified && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs font-medium text-blue-700">
              Patient notified via {notifyChannel === "push" ? "app notification" : notifyChannel === "email" ? "email" : "SMS"}
              {error.notifiedAt
                ? ` on ${format(new Date(error.notifiedAt), "dd MMM yyyy, HH:mm")}`
                : ""}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</h2>

        {/* Resolve */}
        {!error.resolved && (
          <div>
            {!showResolvePanel ? (
              <button
                onClick={() => setShowResolvePanel(true)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Resolve Error
              </button>
            ) : (
              <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">Resolution Notes</p>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this was resolved (e.g. patient recollected, sample re-run)…"
                  className="block w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleResolve}
                    disabled={isResolving}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isResolving ? "Saving…" : "Confirm Resolution"}
                  </button>
                  <button
                    onClick={() => { setShowResolvePanel(false); setResolutionNotes(""); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notify patient */}
        {hasPatient && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleNotify}
              disabled={isNotifying || error.patientNotified}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isNotifying
                ? "Sending…"
                : error.patientNotified
                ? "Patient Notified ✓"
                : "Notify Patient"}
            </button>
            {!error.patientNotified && notifyChannel && (
              <p className="text-xs text-gray-400">
                Sends via{" "}
                {notifyChannel === "push"
                  ? "app push notification"
                  : notifyChannel === "email"
                  ? `email (${error.pendingPatientEmail})`
                  : `SMS (${error.pendingPatientPhone})`}
              </p>
            )}
          </div>
        )}

        {error.resolved && !hasPatient && (
          <p className="text-sm text-gray-400">No further actions available.</p>
        )}
      </div>
    </div>
  );
}
