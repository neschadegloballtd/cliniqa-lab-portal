import api from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type { LogQcRunRequest, QcRunResponse } from "@/types/qc";

const BASE = "/lab/v1/qc";

export const qcService = {
  logRun(data: LogQcRunRequest): Promise<ApiResponse<QcRunResponse>> {
    return api.post(`${BASE}/runs`, data).then((r) => r.data);
  },

  listRuns(
    page = 0,
    size = 20,
    instrument = "",
    analyte = ""
  ): Promise<ApiResponse<PagedResponse<QcRunResponse>>> {
    return api
      .get(`${BASE}/runs`, { params: { page, size, instrument: instrument || undefined, analyte: analyte || undefined } })
      .then((r) => r.data);
  },

  getRun(runId: string): Promise<ApiResponse<QcRunResponse>> {
    return api.get(`${BASE}/runs/${runId}`).then((r) => r.data);
  },
};
