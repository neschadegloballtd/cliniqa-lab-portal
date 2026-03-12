export interface LabProfile {
  labId: string;
  labName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  accreditationNumber: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
}

export interface UpdateLabProfileRequest {
  labName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  accreditationNumber?: string | null;
  description?: string | null;
  website?: string | null;
}

// ── Test Menu ─────────────────────────────────────────────────────────────

export interface TestMenuItem {
  id: string;
  testName: string;
  testCategory: string;
  priceKobo: number;
  turnaroundHours: number;
  sampleType: string;
  isActive: boolean;
}

export interface CreateTestMenuItemRequest {
  testName: string;
  testCategory: string;
  priceKobo: number;
  turnaroundHours: number;
  sampleType: string;
}

export interface UpdateTestMenuItemRequest {
  testName?: string;
  testCategory?: string;
  priceKobo?: number;
  turnaroundHours?: number;
  sampleType?: string;
  isActive?: boolean;
}

// ── Operating Hours ───────────────────────────────────────────────────────

/** ISO day of week: 1 = Monday … 7 = Sunday */
export interface OperatingHoursEntry {
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  opensAt: string | null;  // "HH:mm"
  closesAt: string | null; // "HH:mm"
  isClosed: boolean;
}

export type OperatingHours = OperatingHoursEntry[];

// ── Verification Documents ────────────────────────────────────────────────

export type DocType =
  | "CAC"
  | "MLSCN_LICENSE"
  | "ACCREDITATION_CERT"
  | "TAX_CLEARANCE"
  | "OTHER";

export type DocStatus = "UPLOADED" | "APPROVED" | "REJECTED";

export interface VerificationDoc {
  docId: string;
  docType: DocType;
  fileName: string;
  uploadedAt: string;
  status: DocStatus;
  rejectionReason: string | null;
}

export interface UploadVerificationDocRequest {
  docType: DocType;
  file: File;
}
