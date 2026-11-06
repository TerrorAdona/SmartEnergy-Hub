import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalyticsSummary } from "./analytics";

const fetchMock = vi.fn();

describe("analytics API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("requests measured aggregation and comparison periods", async () => {
    await getAnalyticsSummary({
      from: "2026-11-06T00:00:00Z",
      to: "2026-11-06T12:00:00Z",
      interval: "HOUR",
      compareFrom: "2026-11-05T12:00:00Z",
      compareTo: "2026-11-06T00:00:00Z",
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    const params = new URL(url).searchParams;
    expect(params.get("interval")).toBe("HOUR");
    expect(params.get("compareFrom")).toBe("2026-11-05T12:00:00Z");
    expect(params.get("compareTo")).toBe("2026-11-06T00:00:00Z");
  });
});
