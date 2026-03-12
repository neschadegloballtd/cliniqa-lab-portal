"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useBooking,
  useConfirmBooking,
  useMarkSampleCollected,
  useCompleteBooking,
  useCancelBooking,
  useNoShowBooking,
} from "@/hooks/useBookings";
import type { BookingStatus } from "@/types/bookings";

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SAMPLE_COLLECTED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SAMPLE_COLLECTED: "Sample Collected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

interface ActionButtonProps {
  label: string;
  onClick: () => Promise<void>;
  isPending: boolean;
  variant?: "primary" | "success" | "danger" | "secondary";
}

function ActionButton({ label, onClick, isPending, variant = "primary" }: ActionButtonProps) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]}`}
    >
      {isPending ? "…" : label}
    </button>
  );
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: booking, isLoading, isError } = useBooking(id);
  const { mutateAsync: confirm, isPending: isConfirming } = useConfirmBooking(id);
  const { mutateAsync: sampleCollected, isPending: isCollecting } = useMarkSampleCollected(id);
  const { mutateAsync: complete, isPending: isCompleting } = useCompleteBooking(id);
  const { mutateAsync: cancel, isPending: isCancelling } = useCancelBooking(id);
  const { mutateAsync: noShow, isPending: isNoShow } = useNoShowBooking(id);

  const act = (label: string, fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
      toast.success(`Booking ${label.toLowerCase()}`);
    } catch {
      toast.error(`Failed to ${label.toLowerCase()} booking`);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Loading booking…</div>;
  if (isError || !booking) return <div className="p-8 text-center text-sm text-red-600">Booking not found.</div>;

  const status = booking.status;
  const isTerminal = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
        ← Back to Bookings
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{booking.testName}</h1>
            {booking.testCategory && (
              <p className="text-sm text-gray-500">{booking.testCategory}</p>
            )}
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patient</dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {booking.patientPhone && <span className="block">{booking.patientPhone}</span>}
              {booking.patientEmail && <span className="block">{booking.patientEmail}</span>}
              {!booking.patientPhone && !booking.patientEmail && "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Appointment</dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {booking.appointmentAt
                ? format(new Date(booking.appointmentAt), "dd MMM yyyy, HH:mm")
                : <span className="text-gray-400">Walk-in</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {format(new Date(booking.createdAt), "dd MMM yyyy, HH:mm")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
            <dd className="mt-0.5 text-sm text-gray-900">
              {format(new Date(booking.updatedAt), "dd MMM yyyy, HH:mm")}
            </dd>
          </div>
          {booking.notes && (
            <div className="col-span-full">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{booking.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Status timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Status Timeline</h2>
        <ol className="relative border-l border-gray-200 space-y-4 pl-6">
          {(
            [
              "PENDING",
              "CONFIRMED",
              "SAMPLE_COLLECTED",
              "COMPLETED",
            ] as BookingStatus[]
          ).map((s) => {
            const steps: BookingStatus[] = ["PENDING", "CONFIRMED", "SAMPLE_COLLECTED", "COMPLETED"];
            const currentIdx = steps.indexOf(status as BookingStatus);
            const stepIdx = steps.indexOf(s);
            const done = stepIdx < currentIdx || status === s;
            const active = status === s;

            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-blue-600 bg-blue-600"
                      : active
                      ? "border-blue-600 bg-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {done && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span
                  className={`text-sm ${
                    active ? "font-semibold text-blue-700" : done ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </span>
              </li>
            );
          })}
          {["CANCELLED", "NO_SHOW"].includes(status) && (
            <li className="flex items-center gap-3">
              <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-red-500 bg-red-500">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-sm font-semibold text-red-600">{STATUS_LABELS[status]}</span>
            </li>
          )}
        </ol>
      </div>

      {/* Action buttons — only shown for non-terminal statuses */}
      {!isTerminal && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {status === "PENDING" && (
              <>
                <ActionButton
                  label="Confirm"
                  variant="primary"
                  isPending={isConfirming}
                  onClick={act("Confirmed", confirm)}
                />
                <ActionButton
                  label="No Show"
                  variant="secondary"
                  isPending={isNoShow}
                  onClick={act("No Show", noShow)}
                />
                <ActionButton
                  label="Cancel"
                  variant="danger"
                  isPending={isCancelling}
                  onClick={act("Cancelled", cancel)}
                />
              </>
            )}
            {status === "CONFIRMED" && (
              <>
                <ActionButton
                  label="Mark Sample Collected"
                  variant="success"
                  isPending={isCollecting}
                  onClick={act("Sample Collected", sampleCollected)}
                />
                <ActionButton
                  label="Cancel"
                  variant="danger"
                  isPending={isCancelling}
                  onClick={act("Cancelled", cancel)}
                />
              </>
            )}
            {status === "SAMPLE_COLLECTED" && (
              <ActionButton
                label="Complete"
                variant="success"
                isPending={isCompleting}
                onClick={act("Completed", complete)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
