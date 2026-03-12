import { qaService } from "@/services/qa";
import api from "@/lib/api";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("qaService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getOverview calls GET /lab/v1/qa/overview", async () => {
    const overview = {
      totalReportsPublished: 42,
      totalReportsPending: 3,
      totalBookings: 18,
      avgTurnaroundHours: 6.5,
      flaggedResultsCount: 2,
      preAnalyticalErrorsCount: 1,
      rejectionRatePercent: 4.8,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: overview } });
    const res = await qaService.getOverview();
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/qa/overview");
    expect(res.data?.totalReportsPublished).toBe(42);
    expect(res.data?.avgTurnaroundHours).toBe(6.5);
  });

  it("getTurnaround calls GET /lab/v1/qa/turnaround", async () => {
    const turnaround = [
      { date: "2026-03-01", avgHours: 5.2 },
      { date: "2026-03-02", avgHours: 7.1 },
    ];
    mockedApi.get.mockResolvedValueOnce({ data: { data: turnaround } });
    const res = await qaService.getTurnaround();
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/qa/turnaround");
    expect(res.data).toHaveLength(2);
    expect(res.data?.[0].date).toBe("2026-03-01");
    expect(res.data?.[1].avgHours).toBe(7.1);
  });

  it("getRejectionRates calls GET /lab/v1/qa/rejection-rates", async () => {
    const rates = [
      { reason: "HAEMOLYSED", count: 5, percent: 35.7 },
      { reason: "CLOTTED", count: 3, percent: 21.4 },
      { reason: "INSUFFICIENT_VOLUME", count: 2, percent: 14.3 },
    ];
    mockedApi.get.mockResolvedValueOnce({ data: { data: rates } });
    const res = await qaService.getRejectionRates();
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/qa/rejection-rates");
    expect(res.data).toHaveLength(3);
    expect(res.data?.[0].reason).toBe("HAEMOLYSED");
    expect(res.data?.[0].percent).toBe(35.7);
  });

  it("getVolumes calls GET /lab/v1/qa/volumes", async () => {
    const volumes = [
      { date: "2026-03-01", bookings: 10, reports: 8 },
      { date: "2026-03-02", bookings: 15, reports: 12 },
    ];
    mockedApi.get.mockResolvedValueOnce({ data: { data: volumes } });
    const res = await qaService.getVolumes();
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/qa/volumes");
    expect(res.data).toHaveLength(2);
    expect(res.data?.[0].bookings).toBe(10);
    expect(res.data?.[1].reports).toBe(12);
  });

  it("getOverview returns zero values correctly", async () => {
    const overview = {
      totalReportsPublished: 0,
      totalReportsPending: 0,
      totalBookings: 0,
      avgTurnaroundHours: 0,
      flaggedResultsCount: 0,
      preAnalyticalErrorsCount: 0,
      rejectionRatePercent: 0,
    };
    mockedApi.get.mockResolvedValueOnce({ data: { data: overview } });
    const res = await qaService.getOverview();
    expect(res.data?.rejectionRatePercent).toBe(0);
    expect(res.data?.flaggedResultsCount).toBe(0);
  });

  it("getRejectionRates handles empty array", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    const res = await qaService.getRejectionRates();
    expect(res.data).toHaveLength(0);
  });

  it("getTurnaround handles single data point", async () => {
    const turnaround = [{ date: "2026-03-12", avgHours: 3.0 }];
    mockedApi.get.mockResolvedValueOnce({ data: { data: turnaround } });
    const res = await qaService.getTurnaround();
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].avgHours).toBe(3.0);
  });

  it("getVolumes handles single data point", async () => {
    const volumes = [{ date: "2026-03-12", bookings: 0, reports: 1 }];
    mockedApi.get.mockResolvedValueOnce({ data: { data: volumes } });
    const res = await qaService.getVolumes();
    expect(res.data?.[0].reports).toBe(1);
    expect(res.data?.[0].bookings).toBe(0);
  });
});
