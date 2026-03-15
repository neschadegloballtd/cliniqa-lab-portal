export type WestgardRule = "ONE_2S" | "ONE_3S" | "TWO_2S" | "R_4S" | "FOUR_1S" | "TEN_X";
export type QcViolationSeverity = "WARNING" | "REJECT";

export const WESTGARD_RULE_LABELS: Record<WestgardRule, string> = {
  ONE_2S:  "1-2S (Warning)",
  ONE_3S:  "1-3S (Reject)",
  TWO_2S:  "2-2S (Reject)",
  R_4S:    "R-4S (Reject)",
  FOUR_1S: "4-1S (Reject)",
  TEN_X:   "10x  (Reject)",
};

export const WESTGARD_RULE_DESCRIPTIONS: Record<WestgardRule, string> = {
  ONE_2S:  "One control value exceeded ±2 SD — warning, watch for trend.",
  ONE_3S:  "One control value exceeded ±3 SD — run rejected.",
  TWO_2S:  "Two consecutive values on the same side of ±2 SD — systematic error.",
  R_4S:    "Range between two consecutive values exceeded 4 SD — random error.",
  FOUR_1S: "Four consecutive values on the same side of ±1 SD — systematic drift.",
  TEN_X:   "Ten consecutive values on the same side of the mean — systematic bias.",
};

export interface QcViolationDto {
  id: string;
  rule: WestgardRule;
  severity: QcViolationSeverity;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface ResolveQcViolationRequest {
  resolutionNotes: string;
}

export interface QcRunResponse {
  id: string;
  labId: string;
  instrumentName: string;
  analyte: string;
  controlLevel: string;
  measuredValue: number;
  targetMean: number;
  targetSd: number;
  /** z-score = (measured - mean) / sd */
  zScore: number;
  runDate: string;
  runAt: string;
  loggedByStaffId?: string;
  createdAt: string;
  violations: QcViolationDto[];
}

export interface LogQcRunRequest {
  instrumentName: string;
  analyte: string;
  controlLevel: string;
  measuredValue: number;
  targetMean: number;
  targetSd: number;
  runDate?: string;
}

// Recharts data point for the Levey-Jennings chart
export interface LJDataPoint {
  label: string;       // formatted run date/time
  value: number;       // measured value
  mean: number;
  plus1sd: number;
  plus2sd: number;
  plus3sd: number;
  minus1sd: number;
  minus2sd: number;
  minus3sd: number;
  hasViolation: boolean;
  violationSeverity?: QcViolationSeverity;
}
