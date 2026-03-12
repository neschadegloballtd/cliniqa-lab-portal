export type RejectionReason =
  | "HAEMOLYSED"
  | "CLOTTED"
  | "INSUFFICIENT_VOLUME"
  | "WRONG_CONTAINER"
  | "UNLABELLED"
  | "MISLABELLED"
  | "DAMAGED_CONTAINER"
  | "TEMPERATURE_BREACH"
  | "DELAYED_TRANSPORT"
  | "OTHER";

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  HAEMOLYSED: "Haemolysed",
  CLOTTED: "Clotted",
  INSUFFICIENT_VOLUME: "Insufficient Volume",
  WRONG_CONTAINER: "Wrong Container",
  UNLABELLED: "Unlabelled",
  MISLABELLED: "Mislabelled",
  DAMAGED_CONTAINER: "Damaged Container",
  TEMPERATURE_BREACH: "Temperature Breach",
  DELAYED_TRANSPORT: "Delayed Transport",
  OTHER: "Other",
};

export interface PreAnalyticalError {
  id: string;
  rejectionReason: RejectionReason;
  patientPhone?: string;
  patientEmail?: string;
  sampleType: string;
  testName: string;
  resampleBy?: string;
  notes?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
  patientNotified: boolean;
  patientNotifiedAt?: string;
  createdAt: string;
}

export interface LogPreAnalyticalErrorRequest {
  rejectionReason: RejectionReason;
  patientPhone?: string;
  patientEmail?: string;
  sampleType: string;
  testName: string;
  resampleBy?: string;
  notes?: string;
}

export interface ResolvePreAnalyticalErrorRequest {
  resolutionNotes: string;
}

export type PreAnalyticalFilter = "ALL" | "UNRESOLVED" | "RESOLVED";
