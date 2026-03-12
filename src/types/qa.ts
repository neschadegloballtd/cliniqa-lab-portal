export interface QaOverview {
  totalReportsPublished: number;
  totalReportsPending: number;
  totalBookings: number;
  avgTurnaroundHours: number;
  flaggedResultsCount: number;
  preAnalyticalErrorsCount: number;
  rejectionRatePercent: number;
}

export interface TurnaroundDataPoint {
  date: string; // ISO date string "YYYY-MM-DD"
  avgHours: number;
}

export interface RejectionRateItem {
  reason: string;
  count: number;
  percent: number;
}

export interface VolumeDataPoint {
  date: string; // ISO date string "YYYY-MM-DD"
  bookings: number;
  reports: number;
}
