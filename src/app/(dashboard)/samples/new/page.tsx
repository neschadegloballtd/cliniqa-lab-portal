"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRegisterSample } from "@/hooks/useSamples";
import { useBranchStore } from "@/store/branch.store";

const SAMPLE_TYPES = [
  "Blood (EDTA)",
  "Blood (Plain)",
  "Blood (Fluoride)",
  "Serum",
  "Urine",
  "Stool",
  "Swab (HVS)",
  "Swab (Throat)",
  "Swab (Wound)",
  "CSF",
  "Sputum",
  "Other",
];

export default function RegisterSamplePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? undefined;
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

  const register = useRegisterSample();

  const [form, setForm] = useState({
    testName: "",
    sampleType: "",
    pendingPatientName: "",
    pendingPatientPhone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.testName.trim()) errs.testName = "Test name is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    register.mutate(
      {
        branchId: activeBranchId ?? undefined,
        bookingId: bookingId,
        testName: form.testName.trim(),
        sampleType: form.sampleType || undefined,
        pendingPatientName: form.pendingPatientName || undefined,
        pendingPatientPhone: form.pendingPatientPhone || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: (res) => {
          const id = res.data?.id;
          if (bookingId) {
            router.push(`/bookings/${bookingId}`);
          } else {
            router.push(`/samples/${id}`);
          }
        },
      }
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href={bookingId ? `/bookings/${bookingId}` : "/samples"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {bookingId ? "Back to Booking" : "Back to Samples"}
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Register Sample</h1>
        {bookingId && (
          <p className="mt-1 text-sm text-muted-foreground">
            This sample will be linked to the selected booking.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border p-6 space-y-5">
        {/* Test Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Test Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.testName}
            onChange={(e) => set("testName", e.target.value)}
            placeholder="e.g. Full Blood Count"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.testName && <p className="mt-1 text-xs text-destructive">{errors.testName}</p>}
        </div>

        {/* Sample Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Sample Type</label>
          <select
            value={form.sampleType}
            onChange={(e) => set("sampleType", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select type…</option>
            {SAMPLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Patient Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Patient Name</label>
          <input
            type="text"
            value={form.pendingPatientName}
            onChange={(e) => set("pendingPatientName", e.target.value)}
            placeholder="e.g. Udochi Echianu"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Patient Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Patient Phone</label>
          <input
            type="tel"
            value={form.pendingPatientPhone}
            onChange={(e) => set("pendingPatientPhone", e.target.value)}
            placeholder="e.g. 08012345678"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any additional notes…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {register.isError && (
          <p className="text-sm text-destructive">
            {(register.error as Error)?.message ?? "Failed to register sample."}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={register.isPending}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {register.isPending ? "Registering…" : "Register Sample"}
          </button>
          <Link
            href={bookingId ? `/bookings/${bookingId}` : "/samples"}
            className="rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
