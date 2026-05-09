import { describe, expect, it } from "vitest";
import { GoogleMyMapsStationNormalizer } from "../src/worker/normalizers/googleMyMapsStationNormalizer.js";

describe("GoogleMyMapsStationNormalizer", () => {
  it("normalizes station fields from the raw dataset shape", () => {
    const normalizer = new GoogleMyMapsStationNormalizer();
    const result = normalizer.normalize([
      {
        source_index: 1,
        name: "Bãi đỗ xe Nguyễn Văn Cừ ND",
        layer: "ĐANG HOẠT ĐỘNG",
        extendedData: {
          "Địa chỉ:": "Cần Thơ",
          "Trạng thái:": "Đang hoạt động",
          "Ghi chú:": "Cập nhật ngày 26/4/2026"
        },
        coordinates: { lat: 10.000742, lng: 105.717644 }
      }
    ]);

    expect(result.skipped).toBe(0);
    expect(result.stations[0]).toMatchObject({
      provider: "google_my_maps",
      providerStationId: "1",
      name: "Bãi đỗ xe Nguyễn Văn Cừ ND",
      address: "Cần Thơ",
      status: "Đang hoạt động",
      lat: 10.000742,
      lng: 105.717644
    });
    expect(result.stations[0].sourceUpdatedAt?.toISOString()).toBe("2026-04-26T00:00:00.000Z");
  });

  it("skips records without valid coordinates", () => {
    const normalizer = new GoogleMyMapsStationNormalizer();
    const result = normalizer.normalize([{ source_index: 1, name: "Station" }]);
    expect(result).toMatchObject({ stations: [], skipped: 1 });
  });
});
