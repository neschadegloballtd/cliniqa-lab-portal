import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qcService } from "@/services/qc";
import type { LogQcRunRequest } from "@/types/qc";

const KEYS = {
  runs: ["qc-runs"] as const,
  run: (id: string) => ["qc-runs", id] as const,
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
