"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import {
  useLabAuthStore,
  saveRefreshToken,
  saveSessionCookie,
} from "@/store/lab-auth.store";
import type {
  RegisterLabRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types/auth";

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: RegisterLabRequest) => authService.register(body),
    onSuccess: (_, variables) => {
      toast.success("Registration successful! Check your email for the OTP.");
      router.push(`/verify-otp?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Registration failed. Please try again.");
      toast.error(message);
    },
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: VerifyOtpRequest) => authService.verifyOtp(body),
    onSuccess: (_, variables) => {
      toast.success("Email verified! Your account is pending approval.");
      router.push(`/pending-approval?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "OTP verification failed.");
      toast.error(message);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (body: ResendOtpRequest) => authService.resendOtp(body),
    onSuccess: () => toast.success("OTP resent. Check your email."),
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Failed to resend OTP.");
      toast.error(message);
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const setAuth = useLabAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: LoginRequest) => authService.login(body),
    onSuccess: ({ data }) => {
      const payload = data.data!;
      const { lab, accessToken, refreshToken } = payload;

      setAuth({
        accessToken,
        labId: lab.labId,
        labName: lab.labName,
        email: lab.email,
        tier: lab.tier,
        status: lab.status,
        inTrial: lab.inTrial,
        trialEndDate: lab.trialEndDate,
      });

      saveRefreshToken(refreshToken);
      saveSessionCookie(lab.labId, lab.tier, lab.status);

      if (lab.status === "PENDING_VERIFICATION") {
        router.push("/pending-approval");
        return;
      }

      toast.success(`Welcome back, ${lab.labName}!`);
      router.push("/dashboard");
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Login failed. Check your credentials.");
      toast.error(message);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordRequest) => authService.forgotPassword(body),
    onSuccess: () =>
      toast.success("If that email exists, a reset link has been sent."),
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Failed to send reset link.");
      toast.error(message);
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => authService.resetPassword(body),
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      router.push("/login");
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err, "Password reset failed.");
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearAuth = useLabAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      router.push("/login");
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response
  ) {
    const data = (err.response as { data?: { error?: { message?: string } } }).data;
    return data?.error?.message ?? fallback;
  }
  return fallback;
}
