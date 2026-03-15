import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  QaOverview,
  QaTurnaroundSummary,
  QaRejectionRates,
  QaVolumes,
} from "@/types/qa";

const params = (branchId?: string) => (branchId ? { params: { branchId } } : {});

export const qaService = {
  getOverview(branchId?: string): Promise<ApiResponse<QaOverview>> {
    return api.get("/lab/v1/qa/overview", params(branchId)).then((r) => r.data);
  },

  getTurnaround(branchId?: string): Promise<ApiResponse<QaTurnaroundSummary>> {
    return api.get("/lab/v1/qa/turnaround", params(branchId)).then((r) => r.data);
  },

  getRejectionRates(branchId?: string): Promise<ApiResponse<QaRejectionRates>> {
    return api.get("/lab/v1/qa/rejection-rates", params(branchId)).then((r) => r.data);
  },

  getVolumes(branchId?: string): Promise<ApiResponse<QaVolumes>> {
    return api.get("/lab/v1/qa/volumes", params(branchId)).then((r) => r.data);
  },
};
