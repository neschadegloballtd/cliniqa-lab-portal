export interface LabProfile {
  labId: string;
  labName: string;
  email: string;
  phone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressLga: string | null;
  latitude: number | null;
  longitude: number | null;
  accreditationNumber: string | null;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string;
  tier: string;
  inTrial: boolean;
  trialEndDate: string | null;
}

export interface UpdateLabProfileRequest {
  labName?: string | null;
  phone?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressLga?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accreditationNumber?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
}

// ── Test Menu ─────────────────────────────────────────────────────────────

export type TestCategory =
  | "HAEMATOLOGY"
  | "MICROBIOLOGY"
  | "CHEMISTRY"
  | "SEROLOGY"
  | "URINALYSIS"
  | "OTHER";

export interface TestMenuItem {
  id: string;
  testName: string;
  testCategory: TestCategory;
  priceKobo: number;
  turnaroundHours: number;
  sampleType: string;
  unit: string | null;
  isActive: boolean;
}

export interface CreateTestMenuItemRequest {
  testName: string;
  testCategory: string;
  priceKobo: number;
  turnaroundHours: number;
  sampleType: string;
  unit?: string | null;
}

export interface UpdateTestMenuItemRequest {
  testName?: string;
  testCategory?: string;
  priceKobo?: number;
  turnaroundHours?: number;
  sampleType?: string;
  unit?: string | null;
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
  | "CAC_CERTIFICATE"
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
