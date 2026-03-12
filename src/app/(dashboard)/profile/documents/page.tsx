"use client";

import { useRef } from "react";
import { Trash2, UploadCloud, CheckCircle, XCircle, Clock } from "lucide-react";
import { useVerificationDocs, useUploadVerificationDoc, useDeleteVerificationDoc } from "@/hooks/useProfile";
import type { DocType, DocStatus } from "@/types/profile";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "CAC", label: "CAC Certificate" },
  { value: "MLSCN_LICENSE", label: "MLSCN License" },
  { value: "ACCREDITATION_CERT", label: "Accreditation Certificate" },
  { value: "TAX_CLEARANCE", label: "Tax Clearance" },
  { value: "OTHER", label: "Other" },
];

function StatusBadge({ status }: { status: DocStatus }) {
  const styles: Record<DocStatus, string> = {
    UPLOADED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const icons: Record<DocStatus, React.ReactNode> = {
    UPLOADED: <Clock className="h-3 w-3" />,
    APPROVED: <CheckCircle className="h-3 w-3" />,
    REJECTED: <XCircle className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {icons[status]} {status}
    </span>
  );
}

export default function DocumentsPage() {
  const { data: docs, isLoading } = useVerificationDocs();
  const uploadDoc = useUploadVerificationDoc();
  const deleteDoc = useDeleteVerificationDoc();
  const inputRefs = useRef<Record<DocType, HTMLInputElement | null>>({} as never);

  function handleFileChange(docType: DocType, file: File | undefined) {
    if (!file) return;
    uploadDoc.mutate({ docType, file });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Verification Documents</h1>
      <p className="text-sm text-muted-foreground">
        Upload the required documents for account verification. All documents are reviewed by the Cliniqa team.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {DOC_TYPES.map(({ value: docType, label }) => {
            const existing = docs?.find((d) => d.docType === docType);
            return (
              <div key={docType} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{label}</p>
                  {existing ? (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={existing.status} />
                      <span className="text-xs text-muted-foreground">{existing.fileName}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not uploaded</p>
                  )}
                  {existing?.status === "REJECTED" && existing.rejectionReason && (
                    <p className="text-xs text-destructive">{existing.rejectionReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => inputRefs.current[docType]?.click()}
                    disabled={uploadDoc.isPending}
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    {existing ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={(el) => { inputRefs.current[docType] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(docType, e.target.files?.[0])}
                  />
                  {existing && (
                    <button
                      onClick={() => deleteDoc.mutate(existing.docId)}
                      disabled={deleteDoc.isPending}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
