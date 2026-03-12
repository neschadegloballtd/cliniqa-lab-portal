import { preAnalyticalService } from "@/services/pre-analytical";
import api from "@/lib/api";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("preAnalyticalService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("list with ALL filter sends no resolved param", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [] } } });
    await preAnalyticalService.list({ filter: "ALL", page: 0 });
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/pre-analytical", {
      params: { page: 0 },
    });
  });

  it("list with UNRESOLVED filter sends resolved=false", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [] } } });
    await preAnalyticalService.list({ filter: "UNRESOLVED" });
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/pre-analytical", {
      params: { resolved: false },
    });
  });

  it("list with RESOLVED filter sends resolved=true", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [] } } });
    await preAnalyticalService.list({ filter: "RESOLVED", page: 1 });
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/pre-analytical", {
      params: { resolved: true, page: 1 },
    });
  });

  it("get calls GET /lab/v1/pre-analytical/:id", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { id: "pa1", resolved: false } } });
    const res = await preAnalyticalService.get("pa1");
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/pre-analytical/pa1");
    expect(res.data?.id).toBe("pa1");
  });

  it("log posts to /lab/v1/pre-analytical", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { id: "pa2" } } });
    const res = await preAnalyticalService.log({
      rejectionReason: "HAEMOLYSED",
      sampleType: "EDTA Blood",
      testName: "FBC",
    });
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/pre-analytical", expect.objectContaining({
      rejectionReason: "HAEMOLYSED",
      sampleType: "EDTA Blood",
      testName: "FBC",
    }));
    expect(res.data?.id).toBe("pa2");
  });

  it("resolve patches /:id/resolve with notes", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "pa1", resolved: true } } });
    const res = await preAnalyticalService.resolve("pa1", {
      resolutionNotes: "Patient recollected sample",
    });
    expect(mockedApi.patch).toHaveBeenCalledWith("/lab/v1/pre-analytical/pa1/resolve", {
      resolutionNotes: "Patient recollected sample",
    });
    expect(res.data?.resolved).toBe(true);
  });

  it("notifyPatient posts to /:id/notify-patient", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { id: "pa1", patientNotified: true } } });
    const res = await preAnalyticalService.notifyPatient("pa1");
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/pre-analytical/pa1/notify-patient");
    expect(res.data?.patientNotified).toBe(true);
  });
});
