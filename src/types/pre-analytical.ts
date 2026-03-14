// Must exactly match PreAnalyticalRejectionReason enum on the backend
export type RejectionReason =
  | "HAEMOLYSED"
  | "CLOTTED"
  | "INSUFFICIENT_VOLUME"
  | "WRONG_CONTAINER"
  | "IMPROPER_LABELLING"
  | "WRONG_TEMPERATURE"
  | "CONTAMINATED"
  | "OTHER";

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  HAEMOLYSED: "Haemolysed",
  CLOTTED: "Clotted / Coagulated",
  INSUFFICIENT_VOLUME: "Insufficient Volume",
  WRONG_CONTAINER: "Wrong Container",
  IMPROPER_LABELLING: "Improper Labelling (Unlabelled / Mislabelled)",
  WRONG_TEMPERATURE: "Wrong Temperature / Temperature Breach",
  CONTAMINATED: "Contaminated / Damaged",
  OTHER: "Other",
};

export interface PreAnalyticalError {
  id: string;
  patientId?: string;
  bookingId?: string;
  pendingPatientPhone?: string;
  pendingPatientEmail?: string;
  rejectionReason: RejectionReason;
  rejectionNotes?: string;
  sampleType?: string;
  testName?: string;
  resampleBy?: string;
  resolved: boolean;
  resolvedAt?: string;
  patientNotified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface LogPreAnalyticalErrorRequest {
  patientId?: string;
  bookingId?: string;
  pendingPatientPhone?: string;
  pendingPatientEmail?: string;
  rejectionReason: RejectionReason;
  sampleType?: string;
  testName?: string;
  resampleBy?: string;
  rejectionNotes?: string;
}

export interface ResolvePreAnalyticalErrorRequest {
  resolutionNotes: string;
}

export type PreAnalyticalFilter = "ALL" | "UNRESOLVED" | "RESOLVED";
