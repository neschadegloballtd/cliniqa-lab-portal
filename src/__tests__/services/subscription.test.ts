import { subscriptionService } from "@/services/subscription";
import api from "@/lib/api";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("subscriptionService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getStatus calls GET /lab/v1/subscription/status", async () => {
    const status = {
      tier: "BASIC",
      subscriptionStatus: "ACTIVE",
      billingCycle: "MONTHLY",
      currentPeriodEnd: "2026-04-12T00:00:00Z",
      inTrial: false,
      trialEndDate: null,
      cancelAtPeriodEnd: false,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: status } });
    const res = await subscriptionService.getStatus();
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/subscription/status");
    expect(res.data?.tier).toBe("BASIC");
    expect(res.data?.subscriptionStatus).toBe("ACTIVE");
    expect(res.data?.cancelAtPeriodEnd).toBe(false);
  });

  it("getStatus returns TRIAL status for a lab in trial", async () => {
    const status = {
      tier: "FREE",
      subscriptionStatus: "TRIAL",
      billingCycle: null,
      currentPeriodEnd: null,
      inTrial: true,
      trialEndDate: "2026-04-11T00:00:00Z",
      cancelAtPeriodEnd: false,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: status } });
    const res = await subscriptionService.getStatus();
    expect(res.data?.inTrial).toBe(true);
    expect(res.data?.trialEndDate).toBe("2026-04-11T00:00:00Z");
    expect(res.data?.subscriptionStatus).toBe("TRIAL");
  });

  it("initialize posts to /lab/v1/subscription/initialize with tier and billingCycle", async () => {
    const response = {
      authorizationUrl: "https://checkout.paystack.com/abc123",
      reference: "ref_abc123",
    };
    mockedApi.post.mockResolvedValueOnce({ data: { data: response } });
    const res = await subscriptionService.initialize({
      tier: "BASIC",
      billingCycle: "MONTHLY",
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/lab/v1/subscription/initialize",
      { tier: "BASIC", billingCycle: "MONTHLY" },
    );
    expect(res.data?.authorizationUrl).toBe("https://checkout.paystack.com/abc123");
    expect(res.data?.reference).toBe("ref_abc123");
  });

  it("initialize works for annual PREMIUM_B2B", async () => {
    const response = {
      authorizationUrl: "https://checkout.paystack.com/xyz789",
      reference: "ref_xyz789",
    };
    mockedApi.post.mockResolvedValueOnce({ data: { data: response } });
    const res = await subscriptionService.initialize({
      tier: "PREMIUM_B2B",
      billingCycle: "ANNUAL",
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/lab/v1/subscription/initialize",
      { tier: "PREMIUM_B2B", billingCycle: "ANNUAL" },
    );
    expect(res.data?.authorizationUrl).toContain("paystack");
  });

  it("verify calls GET /lab/v1/subscription/verify with reference param", async () => {
    const response = {
      success: true,
      tier: "BASIC",
      subscriptionStatus: "ACTIVE",
      message: "Subscription activated",
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: response } });
    const res = await subscriptionService.verify("ref_abc123");
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/subscription/verify", {
      params: { reference: "ref_abc123" },
    });
    expect(res.data?.success).toBe(true);
    expect(res.data?.tier).toBe("BASIC");
  });

  it("verify returns success=false for failed payment", async () => {
    const response = {
      success: false,
      tier: "FREE",
      subscriptionStatus: "NONE",
      message: "Payment was not successful",
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: response } });
    const res = await subscriptionService.verify("ref_failed");
    expect(res.data?.success).toBe(false);
    expect(res.data?.message).toBe("Payment was not successful");
  });

  it("cancel posts to /lab/v1/subscription/cancel", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: null } });
    await subscriptionService.cancel();
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/subscription/cancel");
  });

  it("getStatus returns EXPIRED status", async () => {
    const status = {
      tier: "FREE",
      subscriptionStatus: "EXPIRED",
      billingCycle: null,
      currentPeriodEnd: "2026-03-01T00:00:00Z",
      inTrial: false,
      trialEndDate: null,
      cancelAtPeriodEnd: false,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: status } });
    const res = await subscriptionService.getStatus();
    expect(res.data?.subscriptionStatus).toBe("EXPIRED");
  });

  it("getStatus returns cancelAtPeriodEnd=true when subscription is scheduled for cancel", async () => {
    const status = {
      tier: "BASIC",
      subscriptionStatus: "ACTIVE",
      billingCycle: "ANNUAL",
      currentPeriodEnd: "2027-03-12T00:00:00Z",
      inTrial: false,
      trialEndDate: null,
      cancelAtPeriodEnd: true,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: status } });
    const res = await subscriptionService.getStatus();
    expect(res.data?.cancelAtPeriodEnd).toBe(true);
    expect(res.data?.billingCycle).toBe("ANNUAL");
  });
});
