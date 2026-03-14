"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { useLogPreAnalyticalError } from "@/hooks/usePreAnalytical";
import { REJECTION_REASON_LABELS, type RejectionReason } from "@/types/pre-analytical";
import { useTestMenu } from "@/hooks/useProfile";
import type { TestCategory } from "@/types/profile";

const CATEGORY_LABELS: Record<TestCategory, string> = {
  HAEMATOLOGY: "Haematology",
  MICROBIOLOGY: "Microbiology",
  CHEMISTRY: "Chemistry",
  SEROLOGY: "Serology",
  URINALYSIS: "Urinalysis",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<TestCategory, string> = {
  HAEMATOLOGY: "bg-red-100 text-red-700",
  MICROBIOLOGY: "bg-purple-100 text-purple-700",
  CHEMISTRY: "bg-blue-100 text-blue-700",
  SEROLOGY: "bg-teal-100 text-teal-700",
  URINALYSIS: "bg-amber-100 text-amber-700",
  OTHER: "bg-gray-100 text-gray-600",
};

const REJECTION_REASONS = Object.keys(REJECTION_REASON_LABELS) as RejectionReason[];

const schema = z
  .object({
    rejectionReason: z.enum(REJECTION_REASONS as [RejectionReason, ...RejectionReason[]], {
      required_error: "Rejection reason is required",
    }),
    patientPhone: z.string().optional(),
    patientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    sampleType: z.string().min(1, "Sample type is required"),
    testName: z.string().min(1, "Test name is required"),
    resampleBy: z.string().optional(),
    notes: z.string().optional(),
  });

type FormData = z.infer<typeof schema>;

export default function LogPreAnalyticalErrorPage() {
  const router = useRouter();
  const { mutateAsync: logError, isPending } = useLogPreAnalyticalError();
  const { data: testMenu } = useTestMenu();
  const activeTests = testMenu?.filter((t) => t.isActive) ?? [];
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await logError({
        rejectionReason: data.rejectionReason,
        patientPhone: data.patientPhone || undefined,
        patientEmail: data.patientEmail || undefined,
        sampleType: data.sampleType,
        testName: data.testName,
        resampleBy: data.resampleBy || undefined,
        notes: data.notes || undefined,
      });
      toast.success("Pre-analytical error logged");
      router.push(`/pre-analytical/${res.data?.id}`);
    } catch {
      toast.error("Failed to log error");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">
          ← Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Log Pre-Analytical Error</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a sample rejection or pre-analytical failure for quality tracking.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
      >
        {/* Rejection reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <select
            {...register("rejectionReason")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Select reason —</option>
            {REJECTION_REASONS.map((r) => (
              <option key={r} value={r}>
                {REJECTION_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          {errors.rejectionReason && (
            <p className="mt-1 text-xs text-red-600">{errors.rejectionReason.message}</p>
          )}
        </div>

        {/* Test & Sample */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Name <span className="text-red-500">*</span>
            </label>
            {activeTests.length > 0 ? (
              <select
                {...register("testName")}
                onChange={(e) => {
                  setValue("testName", e.target.value);
                  const selected = activeTests.find((t) => t.testName === e.target.value);
                  if (selected) {
                    setValue("sampleType", selected.sampleType);
                    setSelectedCategory(selected.testCategory);
                  } else {
                    setSelectedCategory(null);
                  }
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">— Select test —</option>
                {activeTests.map((t) => (
                  <option key={t.id} value={t.testName}>
                    {t.testName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. Full Blood Count"
                {...register("testName")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
            {selectedCategory && (
              <span
                className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[selectedCategory]}`}
              >
                {CATEGORY_LABELS[selectedCategory]}
              </span>
            )}
            {errors.testName && (
              <p className="mt-1 text-xs text-red-600">{errors.testName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sample Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. EDTA Blood, Urine, Serum"
              {...register("sampleType")}
              readOnly={activeTests.length > 0 && !!selectedCategory}
              className={`mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                activeTests.length > 0 && !!selectedCategory
                  ? "bg-gray-50 text-gray-500 cursor-default"
                  : ""
              }`}
            />
            {activeTests.length > 0 && !!selectedCategory && (
              <p className="mt-1 text-xs text-gray-400">Auto-filled from selected test</p>
            )}
            {errors.sampleType && (
              <p className="mt-1 text-xs text-red-600">{errors.sampleType.message}</p>
            )}
          </div>
        </div>

        {/* Patient (optional) */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700">
            Patient <span className="text-gray-400 font-normal">(optional)</span>
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">Phone</label>
              <input
                type="tel"
                placeholder="+2348012345678"
                {...register("patientPhone")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="patient@example.com"
                {...register("patientEmail")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.patientEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.patientEmail.message}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Provide patient contact if you want to send a resample notification later.
          </p>
        </fieldset>

        {/* Resample by */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Resample By <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            {...register("resampleBy")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            Deadline by which the patient should provide a new sample.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            placeholder="Any additional context about the rejection…"
            {...register("notes")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Logging…" : "Log Error"}
          </button>
        </div>
      </form>
    </div>
  );
}
