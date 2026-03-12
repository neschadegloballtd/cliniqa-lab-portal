"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ManualPushTab from "./_components/ManualPushTab";
import PdfUploadTab from "./_components/PdfUploadTab";
import CsvUploadTab from "./_components/CsvUploadTab";

type Tab = "manual" | "pdf" | "csv";

const TABS: { id: Tab; label: string }[] = [
  { id: "manual", label: "Manual Entry" },
  { id: "pdf", label: "PDF Upload" },
  { id: "csv", label: "CSV Upload" },
];

export default function PushResultsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const router = useRouter();

  const handleSuccess = (reportId?: string) => {
    if (reportId) {
      router.push(`/results/${reportId}`);
    } else {
      router.push("/results");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Push Results</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose how to submit lab results for a patient.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {activeTab === "manual" && <ManualPushTab onSuccess={() => handleSuccess()} />}
        {activeTab === "pdf" && <PdfUploadTab onSuccess={handleSuccess} />}
        {activeTab === "csv" && <CsvUploadTab onSuccess={() => handleSuccess()} />}
      </div>
    </div>
  );
}
