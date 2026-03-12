import { resultsService } from "@/services/results";
import api from "@/lib/api";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("resultsService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pushManual posts to /lab/v1/results/push", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { pushJobId: "abc", statusUrl: "/..." } } });
    const res = await resultsService.pushManual({
      patientPhone: "+2348000000000",
      results: [{ testName: "HB", measuredValue: "12.5" }],
    });
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/results/push", expect.any(Object));
    expect(res.data?.pushJobId).toBe("abc");
  });

  it("getPushStatus polls /push-status/:jobId", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { pushJobId: "abc", status: "SAVED" } } });
    const res = await resultsService.getPushStatus("abc");
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/results/push-status/abc");
    expect(res.data?.status).toBe("SAVED");
  });

  it("pushPdf sends multipart form data", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { reportId: "r1", statusUrl: "/..." } } });
    const file = new File(["pdf bytes"], "result.pdf", { type: "application/pdf" });
    const res = await resultsService.pushPdf(file, { patientPhone: "+2348000000000" });
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/lab/v1/results/push/file",
      expect.any(FormData),
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(res.data?.reportId).toBe("r1");
  });

  it("parseCsv sends multipart form data with fileType=CSV", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { data: { rows: [], parseErrors: [] } },
    });
    const file = new File(["csv data"], "results.csv", { type: "text/csv" });
    await resultsService.parseCsv(file);
    const formArg = mockedApi.post.mock.calls[0][1] as FormData;
    expect(formArg.get("fileType")).toBe("CSV");
  });

  it("getOcrStatus calls /:reportId/ocr-status", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: { reportId: "r1", processingStatus: "EXTRACTED" } },
    });
    const res = await resultsService.getOcrStatus("r1");
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/results/r1/ocr-status");
    expect(res.data?.processingStatus).toBe("EXTRACTED");
  });

  it("downloadTemplate calls template.csv with blob response type", async () => {
    const blob = new Blob(["csv"], { type: "text/csv" });
    mockedApi.get.mockResolvedValueOnce({ data: blob });
    const res = await resultsService.downloadTemplate();
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/results/template.csv", {
      responseType: "blob",
    });
    expect(res).toBe(blob);
  });

  it("listReports calls GET /lab/v1/results with page params", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: [], totalPages: 0 } } });
    await resultsService.listReports(2, 10);
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/results", { params: { page: 2, size: 10 } });
  });

  it("getReport calls /:reportId", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { reportId: "r1", results: [] } } });
    const res = await resultsService.getReport("r1");
    expect(mockedApi.get).toHaveBeenCalledWith("/lab/v1/results/r1");
    expect(res.data?.reportId).toBe("r1");
  });

  it("updateRow calls PATCH /:reportId/rows/:resultId", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "row1" } } });
    const res = await resultsService.updateRow("r1", "row1", { measuredValue: "14.0" });
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/lab/v1/results/r1/rows/row1",
      { measuredValue: "14.0" }
    );
    expect(res.data?.id).toBe("row1");
  });

  it("confirmPush posts to /:reportId/confirm", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { status: "success" } });
    await resultsService.confirmPush("r1");
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/results/r1/confirm");
  });

  it("publishReport posts to /:reportId/publish", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { status: "success" } });
    await resultsService.publishReport("r1");
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/results/r1/publish");
  });

  it("overrideFlag posts to /:reportId/flag-override", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { status: "success" } });
    await resultsService.overrideFlag("r1", {
      reviewerNotes: "Looks normal to me",
      decision: "REVIEWED_NORMAL",
    });
    expect(mockedApi.post).toHaveBeenCalledWith("/lab/v1/results/r1/flag-override", {
      reviewerNotes: "Looks normal to me",
      decision: "REVIEWED_NORMAL",
    });
  });
});
