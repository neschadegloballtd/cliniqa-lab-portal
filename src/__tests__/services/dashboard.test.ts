import api from "@/lib/api";
import { dashboardService } from "@/services/dashboard";

jest.mock("@/lib/api");
const mockApi = api as jest.Mocked<typeof api>;

describe("dashboardService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getOverview", () => {
    it("calls GET /lab/v1/dashboard/overview", async () => {
      const overview = { totalBookingsToday: 5, pendingFlagsCount: 2, unresolvedPreAnalyticalCount: 1 };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: overview } });
      const result = await dashboardService.getOverview();
      expect(mockApi.get).toHaveBeenCalledWith("/lab/v1/dashboard/overview");
      expect(result.data.data).toEqual(overview);
    });
  });

  describe("getRecentActivity", () => {
    it("calls GET /lab/v1/dashboard/activity", async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: [] } });
      await dashboardService.getRecentActivity();
      expect(mockApi.get).toHaveBeenCalledWith("/lab/v1/dashboard/activity");
    });
  });
});
