import api from "@/lib/api";
import { profileService } from "@/services/profile";

jest.mock("@/lib/api");
const mockApi = api as jest.Mocked<typeof api>;

const mockProfile = {
  labId: "lab-1",
  labName: "Sunrise Lab",
  email: "lab@example.com",
  phone: "+2348011111111",
  address: "12 Test St",
  city: "Lagos",
  state: "Lagos",
  latitude: null,
  longitude: null,
  accreditationNumber: null,
  description: null,
  website: null,
  logoUrl: null,
};

describe("profileService", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getProfile", () => {
    it("calls GET /lab/v1/profile", async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: mockProfile } });
      const result = await profileService.getProfile();
      expect(mockApi.get).toHaveBeenCalledWith("/lab/v1/profile");
      expect(result.data.data).toEqual(mockProfile);
    });
  });

  describe("updateProfile", () => {
    it("calls PUT /lab/v1/profile with body", async () => {
      const update = { labName: "New Name", phone: "+2348022222222", address: "5 New St", city: "Abuja", state: "FCT" };
      (mockApi.put as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: { ...mockProfile, ...update } } });
      await profileService.updateProfile(update);
      expect(mockApi.put).toHaveBeenCalledWith("/lab/v1/profile", update);
    });
  });

  describe("getTestMenu", () => {
    it("calls GET /lab/v1/profile/test-menu", async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: [] } });
      await profileService.getTestMenu();
      expect(mockApi.get).toHaveBeenCalledWith("/lab/v1/profile/test-menu");
    });
  });

  describe("createTestMenuItem", () => {
    it("calls POST /lab/v1/profile/test-menu", async () => {
      const item = { testName: "FBC", testCategory: "Haematology", priceKobo: 500000, turnaroundHours: 24, sampleType: "Blood" };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: { id: "t1", ...item, isActive: true } } });
      await profileService.createTestMenuItem(item);
      expect(mockApi.post).toHaveBeenCalledWith("/lab/v1/profile/test-menu", item);
    });
  });

  describe("updateTestMenuItem", () => {
    it("calls PATCH /lab/v1/profile/test-menu/:id", async () => {
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: {} } });
      await profileService.updateTestMenuItem("t1", { isActive: false });
      expect(mockApi.patch).toHaveBeenCalledWith("/lab/v1/profile/test-menu/t1", { isActive: false });
    });
  });

  describe("deleteTestMenuItem", () => {
    it("calls DELETE /lab/v1/profile/test-menu/:id", async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
      await profileService.deleteTestMenuItem("t1");
      expect(mockApi.delete).toHaveBeenCalledWith("/lab/v1/profile/test-menu/t1");
    });
  });

  describe("getOperatingHours", () => {
    it("calls GET /lab/v1/profile/operating-hours", async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: [] } });
      await profileService.getOperatingHours();
      expect(mockApi.get).toHaveBeenCalledWith("/lab/v1/profile/operating-hours");
    });
  });

  describe("updateOperatingHours", () => {
    it("calls PUT /lab/v1/profile/operating-hours with body", async () => {
      const hours = [{ dayOfWeek: 1 as const, opensAt: "08:00", closesAt: "17:00", isClosed: false }];
      (mockApi.put as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: hours } });
      await profileService.updateOperatingHours(hours);
      expect(mockApi.put).toHaveBeenCalledWith("/lab/v1/profile/operating-hours", hours);
    });
  });

  describe("getVerificationDocs", () => {
    it("calls GET /lab/v1/verification/documents", async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { status: "success", data: [] } });
      await profileService.getVerificationDocs();
      expect(mockApi.get).toHaveBeenCalledWith("/lab/v1/verification/documents");
    });
  });

  describe("deleteVerificationDoc", () => {
    it("calls DELETE /lab/v1/verification/documents/:docId", async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({ data: { status: "success" } });
      await profileService.deleteVerificationDoc("doc-1");
      expect(mockApi.delete).toHaveBeenCalledWith("/lab/v1/verification/documents/doc-1");
    });
  });
});
