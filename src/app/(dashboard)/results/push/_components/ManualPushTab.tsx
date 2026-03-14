"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { usePushManual, usePushStatus } from "@/hooks/useResults";
import { useTestMenu } from "@/hooks/useProfile";
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

type RowLayout = "standard" | "microbiology" | "serology";

function getRowLayout(category?: string): RowLayout {
  if (category === "MICROBIOLOGY") return "microbiology";
  if (category === "SEROLOGY") return "serology";
  return "standard";
}

const SEROLOGY_QUICK = [
  { label: "Non-Reactive", status: "NORMAL", ref: "Non-Reactive" },
  { label: "Reactive", status: "CRITICAL", ref: "Non-Reactive" },
  { label: "Weakly Reactive", status: "HIGH", ref: "Non-Reactive" },
  { label: "Indeterminate", status: "", ref: "" },
] as const;

interface Props {
  onSuccess: () => void;
}

export default function ManualPushTab({ onSuccess }: Props) {
  const { mutateAsync: pushManual, isPending } = usePushManual();
  const [pushJobId, setPushJobId] = useState<string | null>(null);

  const { data: statusData } = usePushStatus(pushJobId ?? "", !!pushJobId);
  const { data: testMenu } = useTestMenu();
  const activeTests = testMenu?.filter((t) => t.isActive) ?? [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { results: [{ testName: "", measuredValue: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "results" });
  const watchedResults = useWatch({ control, name: "results" });

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
    const isPendingClaim = status === "PENDING_CLAIM";
    const isFailed = status === "FAILED";

    if (isPendingClaim) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
            📬
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800">Results saved — patient invited</p>
            <p className="mt-1 text-sm text-gray-500">
              This patient doesn&apos;t have a Cliniqa account yet. We&apos;ve saved their results and
              sent them an invitation to register. Their results will be automatically delivered and
              interpreted as soon as they sign up.
            </p>
          </div>
          <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 text-left">
            <strong>What happens next:</strong>
            <ol className="mt-1 ml-4 list-decimal space-y-0.5">
              <li>Patient downloads Cliniqa and creates an account</li>
              <li>Results are instantly linked to their profile</li>
              <li>AI interpretation is triggered automatically</li>
            </ol>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPushJobId(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Push another result
            </button>
            <button
              onClick={onSuccess}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Back to Results
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${
            isFailed ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          {isFailed ? (
            <span className="text-red-600 text-xl">✕</span>
          ) : (
            <span className="animate-spin text-blue-600 text-xl">⟳</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-700">
          {isFailed ? (
            <span className="text-red-600">Processing failed. Please try again.</span>
          ) : (
            `Status: ${status}`
          )}
        </p>
        {isFailed && (
          <button onClick={() => setPushJobId(null)} className="text-sm text-blue-600 hover:underline">
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
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Patient</h2>
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
          {fields.map((field, index) => {
            const category = watchedResults?.[index]?.testCategory;
            const layout = getRowLayout(category);
            const currentValue = watchedResults?.[index]?.measuredValue ?? "";

            return (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
              >
                {/* Row header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Result #{index + 1}</span>
                    {layout !== "standard" && (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          layout === "microbiology"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {layout === "microbiology" ? "Microbiology" : "Serology"}
                      </span>
                    )}
                  </div>
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

                {/* Test name + category selector (shared across all layouts) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Test Name *</label>
                    {activeTests.length > 0 ? (
                      <select
                        {...register(`results.${index}.testName`)}
                        onChange={(e) => {
                          setValue(`results.${index}.testName`, e.target.value);
                          const selected = activeTests.find((t) => t.testName === e.target.value);
                          if (selected) {
                            setValue(`results.${index}.testCategory`, selected.testCategory);
                            if (selected.unit) setValue(`results.${index}.unit`, selected.unit);
                            // Reset value fields when test changes to avoid stale data
                            setValue(`results.${index}.measuredValue`, "");
                            setValue(`results.${index}.referenceRangeText`, "");
                            setValue(`results.${index}.status`, "");
                          }
                        }}
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none bg-white"
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
                        {...register(`results.${index}.testName`)}
                        placeholder="e.g. Haemoglobin"
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    )}
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
                      readOnly={activeTests.length > 0}
                      className={`mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none ${
                        activeTests.length > 0 ? "bg-gray-100 text-gray-500 cursor-default" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* ── MICROBIOLOGY layout ─────────────────────────────────── */}
                {layout === "microbiology" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Organism / Finding *
                      </label>
                      <input
                        {...register(`results.${index}.measuredValue`)}
                        placeholder="e.g. E. coli — heavy growth, No growth detected"
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      {errors.results?.[index]?.measuredValue && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {errors.results[index]?.measuredValue?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Antibiotic Sensitivity / Notes
                      </label>
                      <textarea
                        {...register(`results.${index}.referenceRangeText`)}
                        placeholder={"e.g. Ampicillin: R, Ciprofloxacin: S, Gentamicin: S\nCotrimoxazole: R, Nitrofurantoin: S"}
                        rows={3}
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none resize-none"
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-xs font-medium text-gray-600">Status</label>
                      <select
                        {...register(`results.${index}.status`)}
                        className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">— auto —</option>
                        <option value="NORMAL">Normal (No growth)</option>
                        <option value="ABNORMAL">Abnormal (Growth detected)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── SEROLOGY layout ─────────────────────────────────────── */}
                {layout === "serology" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Result *</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {SEROLOGY_QUICK.map(({ label, status, ref }) => {
                          const isSelected = currentValue === label;
                          const colorClass =
                            label === "Non-Reactive"
                              ? isSelected
                                ? "bg-green-100 border-green-500 text-green-800"
                                : "border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-300"
                              : label === "Reactive"
                              ? isSelected
                                ? "bg-red-100 border-red-500 text-red-800"
                                : "border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300"
                              : label === "Weakly Reactive"
                              ? isSelected
                                ? "bg-amber-100 border-amber-500 text-amber-800"
                                : "border-gray-300 text-gray-600 hover:bg-amber-50 hover:border-amber-300"
                              : isSelected
                              ? "bg-gray-200 border-gray-500 text-gray-800"
                              : "border-gray-300 text-gray-600 hover:bg-gray-100";

                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                setValue(`results.${index}.measuredValue`, label);
                                if (status) setValue(`results.${index}.status`, status);
                                if (ref) setValue(`results.${index}.referenceRangeText`, ref);
                              }}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${colorClass}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {/* Free-text override */}
                      <input
                        {...register(`results.${index}.measuredValue`)}
                        placeholder="Or type a custom result (e.g. 1:160)"
                        className="mt-2 block w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      {errors.results?.[index]?.measuredValue && (
                        <p className="mt-0.5 text-xs text-red-600">
                          {errors.results[index]?.measuredValue?.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Reference Range
                          <span className="ml-1 font-normal text-gray-400">(typical: Non-Reactive)</span>
                        </label>
                        <input
                          {...register(`results.${index}.referenceRangeText`)}
                          placeholder="Non-Reactive"
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
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High / Borderline</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STANDARD layout (HAEMATOLOGY, CHEMISTRY, URINALYSIS, OTHER) ── */}
                {layout === "standard" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Measured Value *
                      </label>
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
                      <label className="block text-xs font-medium text-gray-600">
                        Reference Range
                      </label>
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
                )}
              </div>
            );
          })}
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
