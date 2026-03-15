import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardOverview, DashboardActivityResponse } from "@/types/dashboard";

export const dashboardService = {
  getOverview(branchId?: string): Promise<ApiResponse<DashboardOverview>> {
    return api
      .get("/lab/v1/dashboard/overview", { params: branchId ? { branchId } : undefined })
      .then((r) => r.data);
  },

  getRecentActivity(branchId?: string): Promise<ApiResponse<DashboardActivityResponse>> {
    return api
      .get("/lab/v1/dashboard/activity", { params: branchId ? { branchId } : undefined })
      .then((r) => r.data);
  },
};
