"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Upload, ArrowLeft } from "lucide-react";
import { useProfile, useUploadLogo } from "@/hooks/useProfile";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export default function LogoPage() {
  const { data: profile } = useProfile();
  const uploadLogo = useUploadLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG and PNG files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("File must be under 5 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    uploadLogo.mutate(file, {
      onError: () => setPreview(null),
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-6 max-w-md">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      <h1 className="text-2xl font-bold">Lab Logo</h1>

      {(preview ?? profile?.logoUrl) && (
        <div className="relative h-32 w-32 rounded-lg border border-border overflow-hidden">
          <Image
            src={preview ?? profile!.logoUrl!}
            alt="Lab logo"
            fill
            className="object-contain"
          />
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 hover:bg-muted/50 transition-colors"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Drop your logo here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">JPEG or PNG, max 5 MB</p>
        </div>
        {uploadLogo.isPending && (
          <p className="text-xs text-muted-foreground">Uploading…</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
