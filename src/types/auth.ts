export type LabTier = "FREE" | "BASIC" | "PREMIUM_B2B";

export type LabStatus =
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED";

export interface LabAccount {
  labId: string;
  labName: string;
  email: string;
  phone: string;
  tier: LabTier;
  status: LabStatus;
  inTrial: boolean;
  trialEndDate: string | null;
}

export interface LabAuthResponse {
  accessToken: string;
  refreshToken: string;
  lab: LabAccount;
}

export interface LabRefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface LabAuthState {
  accessToken: string | null;
  labId: string | null;
  labName: string | null;
  email: string | null;
  tier: LabTier | null;
  status: LabStatus | null;
  inTrial: boolean;
  trialEndDate: string | null;
  isAuthenticated: boolean;

  setAuth: (payload: {
    accessToken: string;
    labId: string;
    labName: string;
    email: string;
    tier: LabTier;
    status: LabStatus;
    inTrial: boolean;
    trialEndDate: string | null;
  }) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

// ── Request / Response DTOs ───────────────────────────────────────────────

export interface RegisterLabRequest {
  labName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  state: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
