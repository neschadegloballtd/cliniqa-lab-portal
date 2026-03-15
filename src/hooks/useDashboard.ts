"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";
import { useBranchStore } from "@/store/branch.store";

export function useDashboardOverview() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: ["dashboard-overview", activeBranchId] as const,
    queryFn: () => dashboardService.getOverview(activeBranchId ?? undefined),
    select: (data) => data.data,
    refetchInterval: 60_000,
  });
}

export function useRecentActivity() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: ["dashboard-activity", activeBranchId] as const,
    queryFn: () => dashboardService.getRecentActivity(activeBranchId ?? undefined),
    select: (data) => data.data,
    refetchInterval: 60_000,
  });
}
