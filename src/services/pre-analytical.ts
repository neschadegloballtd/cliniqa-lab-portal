import api from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/api";
import type {
  LogPreAnalyticalErrorRequest,
  PreAnalyticalError,
  PreAnalyticalFilter,
  ResolvePreAnalyticalErrorRequest,
} from "@/types/pre-analytical";

const BASE = "/lab/v1/pre-analytical";

export const preAnalyticalService = {
  list(params?: {
    branchId?: string;
    filter?: PreAnalyticalFilter;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PagedResponse<PreAnalyticalError>>> {
    const { filter, branchId, ...rest } = params ?? {};
    const resolved =
      filter === "RESOLVED" ? true : filter === "UNRESOLVED" ? false : undefined;
    return api
      .get(BASE, {
        params: {
          ...rest,
          ...(branchId ? { branchId } : {}),
          ...(resolved !== undefined ? { resolved } : {}),
        },
      })
      .then((r) => r.data);
  },

  get(id: string): Promise<ApiResponse<PreAnalyticalError>> {
    return api.get(`${BASE}/${id}`).then((r) => r.data);
  },

  log(data: LogPreAnalyticalErrorRequest): Promise<ApiResponse<PreAnalyticalError>> {
    return api.post(BASE, data).then((r) => r.data);
  },

  resolve(
    id: string,
    data: ResolvePreAnalyticalErrorRequest
  ): Promise<ApiResponse<PreAnalyticalError>> {
    return api.patch(`${BASE}/${id}/resolve`, data).then((r) => r.data);
  },

  notifyPatient(id: string): Promise<ApiResponse<PreAnalyticalError>> {
    return api.post(`${BASE}/${id}/notify-patient`).then((r) => r.data);
  },
};
