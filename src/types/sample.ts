export type SampleStatus =
  | "REGISTERED"
  | "COLLECTED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "PROCESSING"
  | "RESULTED"
  | "ARCHIVED"
  | "REJECTED";

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  REGISTERED: "Registered",
  COLLECTED: "Collected",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  PROCESSING: "Processing",
  RESULTED: "Resulted",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

export const SAMPLE_STATUS_COLORS: Record<SampleStatus, string> = {
  REGISTERED: "bg-blue-100 text-blue-700",
  COLLECTED: "bg-indigo-100 text-indigo-700",
  IN_TRANSIT: "bg-purple-100 text-purple-700",
  RECEIVED: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-orange-100 text-orange-700",
  RESULTED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-700",
};

/** Allowed next statuses from each current status (for UI transition buttons). */
export const ALLOWED_NEXT_STATUSES: Partial<Record<SampleStatus, SampleStatus[]>> = {
  REGISTERED: ["COLLECTED", "REJECTED"],
  COLLECTED: ["IN_TRANSIT", "RECEIVED", "REJECTED"],
  IN_TRANSIT: ["RECEIVED", "REJECTED"],
  RECEIVED: ["PROCESSING", "REJECTED"],
  PROCESSING: ["RESULTED", "REJECTED"],
  RESULTED: ["ARCHIVED"],
};

export interface SampleEvent {
  id: string;
  status: SampleStatus;
  performedByStaffId?: string;
  notes?: string;
  occurredAt: string;
}

export interface LabSample {
  id: string;
  labId: string;
  branchId?: string;
  bookingId?: string;
  barcode: string;
  status: SampleStatus;
  patientId?: string;
  pendingPatientName?: string;
  pendingPatientPhone?: string;
  testName?: string;
  sampleType?: string;
  collectedByStaffId?: string;
  receivedByStaffId?: string;
  notes?: string;
  events: SampleEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSampleRequest {
  branchId?: string;
  bookingId?: string;
  patientId?: string;
  pendingPatientName?: string;
  pendingPatientPhone?: string;
  testName: string;
  sampleType?: string;
  notes?: string;
}

export interface TransitionStatusRequest {
  status: SampleStatus;
  notes?: string;
}

export interface LinkToBookingRequest {
  bookingId: string;
}
