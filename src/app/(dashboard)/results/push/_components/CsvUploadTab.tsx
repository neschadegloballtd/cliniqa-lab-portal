"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useParseCsv, usePushManual, usePushStatus } from "@/hooks/useResults";
import { resultsService } from "@/services/results";
import type { LabResultItemRequest } from "@/types/results";
import PatientLookupFields from "./PatientLookupFields";

const schema = z
  .object({
    patientPhone: z.string().optional(),
    patientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    reportDate: z.string().optional(),
    labReportRef: z.string().optional(),
    instrumentName: z.string().optional(),
    results: z
      .array(
        z.object({
          testName: z.string().min(1),
          testCategory: z.string().optional(),
          measuredValue: z.string().min(1),
          unit: z.string().optional(),
          referenceRangeText: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .optional(),
  })
  .refine((d) => d.patientPhone || d.patientEmail, {
    message: "Phone or email required",
    path: ["patientPhone"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
}

export default function CsvUploadTab({ onSuccess }: Props) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [pushJobId, setPushJobId] = useState<string | null>(null);

  const { mutateAsync: parseCsv, isPending: isParsing } = useParseCsv();
  const { mutateAsync: pushManual, isPending: isPushing } = usePushManual();
  const { data: statusData } = usePushStatus(pushJobId ?? "", !!pushJobId);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { fields, remove } = useFieldArray({ control, name: "results" });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setCsvFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleDownloadTemplate = async () => {
    try {
      const blob = await resultsService.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cliniqa_results_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template.");
    }
  };

  const handleParseCsv = async () => {
    if (!csvFile) return;
    try {
      const res = await parseCsv(csvFile);
      const parsed = res.data;
      if (parsed) {
        setParseErrors(parsed.parseErrors);
        setValue(
          "results",
          parsed.rows.map((r: LabResultItemRequest) => ({
            testName: r.testName,
            testCategory: r.testCategory ?? "",
            measuredValue: r.measuredValue,
            unit: r.unit ?? "",
            referenceRangeText: r.referenceRangeText ?? "",
            status: r.status ?? "",
          }))
        );
        setStep("review");
        if (parsed.parseErrors.length > 0) {
          toast.warning(`${parsed.parseErrors.length} row(s) had parse errors.`);
        }
      }
    } catch {
      toast.error("Failed to parse CSV. Please check the file format.");
    }
  };

  // Success state
  if (statusData?.status && ["SAVED", "PUBLISHED"].includes(statusData.status)) {
    onSuccess();
  }

  const onSubmit = async (data: FormData) => {
    if (!data.results || data.results.length === 0) {
      toast.error("No valid results to submit.");
      return;
    }
    try {
      const res = await pushManual({
        patientPhone: data.patientPhone || undefined,
        patientEmail: data.patientEmail || undefined,
        reportDate: data.reportDate || undefined,
        labReportRef: data.labReportRef || undefined,
        instrumentName: data.instrumentName || undefined,
        results: data.results.map((r) => ({
          testName: r.testName,
          testCategory: r.testCategory || undefined,
          measuredValue: r.measuredValue,
          unit: r.unit || undefined,
          referenceRangeText: r.referenceRangeText || undefined,
          status: r.status || undefined,
        })),
      });
      if (res.data?.pushJobId) {
        setPushJobId(res.data.pushJobId);
        toast.success("Results submitted — processing…");
      }
    } catch {
      toast.error("Failed to push results.");
    }
  };

  if (pushJobId) {
    const status = statusData?.status ?? "QUEUED";
    const failed = ["FAILED", "PATIENT_NOT_FOUND"].includes(status);
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${failed ? "bg-red-100" : "bg-blue-100"}`}>
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
                : "Processing failed."}
            </span>
          ) : (
            `Status: ${status}`
          )}
        </p>
        {failed && (
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Analyser / Instrument <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Mindray BS-240"
            {...register("instrumentName")}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {step === "upload" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">CSV File</h2>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs text-blue-600 hover:underline"
            >
              Download Template
            </button>
          </div>

          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : csvFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            {csvFile ? (
              <>
                <span className="text-3xl">📊</span>
                <p className="mt-2 text-sm font-medium text-green-700">{csvFile.name}</p>
                <p className="text-xs text-gray-500">Click to change</p>
              </>
            ) : (
              <>
                <span className="text-3xl text-gray-400">📋</span>
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive ? "Drop the CSV here" : "Drag & drop CSV, or click to browse"}
                </p>
                <p className="text-xs text-gray-400">Max 5 MB</p>
              </>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleParseCsv}
              disabled={!csvFile || isParsing}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isParsing ? "Parsing…" : "Parse & Preview"}
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Review Results ({fields.length} rows)
            </h2>
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="text-xs text-blue-600 hover:underline"
            >
              Upload different file
            </button>
          </div>

          {parseErrors.length > 0 && (
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-xs font-medium text-yellow-800 mb-1">Parse warnings:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {parseErrors.map((e, i) => (
                  <li key={i} className="text-xs text-yellow-700">{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {["Test Name", "Category", "Value", "Unit", "Reference Range", "Status", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-3 py-2">
                      <input
                        {...register(`results.${index}.testName`)}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...register(`results.${index}.testCategory`)}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...register(`results.${index}.measuredValue`)}
                        className="w-24 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...register(`results.${index}.unit`)}
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        {...register(`results.${index}.referenceRangeText`)}
                        className="w-28 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        {...register(`results.${index}.status`)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      >
                        <option value="">Auto</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="LOW">Low</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPushing}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPushing ? "Submitting…" : "Submit Results"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
