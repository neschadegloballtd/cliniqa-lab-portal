import type { LabTier } from "@/types/auth";

export type BillingCycle = "MONTHLY" | "ANNUAL";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "NONE";

export interface LabSubscriptionStatus {
  tier: LabTier;
  subscriptionStatus: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  currentPeriodEnd: string | null; // ISO datetime
  inTrial: boolean;
  trialEndDate: string | null; // ISO datetime
  cancelAtPeriodEnd: boolean;
}

export interface InitializeSubscriptionRequest {
  tier: Exclude<LabTier, "FREE">;
  billingCycle: BillingCycle;
}

export interface InitializeSubscriptionResponse {
  authorizationUrl: string;
  reference: string;
}

export interface VerifySubscriptionResponse {
  success: boolean;
  tier: LabTier;
  subscriptionStatus: SubscriptionStatus;
  message: string;
}
