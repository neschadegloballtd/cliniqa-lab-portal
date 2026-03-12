import api from "@/lib/api";
import { authService } from "@/services/auth";

jest.mock("@/lib/api");
const mockApi = api as jest.Mocked<typeof api>;

describe("authService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("register calls POST /lab/v1/auth/register", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
    await authService.register({ labName: "Lab A", email: "a@b.com", password: "pass1234", phone: "+2348000000000", city: "Lagos", state: "Lagos" });
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/register", expect.objectContaining({ email: "a@b.com" }));
  });

  it("verifyOtp calls POST /lab/v1/auth/verify-otp", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
    await authService.verifyOtp({ email: "a@b.com", otp: "123456" });
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/verify-otp", { email: "a@b.com", otp: "123456" });
  });

  it("resendOtp calls POST /lab/v1/auth/resend-otp", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
    await authService.resendOtp({ email: "a@b.com" });
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/resend-otp", { email: "a@b.com" });
  });

  it("login calls POST /lab/v1/auth/login", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: { accessToken: "tok", refreshToken: "ref", lab: {} } } });
    await authService.login({ email: "a@b.com", password: "pass1234" });
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/login", { email: "a@b.com", password: "pass1234" });
  });

  it("forgotPassword calls POST /lab/v1/auth/forgot-password", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
    await authService.forgotPassword({ email: "a@b.com" });
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/forgot-password", { email: "a@b.com" });
  });

  it("resetPassword calls POST /lab/v1/auth/reset-password", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
    await authService.resetPassword({ token: "tok123", newPassword: "newpass99" });
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/reset-password", { token: "tok123", newPassword: "newpass99" });
  });

  it("logout calls POST /lab/v1/auth/logout", async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
    await authService.logout();
    expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/auth/logout");
  });
});
