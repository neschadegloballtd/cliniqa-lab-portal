import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resultsService } from "@/services/results";
import type {
  AcknowledgeCriticalAlertRequest,
  FlagOverrideRequest,
  LabResultPushRequest,
  LabResultRowUpdateRequest,
} from "@/types/results";

const KEYS = {
  reports: ["reports"] as const,
  report: (id: string) => ["reports", id] as const,
  ocrStatus: (id: string) => ["reports", id, "ocr-status"] as const,
  pushStatus: (jobId: string) => ["push-status", jobId] as const,
  authLog: (id: string) => ["reports", id, "auth-log"] as const,
  criticalAlerts: (id: string) => ["reports", id, "critical-alerts"] as const,
  pendingAlerts: ["critical-alerts", "pending"] as const,
  qcTodayStatus: ["qc", "today-status"] as const,
};

export function useReports(
  page = 0,
  size = 20,
  search?: string,
  flagStatus?: string,
  processingStatus?: string,
  authorizationStatus?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  return useQuery({
    queryKey: [...KEYS.reports, page, size, search, flagStatus, processingStatus, authorizationStatus, dateFrom, dateTo],
    queryFn: () => resultsService.listReports(page, size, search, flagStatus, processingStatus, authorizationStatus, dateFrom, dateTo),
    select: (data) => data.data,
  });
}

export function useReport(reportId: string) {
  return useQuery({
    queryKey: KEYS.report(reportId),
    queryFn: () => resultsService.getReport(reportId),
    select: (data) => data.data,
    enabled: !!reportId,
  });
}

export function useOcrStatus(reportId: string, enabled: boolean) {
  return useQuery({
    queryKey: KEYS.ocrStatus(reportId),
    queryFn: () => resultsService.getOcrStatus(reportId),
    select: (data) => data.data,
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.processingStatus;
      if (!status) return 3000;
      return ["EXTRACTED", "CONFIRMED", "FAILED"].includes(status) ? false : 3000;
    },
  });
}

export function usePushStatus(pushJobId: string, enabled: boolean) {
  return useQuery({
    queryKey: KEYS.pushStatus(pushJobId),
    queryFn: () => resultsService.getPushStatus(pushJobId),
    select: (data) => data.data,
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (!status) return 3000;
      return ["SAVED", "PUBLISHED", "FAILED", "PATIENT_NOT_FOUND"].includes(status) ? false : 3000;
    },
  });
}

export function usePushManual() {
  return useMutation({
    mutationFn: (data: LabResultPushRequest) => resultsService.pushManual(data),
  });
}

export function usePushPdf() {
  return useMutation({
    mutationFn: (vars: {
      file: File;
      patientPhone?: string;
      patientEmail?: string;
      reportDate?: string;
      labReportRef?: string;
    }) => resultsService.pushPdf(vars.file, vars),
  });
}

export function useParseCsv() {
  return useMutation({
    mutationFn: (file: File) => resultsService.parseCsv(file),
  });
}

export function useUpdateRow(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { resultId: string; data: LabResultRowUpdateRequest }) =>
      resultsService.updateRow(reportId, vars.resultId, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.report(reportId) }),
  });
}

export function useConfirmPush(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resultsService.confirmPush(reportId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.report(reportId) }),
  });
}

export function usePublishReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => resultsService.publishReport(reportId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.reports }),
  });
}

export function useOverrideFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { reportId: string; data: FlagOverrideRequest }) =>
      resultsService.overrideFlag(vars.reportId, vars.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.report(vars.reportId) }),
  });
}

export function useAuthorizeResult(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => resultsService.authorizeResult(reportId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.report(reportId) });
      qc.invalidateQueries({ queryKey: KEYS.reports });
      qc.invalidateQueries({ queryKey: KEYS.authLog(reportId) });
    },
  });
}

export function useRevokeAuthorization(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => resultsService.revokeAuthorization(reportId, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.report(reportId) });
      qc.invalidateQueries({ queryKey: KEYS.reports });
      qc.invalidateQueries({ queryKey: KEYS.authLog(reportId) });
    },
  });
}

export function useAuthorizationLog(reportId: string) {
  return useQuery({
    queryKey: KEYS.authLog(reportId),
    queryFn: () => resultsService.getAuthorizationLog(reportId),
    select: (data) => data.data,
    enabled: !!reportId,
  });
}

export function useCriticalAlerts(reportId: string) {
  return useQuery({
    queryKey: KEYS.criticalAlerts(reportId),
    queryFn: () => resultsService.getCriticalAlerts(reportId),
    select: (data) => data.data,
    enabled: !!reportId,
  });
}

export function useAcknowledgeAlert(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { alertId: string; data: AcknowledgeCriticalAlertRequest }) =>
      resultsService.acknowledgeAlert(reportId, vars.alertId, vars.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.criticalAlerts(reportId) });
      qc.invalidateQueries({ queryKey: KEYS.report(reportId) });
      qc.invalidateQueries({ queryKey: KEYS.pendingAlerts });
    },
  });
}

/** All PENDING_CALLBACK alerts across all reports — drives the global banner. */
export function useLabPendingAlerts() {
  return useQuery({
    queryKey: KEYS.pendingAlerts,
    queryFn: () => resultsService.getPendingAlerts(),
    select: (data) => data.data,
    refetchInterval: 60_000, // refresh every minute
  });
}

/** Re-scan a report's result rows for critical values from scratch. */
export function useRescanAlerts(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resultsService.rescanAlerts(reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.criticalAlerts(reportId) });
      qc.invalidateQueries({ queryKey: KEYS.pendingAlerts });
    },
  });
}

/** QC block status for today — drives the pre-flight publish indicator. */
export function useQcTodayStatus() {
  return useQuery({
    queryKey: KEYS.qcTodayStatus,
    queryFn: () => resultsService.getQcTodayStatus(),
    select: (data) => data.data,
    refetchInterval: 60_000,
  });
}
