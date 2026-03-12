import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  LabAuthResponse,
  RegisterLabRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types/auth";

export const authService = {
  register: (body: RegisterLabRequest) =>
    api.post<ApiResponse<void>>("/lab/v1/auth/register", body),

  verifyOtp: (body: VerifyOtpRequest) =>
    api.post<ApiResponse<void>>("/lab/v1/auth/verify-otp", body),

  resendOtp: (body: ResendOtpRequest) =>
    api.post<ApiResponse<void>>("/lab/v1/auth/resend-otp", body),

  login: (body: LoginRequest) =>
    api.post<ApiResponse<LabAuthResponse>>("/lab/v1/auth/login", body),

  logout: () =>
    api.post<ApiResponse<void>>("/lab/v1/auth/logout"),

  forgotPassword: (body: ForgotPasswordRequest) =>
    api.post<ApiResponse<void>>("/lab/v1/auth/forgot-password", body),

  resetPassword: (body: ResetPasswordRequest) =>
    api.post<ApiResponse<void>>("/lab/v1/auth/reset-password", body),
};
