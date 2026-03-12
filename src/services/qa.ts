import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  QaOverview,
  TurnaroundDataPoint,
  RejectionRateItem,
  VolumeDataPoint,
} from "@/types/qa";

export const qaService = {
  getOverview(): Promise<ApiResponse<QaOverview>> {
    return api.get("/lab/v1/qa/overview").then((r) => r.data);
  },

  getTurnaround(): Promise<ApiResponse<TurnaroundDataPoint[]>> {
    return api.get("/lab/v1/qa/turnaround").then((r) => r.data);
  },

  getRejectionRates(): Promise<ApiResponse<RejectionRateItem[]>> {
    return api.get("/lab/v1/qa/rejection-rates").then((r) => r.data);
  },

  getVolumes(): Promise<ApiResponse<VolumeDataPoint[]>> {
    return api.get("/lab/v1/qa/volumes").then((r) => r.data);
  },
};
