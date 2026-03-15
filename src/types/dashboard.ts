export interface DashboardOverview {
  bookingsLast30Days: number;
  unresolvedErrors: number;
  totalResultsPushed: number;
  totalBookings: number;
}

export interface DashboardActivityItem {
  type: "BOOKING" | "PRE_ANALYTICAL_ERROR";
  id: string;
  title: string;
  subtitle?: string;
  createdAt: string;
}

export interface DashboardActivityResponse {
  items: DashboardActivityItem[];
}
