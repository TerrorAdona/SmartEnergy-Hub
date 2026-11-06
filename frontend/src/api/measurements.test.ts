import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMeasurements } from "./measurements";

const fetchMock = vi.fn();

describe("measurements API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("requests a period optionally filtered by sensor", async () => {
    await getMeasurements({
      sensorId: "sensor/1",
      from: "2026-11-05T00:00:00Z",
      to: "2026-11-06T00:00:00Z",
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.pathname).toBe("/api/v1/measurements");
    expect(parsedUrl.searchParams.get("sensorId")).toBe("sensor/1");
    expect(parsedUrl.searchParams.get("from")).toBe("2026-11-05T00:00:00Z");
    expect(parsedUrl.searchParams.get("to")).toBe("2026-11-06T00:00:00Z");
  });
});
