export interface DashboardOverview {
  totalBookingsToday: number;
  pendingFlagsCount: number;
  unresolvedPreAnalyticalCount: number;
}

export interface ActivityItem {
  id: string;
  type: "BOOKING" | "RESULT" | "PRE_ANALYTICAL" | "SUBSCRIPTION";
  description: string;
  occurredAt: string;
}
