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
  /** Optional analyser name — enables instrument-scoped QC publish-block. */
  instrumentName?: string;
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

export interface AiOutlier {
  testName: string;
  /** MILD | MODERATE | SEVERE */
  deviation: string;
  note: string;
}

export interface DataQualityWarning {
  testName: string;
  issue: string;
}

export type AuthorizationStatus = "PRELIMINARY" | "AUTHORIZED";

export interface AuthorizationLogEntry {
  id: string;
  /** SUBMITTED | AUTHORIZED | REVOKED */
  action: string;
  performedByStaffId?: string;
  notes?: string;
  occurredAt: string;
}

export interface LabReportDetailDto {
  reportId: string;
  source: string;
  reportType?: string;
  processingStatus: ProcessingStatus;
  /** null if AI QA hasn't run yet */
  flagStatus?: FlagStatus;
  /** Set once published to the patient */
  publishedAt?: string;
  /** AI 1-2 sentence summary — null if QA hasn't run yet */
  llmSummary?: string;
  /** NORMAL | MILD | MODERATE | CRITICAL */
  severityHint?: string;
  /** Per-row AI findings for tests outside reference range */
  outliers?: AiOutlier[];
  /** Rule-based data quality issues detected before AI ran */
  dataQualityWarnings?: DataQualityWarning[];
  ocrConfidence?: number;
  reportDate?: string;
  labReportRef?: string;
  results: LabResultRowDto[];
  authorizationStatus: AuthorizationStatus;
  authorizedByStaffId?: string;
  authorizedAt?: string;
  authorizationNotes?: string;
  /** Analyser/instrument that produced this report — null if not specified at push time. */
  instrumentName?: string;
}

export interface LabReportSummaryDto {
  reportId: string;
  labReportRef?: string;
  reportDate?: string;
  resultCount: number;
  processingStatus: ProcessingStatus;
  flagStatus?: FlagStatus;
  severityHint?: string;
  authorizationStatus: AuthorizationStatus;
  authorizedAt?: string;
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

/** PENDING_CALLBACK = callback has not yet been logged; ACKNOWLEDGED = callback done */
export type CriticalAlertStatus = "PENDING_CALLBACK" | "ACKNOWLEDGED";

export interface CriticalValueAlert {
  id: string;
  reportId: string;
  resultId: string;
  testName: string;
  measuredValue: string;
  /** Human-readable threshold breached, e.g. "< 5.0 g/dL" */
  threshold: string;
  status: CriticalAlertStatus;
  acknowledgedByStaffId?: string;
  acknowledgedAt?: string;
  callbackNotes?: string;
  createdAt: string;
}

export interface AcknowledgeCriticalAlertRequest {
  /** Required: document who was notified, when, and the outcome (ISO 15189 / MLSCN compliance). */
  callbackNotes: string;
}

export interface QcTodayStatus {
  isBlocked: boolean;
  unresolvedRejectCount: number;
}
