import { useLabAuthStore, isLabAccessActive } from "@/store/lab-auth.store";

// Reset store between tests
beforeEach(() => {
  useLabAuthStore.setState({
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
});

describe("useLabAuthStore", () => {
  it("sets auth state on setAuth", () => {
    useLabAuthStore.getState().setAuth({
      accessToken: "tok_abc",
      labId: "lab-1",
      labName: "Sunrise Lab",
      email: "lab@example.com",
      tier: "BASIC",
      status: "APPROVED",
      inTrial: false,
      trialEndDate: null,
    });

    const state = useLabAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("tok_abc");
    expect(state.labName).toBe("Sunrise Lab");
    expect(state.tier).toBe("BASIC");
  });

  it("updates accessToken without changing other fields", () => {
    useLabAuthStore.getState().setAuth({
      accessToken: "old_token",
      labId: "lab-1",
      labName: "Sunrise Lab",
      email: "lab@example.com",
      tier: "FREE",
      status: "APPROVED",
      inTrial: true,
      trialEndDate: "2099-01-01T00:00:00Z",
    });

    useLabAuthStore.getState().setAccessToken("new_token");

    const state = useLabAuthStore.getState();
    expect(state.accessToken).toBe("new_token");
    expect(state.labName).toBe("Sunrise Lab");
    expect(state.isAuthenticated).toBe(true);
  });

  it("clears all auth fields on clearAuth", () => {
    useLabAuthStore.getState().setAuth({
      accessToken: "tok_abc",
      labId: "lab-1",
      labName: "Sunrise Lab",
      email: "lab@example.com",
      tier: "PREMIUM_B2B",
      status: "APPROVED",
      inTrial: false,
      trialEndDate: null,
    });

    useLabAuthStore.getState().clearAuth();

    const state = useLabAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.labId).toBeNull();
    expect(state.tier).toBeNull();
  });
});

describe("isLabAccessActive", () => {
  it("returns true when APPROVED and not in trial (paid subscription)", () => {
    expect(isLabAccessActive({ status: "APPROVED", inTrial: false, trialEndDate: null })).toBe(true);
  });

  it("returns true when APPROVED and in trial with future end date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(isLabAccessActive({ status: "APPROVED", inTrial: true, trialEndDate: future })).toBe(true);
  });

  it("returns false when APPROVED but trial has expired", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isLabAccessActive({ status: "APPROVED", inTrial: true, trialEndDate: past })).toBe(false);
  });

  it("returns false when status is PENDING_VERIFICATION", () => {
    expect(isLabAccessActive({ status: "PENDING_VERIFICATION", inTrial: false, trialEndDate: null })).toBe(false);
  });

  it("returns false when status is SUSPENDED", () => {
    expect(isLabAccessActive({ status: "SUSPENDED", inTrial: false, trialEndDate: null })).toBe(false);
  });

  it("returns false when status is REJECTED", () => {
    expect(isLabAccessActive({ status: "REJECTED", inTrial: false, trialEndDate: null })).toBe(false);
  });
});
