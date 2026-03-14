import api from "@/lib/api";
import type {
  FlagOverrideRequest,
  LabFilePushAcceptedResponse,
  LabOcrStatusResponse,
  LabPushAcceptedResponse,
  LabPushStatusResponse,
  LabReportDetailDto,
  LabReportSummaryDto,
  LabResultItemRequest,
  LabResultPushRequest,
  LabResultRowDto,
  LabResultRowUpdateRequest,
  ParsedCsvResponse,
} from "@/types/results";
import type { ApiResponse, PagedResponse } from "@/types/api";

const BASE = "/lab/v1/results";

export const resultsService = {
  /** Manual JSON push — returns jobId + statusUrl */
  pushManual(data: LabResultPushRequest): Promise<ApiResponse<LabPushAcceptedResponse>> {
    return api.post(`${BASE}/push`, data).then((r) => r.data);
  },

  /** Poll manual push status */
  getPushStatus(pushJobId: string): Promise<ApiResponse<LabPushStatusResponse>> {
    return api.get(`${BASE}/push-status/${pushJobId}`).then((r) => r.data);
  },

  /** Upload PDF — returns reportId + statusUrl */
  pushPdf(
    file: File,
    params: { patientPhone?: string; patientEmail?: string; reportDate?: string; labReportRef?: string }
  ): Promise<ApiResponse<LabFilePushAcceptedResponse>> {
    const form = new FormData();
    form.append("file", file);
    form.append("fileType", "PDF");
    if (params.patientPhone) form.append("patientPhone", params.patientPhone);
    if (params.patientEmail) form.append("patientEmail", params.patientEmail);
    if (params.reportDate) form.append("reportDate", params.reportDate);
    if (params.labReportRef) form.append("labReportRef", params.labReportRef);
    return api.post(`${BASE}/push/file`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },

  /** Upload CSV — parses and returns rows (no DB writes) */
  parseCsv(file: File): Promise<ApiResponse<ParsedCsvResponse>> {
    const form = new FormData();
    form.append("file", file);
    form.append("fileType", "CSV");
    return api.post(`${BASE}/push/file`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },

  /** Poll OCR status for a PDF report */
  getOcrStatus(reportId: string): Promise<ApiResponse<LabOcrStatusResponse>> {
    return api.get(`${BASE}/${reportId}/ocr-status`).then((r) => r.data);
  },

  /** Download blank CSV template */
  downloadTemplate(): Promise<Blob> {
    return api.get(`${BASE}/template.csv`, { responseType: "blob" }).then((r) => r.data);
  },

  /** List reports — all params are optional filters */
  listReports(
    page = 0,
    size = 20,
    search?: string,
    flagStatus?: string,
    processingStatus?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ApiResponse<PagedResponse<LabReportSummaryDto>>> {
    return api
      .get(BASE, { params: { page, size, search: search || undefined, flagStatus: flagStatus || undefined, processingStatus: processingStatus || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } })
      .then((r) => r.data);
  },

  /** Get report detail with extracted rows */
  getReport(reportId: string): Promise<ApiResponse<LabReportDetailDto>> {
    return api.get(`${BASE}/${reportId}`).then((r) => r.data);
  },

  /** Edit an extracted row */
  updateRow(
    reportId: string,
    resultId: string,
    data: LabResultRowUpdateRequest
  ): Promise<ApiResponse<LabResultRowDto>> {
    return api.patch(`${BASE}/${reportId}/rows/${resultId}`, data).then((r) => r.data);
  },

  /** Confirm PDF push (after staff review) → enqueues AI flagging */
  confirmPush(reportId: string): Promise<ApiResponse<void>> {
    return api.post(`${BASE}/${reportId}/confirm`).then((r) => r.data);
  },

  /** Publish a report (PENDING_REVIEW → patient-visible) */
  publishReport(reportId: string): Promise<ApiResponse<void>> {
    return api.post(`${BASE}/${reportId}/publish`).then((r) => r.data);
  },

  /** Override AI flag decision */
  overrideFlag(reportId: string, data: FlagOverrideRequest): Promise<ApiResponse<void>> {
    return api.post(`${BASE}/${reportId}/flag-override`, data).then((r) => r.data);
  },
};

/** Build initial form rows from parsed CSV / OCR rows */
export function toFormRows(items: LabResultItemRequest[]): LabResultItemRequest[] {
  return items.map((item) => ({ ...item }));
}
