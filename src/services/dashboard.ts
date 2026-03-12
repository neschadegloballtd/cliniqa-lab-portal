import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { DashboardOverview, ActivityItem } from "@/types/dashboard";

export const dashboardService = {
  getOverview: () =>
    api.get<ApiResponse<DashboardOverview>>("/lab/v1/dashboard/overview"),

  getRecentActivity: () =>
    api.get<ApiResponse<ActivityItem[]>>("/lab/v1/dashboard/activity"),
};
