import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getSensors, setSensorStatus } from "./equipment";

const fetchMock = vi.fn();

describe("equipment API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads sensors filtered by the associated building", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await getSensors("building/1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/sensors?buildingId=building%2F1"),
      expect.any(Object),
    );
  });

  it("sends sensor activation changes with PATCH and parses API errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "sensor-1", status: "INACTIVE" }),
    });

    await setSensorStatus("sensor-1", "INACTIVE");

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/sensors/sensor-1/status"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "INACTIVE" }),
      }),
    );

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: "Building is still in use" }),
    });

    await expect(setSensorStatus("sensor-1", "ACTIVE")).rejects.toEqual(
      new ApiError("Building is still in use", 409),
    );
  });
});
