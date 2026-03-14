"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LabAuthState, LabTier, LabStatus } from "@/types/auth";

const REFRESH_TOKEN_KEY = "cliniqa_lab_refresh_token";

export const useLabAuthStore = create<LabAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      labId: null,
      labName: null,
      email: null,
      tier: null,
      status: null,
      inTrial: false,
      trialEndDate: null,
      isAuthenticated: false,
      sessionExpired: false,

      setAuth: ({ accessToken, labId, labName, email, tier, status, inTrial, trialEndDate }) => {
        set({ accessToken, labId, labName, email, tier, status, inTrial, trialEndDate, isAuthenticated: true });
      },

      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      setSessionExpired: (expired: boolean) => {
        set({ sessionExpired: expired });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
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
          sessionExpired: false,
        });
      },
    }),
    {
      name: "cliniqa_lab_auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : ({} as Storage)
      ),
      // Only persist identity + tokens, not function references
      partialize: (state) => ({
        accessToken: state.accessToken,
        labId: state.labId,
        labName: state.labName,
        email: state.email,
        tier: state.tier,
        status: state.status,
        inTrial: state.inTrial,
        trialEndDate: state.trialEndDate,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

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
  if (state.status === "ACTIVE") {
    if (state.inTrial && state.trialEndDate) {
      return new Date(state.trialEndDate) > new Date();
    }
    // Non-trial ACTIVE = active paid subscription
    return true;
  }
  return false;
}
