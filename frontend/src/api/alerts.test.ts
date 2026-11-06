import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acknowledgeAlert, getAlerts } from "./alerts";

const fetchMock = vi.fn();

describe("alerts API client", () => {
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

  it("sends server-side filters and acknowledges an alert", async () => {
    await getAlerts({ status: "ACTIVE", buildingId: "building 1", limit: 25 });
    const [listUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    const params = new URL(listUrl).searchParams;
    expect(params.get("status")).toBe("ACTIVE");
    expect(params.get("buildingId")).toBe("building 1");
    expect(params.get("limit")).toBe("25");

    await acknowledgeAlert("alert-1", "operator-1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/alerts/alert-1/acknowledge"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ acknowledgedBy: "operator-1" }),
      }),
    );
  });
});
