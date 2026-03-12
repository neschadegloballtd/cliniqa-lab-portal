"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { usePushManual, usePushStatus } from "@/hooks/useResults";
import PatientLookupFields from "./PatientLookupFields";

const resultItemSchema = z.object({
  testName: z.string().min(1, "Test name is required"),
  testCategory: z.string().optional(),
  measuredValue: z.string().min(1, "Measured value is required"),
  unit: z.string().optional(),
  referenceRangeText: z.string().optional(),
  status: z.string().optional(),
});

const schema = z
  .object({
    patientPhone: z.string().optional(),
    patientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    reportDate: z.string().optional(),
    labReportRef: z.string().optional(),
    results: z.array(resultItemSchema).min(1, "Add at least one result"),
  })
  .refine((d) => d.patientPhone || d.patientEmail, {
    message: "Phone or email required",
    path: ["patientPhone"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
}

export default function ManualPushTab({ onSuccess }: Props) {
  const { mutateAsync: pushManual, isPending } = usePushManual();
  const [pushJobId, setPushJobId] = useState<string | null>(null);

  const { data: statusData } = usePushStatus(pushJobId ?? "", !!pushJobId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { results: [{ testName: "", measuredValue: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "results" });

  // When status reaches terminal state, call onSuccess
  if (statusData?.status && ["SAVED", "PUBLISHED"].includes(statusData.status)) {
    onSuccess();
  }

  const onSubmit = async (data: FormData) => {
    try {
      const res = await pushManual({
        patientPhone: data.patientPhone || undefined,
        patientEmail: data.patientEmail || undefined,
        reportDate: data.reportDate || undefined,
        labReportRef: data.labReportRef || undefined,
        results: data.results,
      });
      if (res.data?.pushJobId) {
        setPushJobId(res.data.pushJobId);
        toast.success("Results submitted — processing…");
      }
    } catch {
      toast.error("Failed to push results. Please try again.");
    }
  };

  if (pushJobId) {
    const status = statusData?.status ?? "QUEUED";
    const failed = status === "FAILED" || status === "PATIENT_NOT_FOUND";
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            failed ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          {failed ? (
            <span className="text-red-600 text-xl">✕</span>
          ) : (
            <span className="animate-spin text-blue-600 text-xl">⟳</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-700">
          {failed ? (
            <span className="text-red-600">
              {status === "PATIENT_NOT_FOUND"
                ? "No Cliniqa patient found for the provided phone/email."
                : "Processing failed. Please try again."}
            </span>
          ) : (
            `Status: ${status}`
          )}
        </p>
        {failed && (
          <button
            onClick={() => setPushJobId(null)}
            className="text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient lookup */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Patient
        </h2>
        <PatientLookupFields register={register} errors={errors} />
      </div>

      {/* Report metadata */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Report Date</label>
          <input
            type="date"
            {...register("reportDate")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lab Report Ref</label>
          <input
            type="text"
            placeholder="e.g. LAB-2024-001"
            {...register("labReportRef")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Result rows */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Test Results
        </h2>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Result #{index + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-600">Test Name *</label>
                  <input
                    {...register(`results.${index}.testName`)}
                    placeholder="e.g. Haemoglobin"
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {errors.results?.[index]?.testName && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.results[index]?.testName?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Category</label>
                  <input
                    {...register(`results.${index}.testCategory`)}
                    placeholder="e.g. Haematology"
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Measured Value *</label>
                  <input
                    {...register(`results.${index}.measuredValue`)}
                    placeholder="e.g. 12.5"
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {errors.results?.[index]?.measuredValue && (
                    <p className="mt-0.5 text-xs text-red-600">
                      {errors.results[index]?.measuredValue?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Unit</label>
                  <input
                    {...register(`results.${index}.unit`)}
                    placeholder="e.g. g/dL"
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Reference Range</label>
                  <input
                    {...register(`results.${index}.referenceRangeText`)}
                    placeholder="e.g. 11.5–16.0"
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Status</label>
                  <select
                    {...register(`results.${index}.status`)}
                    className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">— auto —</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ testName: "", measuredValue: "" })}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          + Add another result
        </button>
        {errors.results && typeof errors.results.message === "string" && (
          <p className="mt-1 text-xs text-red-600">{errors.results.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Push Results"}
        </button>
      </div>
    </form>
  );
}
