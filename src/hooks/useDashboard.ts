"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";

export const DASHBOARD_OVERVIEW_KEY = ["dashboard-overview"] as const;
export const DASHBOARD_ACTIVITY_KEY = ["dashboard-activity"] as const;

export function useDashboardOverview() {
  return useQuery({
    queryKey: DASHBOARD_OVERVIEW_KEY,
    queryFn: () => dashboardService.getOverview().then((r) => r.data.data!),
    refetchInterval: 60_000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: DASHBOARD_ACTIVITY_KEY,
    queryFn: () => dashboardService.getRecentActivity().then((r) => r.data.data!),
    refetchInterval: 60_000,
  });
}
