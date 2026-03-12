import { bookingsService } from "@/services/bookings";
import api from "@/lib/api";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("bookingsService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("list calls GET /lab/v1/bookings with no params when ALL", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [], totalPages: 0 } } });
    await bookingsService.list({ status: "ALL", page: 0 });
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/bookings", {
      params: { page: 0 },
    });
  });

  it("list passes status param when not ALL", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [] } } });
    await bookingsService.list({ status: "PENDING", page: 1, size: 10 });
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/bookings", {
      params: { status: "PENDING", page: 1, size: 10 },
    });
  });

  it("list passes dateFrom and dateTo", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [] } } });
    await bookingsService.list({ dateFrom: "2026-01-01", dateTo: "2026-01-31" });
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/bookings", {
      params: { dateFrom: "2026-01-01", dateTo: "2026-01-31" },
    });
  });

  it("get calls GET /lab/v1/bookings/:id", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { id: "b1", status: "PENDING" } } });
    const res = await bookingsService.get("b1");
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/bookings/b1");
    expect(res.data?.id).toBe("b1");
  });

  it("create posts to /lab/v1/bookings", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { id: "b2", status: "PENDING" } } });
    const res = await bookingsService.create({
      patientPhone: "+2348000000000",
      testName: "Full Blood Count",
    });
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/bookings", {
      patientPhone: "+2348000000000",
      testName: "Full Blood Count",
    });
    expect(res.data?.id).toBe("b2");
  });

  it("confirm patches /:id/confirm", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "b1", status: "CONFIRMED" } } });
    const res = await bookingsService.confirm("b1");
    expect(mockedApi.patch).toHaveBeenCalledWith("/lab/v1/bookings/b1/confirm");
    expect(res.data?.status).toBe("CONFIRMED");
  });

  it("markSampleCollected patches /:id/sample-collected", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "b1", status: "SAMPLE_COLLECTED" } } });
    await bookingsService.markSampleCollected("b1");
    expect(mockedApi.patch).toHaveBeenCalledWith("/lab/v1/bookings/b1/sample-collected");
  });

  it("complete patches /:id/complete", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "b1", status: "COMPLETED" } } });
    await bookingsService.complete("b1");
    expect(mockedApi.patch).toHaveBeenCalledWith("/lab/v1/bookings/b1/complete");
  });

  it("cancel patches /:id/cancel", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "b1", status: "CANCELLED" } } });
    await bookingsService.cancel("b1");
    expect(mockedApi.patch).toHaveBeenCalledWith("/lab/v1/bookings/b1/cancel");
  });

  it("noShow patches /:id/no-show", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "b1", status: "NO_SHOW" } } });
    await bookingsService.noShow("b1");
    expect(mockedApi.patch).toHaveBeenCalledWith("/lab/v1/bookings/b1/no-show");
  });
});
