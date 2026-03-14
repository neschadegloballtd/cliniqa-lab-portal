export type ProcessingStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "EXTRACTED"
  | "CONFIRMED"
  | "FAILED"
  | "SAVED"
  | "PUBLISHED"
  | "PATIENT_NOT_FOUND"
  | "PENDING_CLAIM";

export type FlagStatus =
  | "PENDING_REVIEW"
  | "REVIEWED_NORMAL"
  | "REVIEWED_CRITICAL"
  | "OVERRIDDEN"
  | "AUTO_PUBLISHED";

export interface LabResultItemRequest {
  testName: string;
  testCategory?: string;
  measuredValue: string;
  numericValue?: number;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeText?: string;
  status?: string;
}

export interface LabResultPushRequest {
  patientPhone?: string;
  patientEmail?: string;
  reportDate?: string;
  labReportRef?: string;
  results: LabResultItemRequest[];
}

export interface LabPushAcceptedResponse {
  pushJobId: string;
  statusUrl: string;
}

export interface LabPushStatusResponse {
  pushJobId: string;
  status: string;
}

export interface LabFilePushAcceptedResponse {
  reportId: string;
  statusUrl: string;
}

export interface LabOcrStatusResponse {
  reportId: string;
  processingStatus: ProcessingStatus;
  ocrConfidence?: number;
  errorMessage?: string;
}

export interface ParsedCsvResponse {
  rows: LabResultItemRequest[];
  parseErrors: string[];
}

export interface LabResultRowDto {
  id: string;
  testName: string;
  testCategory?: string;
  measuredValue: string;
  numericValue?: number;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeText?: string;
  status?: string;
  manuallyCorrected: boolean;
  sortOrder?: number;
}

export interface LabReportDetailDto {
  reportId: string;
  source: string;
  reportType?: string;
  processingStatus: ProcessingStatus;
  ocrConfidence?: number;
  reportDate?: string;
  labReportRef?: string;
  results: LabResultRowDto[];
}

export interface LabReportSummaryDto {
  reportId: string;
  labReportRef?: string;
  reportDate?: string;
  resultCount: number;
  processingStatus: ProcessingStatus;
  flagStatus?: FlagStatus;
  severityHint?: string;
  createdAt: string;
}

export interface LabResultRowUpdateRequest {
  measuredValue?: string;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeText?: string;
  status?: string;
}

export interface FlagOverrideRequest {
  reviewerNotes: string;
  decision: string;
}
