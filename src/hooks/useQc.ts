import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qcService } from "@/services/qc";
import type { LogQcRunRequest, ResolveQcViolationRequest } from "@/types/qc";

const KEYS = {
  runs: ["qc-runs"] as const,
  run: (id: string) => ["qc-runs", id] as const,
  series: (instrument: string, analyte: string, level: string) =>
    ["qc-series", instrument, analyte, level] as const,
};

export function useQcRuns(page = 0, size = 20, instrument = "", analyte = "") {
  return useQuery({
    queryKey: [...KEYS.runs, page, size, instrument, analyte],
    queryFn: () => qcService.listRuns(page, size, instrument, analyte),
    select: (data) => data.data,
  });
}

export function useQcRun(runId: string) {
  return useQuery({
    queryKey: KEYS.run(runId),
    queryFn: () => qcService.getRun(runId),
    select: (data) => data.data,
    enabled: !!runId,
  });
}

export function useLogQcRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LogQcRunRequest) => qcService.logRun(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.runs }),
  });
}

export function useQcRunSeries(instrument: string, analyte: string, level: string) {
  return useQuery({
    queryKey: KEYS.series(instrument, analyte, level),
    queryFn: () => qcService.getRunSeries(instrument, analyte, level),
    select: (data) => data.data,
    enabled: !!(instrument && analyte && level),
  });
}

export function useResolveViolation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ violationId, data }: { violationId: string; data: ResolveQcViolationRequest }) =>
      qcService.resolveViolation(violationId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.runs });
      qc.invalidateQueries({ queryKey: ["qc-series"] });
    },
  });
}
