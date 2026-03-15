"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { useSample, useTransitionSampleStatus } from "@/hooks/useSamples";
import type { SampleStatus } from "@/types/sample";
import {
  SAMPLE_STATUS_LABELS,
  SAMPLE_STATUS_COLORS,
  ALLOWED_NEXT_STATUSES,
} from "@/types/sample";

const LIFECYCLE: SampleStatus[] = [
  "REGISTERED",
  "COLLECTED",
  "IN_TRANSIT",
  "RECEIVED",
  "PROCESSING",
  "RESULTED",
  "ARCHIVED",
];

export default function SampleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: sample, isLoading } = useSample(id);
  const transition = useTransitionSampleStatus(id);

  const [transitionNotes, setTransitionNotes] = useState("");
  const [confirmStatus, setConfirmStatus] = useState<SampleStatus | null>(null);

  if (isLoading) {
    return <div className="py-16 text-center text-muted-foreground">Loading…</div>;
  }
  if (!sample) {
    return <div className="py-16 text-center text-muted-foreground">Sample not found.</div>;
  }

  const nextStatuses = ALLOWED_NEXT_STATUSES[sample.status] ?? [];
  const isTerminal = nextStatuses.length === 0;

  function handleTransition(status: SampleStatus) {
    transition.mutate(
      { status, notes: transitionNotes || undefined },
      {
        onSuccess: () => {
          setConfirmStatus(null);
          setTransitionNotes("");
        },
      }
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/samples"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Samples
      </Link>

      {/* Header card */}
      <div className="rounded-lg border border-border p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono text-lg font-bold tracking-wide">{sample.barcode}</span>
            </div>
            <p className="mt-1 text-xl font-semibold">{sample.testName ?? "Sample"}</p>
          </div>
          <span
            className={`rounded px-2.5 py-1 text-sm font-medium ${SAMPLE_STATUS_COLORS[sample.status]}`}
          >
            {SAMPLE_STATUS_LABELS[sample.status]}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Detail label="Sample Type" value={sample.sampleType} />
          <Detail label="Patient" value={sample.pendingPatientName ?? (sample.patientId ? "Registered patient" : undefined)} />
          <Detail label="Phone" value={sample.pendingPatientPhone} />
          <Detail label="Linked Booking" value={sample.bookingId ? (
            <Link href={`/bookings/${sample.bookingId}`} className="text-primary hover:underline">
              View booking
            </Link>
          ) : undefined} />
          <Detail label="Registered" value={format(new Date(sample.createdAt), "dd MMM yyyy, HH:mm")} />
          <Detail label="Last updated" value={format(new Date(sample.updatedAt), "dd MMM yyyy, HH:mm")} />
          {sample.notes && <Detail label="Notes" value={sample.notes} className="col-span-2" />}
        </div>
      </div>

      {/* Status lifecycle bar */}
      <div className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold mb-4">Lifecycle</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {LIFECYCLE.map((s, i) => {
            const statusOrder = LIFECYCLE.indexOf(sample.status);
            const isDone = i < statusOrder;
            const isCurrent = s === sample.status;
            return (
              <div key={s} className="flex items-center gap-1">
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                  isCurrent
                    ? SAMPLE_STATUS_COLORS[s]
                    : isDone
                    ? "text-green-700 bg-green-50"
                    : "text-muted-foreground bg-muted/50"
                }`}>
                  {isDone
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : <Circle className="h-3.5 w-3.5" />
                  }
                  {SAMPLE_STATUS_LABELS[s]}
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
          {sample.status === "REJECTED" && (
            <span className={`text-xs font-medium px-2 py-1 rounded ${SAMPLE_STATUS_COLORS.REJECTED}`}>
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Transition actions */}
      {!isTerminal && (
        <div className="rounded-lg border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold">Advance Status</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => setConfirmStatus(s)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 ${SAMPLE_STATUS_COLORS[s]}`}
              >
                Mark as {SAMPLE_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {confirmStatus && (
            <div className="mt-3 rounded-md border border-border p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">
                Transition to{" "}
                <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${SAMPLE_STATUS_COLORS[confirmStatus]}`}>
                  {SAMPLE_STATUS_LABELS[confirmStatus]}
                </span>
              </p>
              <textarea
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Optional notes…"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleTransition(confirmStatus)}
                  disabled={transition.isPending}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {transition.isPending ? "Saving…" : "Confirm"}
                </button>
                <button
                  onClick={() => { setConfirmStatus(null); setTransitionNotes(""); }}
                  className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
              {transition.isError && (
                <p className="text-xs text-destructive">
                  {(transition.error as Error)?.message ?? "Something went wrong."}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Event timeline */}
      <div className="rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold mb-4">Event History</h2>
        {sample.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-6">
            {sample.events.map((event) => (
              <li key={event.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${SAMPLE_STATUS_COLORS[event.status]}`}
                  >
                    {SAMPLE_STATUS_LABELS[event.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.occurredAt), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
                {event.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | React.ReactNode;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
