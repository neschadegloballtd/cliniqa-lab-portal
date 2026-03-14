"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { usePushPdf, useOcrStatus } from "@/hooks/useResults";
import PatientLookupFields from "./PatientLookupFields";

const schema = z
  .object({
    patientPhone: z.string().optional(),
    patientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    reportDate: z.string().optional(),
    labReportRef: z.string().optional(),
  })
  .refine((d) => d.patientPhone || d.patientEmail, {
    message: "Phone or email required",
    path: ["patientPhone"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: (reportId: string) => void;
}

export default function PdfUploadTab({ onSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const { mutateAsync: pushPdf, isPending } = usePushPdf();

  const { data: ocrStatus } = useOcrStatus(
    reportId ?? "",
    !!reportId
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setSelectedFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  // Navigate to review page once OCR extraction completes
  useEffect(() => {
    if (ocrStatus?.processingStatus === "EXTRACTED" && reportId) {
      onSuccess(reportId);
    }
  }, [ocrStatus?.processingStatus, reportId, onSuccess]);

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }
    try {
      const res = await pushPdf({
        file: selectedFile,
        patientPhone: data.patientPhone || undefined,
        patientEmail: data.patientEmail || undefined,
        reportDate: data.reportDate || undefined,
        labReportRef: data.labReportRef || undefined,
      });
      if (res.data?.reportId) {
        setReportId(res.data.reportId);
        toast.success("PDF uploaded — running OCR…");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  if (reportId) {
    const status = ocrStatus?.processingStatus ?? "UPLOADED";
    const failed = status === "FAILED";
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center ${
            failed ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          {failed ? (
            <span className="text-red-600 text-2xl">✕</span>
          ) : (
            <span className="animate-spin text-blue-600 text-2xl">⟳</span>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {failed ? "OCR failed" : `Processing: ${status}`}
          </p>
          {ocrStatus?.ocrConfidence !== undefined && (
            <p className="text-xs text-gray-400 mt-1">
              Confidence: {(ocrStatus.ocrConfidence * 100).toFixed(0)}%
            </p>
          )}
          {ocrStatus?.errorMessage && (
            <p className="text-xs text-red-500 mt-1">{ocrStatus.errorMessage}</p>
          )}
        </div>
        {failed && (
          <button
            onClick={() => { setReportId(null); setSelectedFile(null); }}
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

      {/* Dropzone */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          PDF File
        </h2>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : selectedFile
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <>
              <span className="text-3xl">📄</span>
              <p className="mt-2 text-sm font-medium text-green-700">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — click to change
              </p>
            </>
          ) : (
            <>
              <span className="text-3xl text-gray-400">📤</span>
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive ? "Drop the PDF here" : "Drag & drop PDF, or click to browse"}
              </p>
              <p className="text-xs text-gray-400">Max 20 MB</p>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !selectedFile}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Uploading…" : "Upload & Extract"}
        </button>
      </div>
    </form>
  );
}
