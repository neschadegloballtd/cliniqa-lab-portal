"use client";

import { create } from "zustand";
import type { LabAuthState, LabTier, LabStatus } from "@/types/auth";

const REFRESH_TOKEN_KEY = "cliniqa_lab_refresh_token";

export const useLabAuthStore = create<LabAuthState>((set) => ({
  accessToken: null,
  labId: null,
  labName: null,
  email: null,
  tier: null,
  status: null,
  inTrial: false,
  trialEndDate: null,
  isAuthenticated: false,

  setAuth: ({ accessToken, labId, labName, email, tier, status, inTrial, trialEndDate }) => {
    set({ accessToken, labId, labName, email, tier, status, inTrial, trialEndDate, isAuthenticated: true });
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      // Also clear the session cookie used by middleware
      document.cookie = "cliniqa_lab_session=; Max-Age=0; path=/";
    }
    set({
      accessToken: null,
      labId: null,
      labName: null,
      email: null,
      tier: null,
      status: null,
      inTrial: false,
      trialEndDate: null,
      isAuthenticated: false,
    });
  },
}));

/** Persist refresh token to localStorage (called after login) */
export function saveRefreshToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/** Read refresh token from localStorage */
export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/** Set session cookie so middleware can detect auth state (SSR-compatible) */
export function saveSessionCookie(labId: string, tier: LabTier, status: LabStatus) {
  if (typeof window !== "undefined") {
    const payload = btoa(JSON.stringify({ labId, tier, status }));
    // 30 days
    document.cookie = `cliniqa_lab_session=${payload}; Max-Age=${60 * 60 * 24 * 30}; path=/; SameSite=Strict`;
  }
}

/** Check if the lab account has active premium access (trial or active subscription) */
export function isLabAccessActive(state: Pick<LabAuthState, "inTrial" | "trialEndDate" | "status">): boolean {
  if (state.status === "APPROVED") {
    if (state.inTrial && state.trialEndDate) {
      return new Date(state.trialEndDate) > new Date();
    }
    // Non-trial APPROVED = active paid subscription
    return true;
  }
  return false;
}
