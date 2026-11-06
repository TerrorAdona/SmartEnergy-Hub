import { describe, expect, it } from "vitest";
import { measurementsToCsv } from "./measurementCsv";

describe("measurementsToCsv", () => {
  it("exports measurement fields and neutralizes spreadsheet formulas in text cells", () => {
    const csv = measurementsToCsv(
      [
        {
          measurementId: "measurement-1",
          sensorId: "=IMPORTDATA(1)",
          timestamp: "2026-11-06T10:00:00Z",
          powerKw: -1.25,
          voltage: 230,
          temperature: 22.5,
        },
      ],
      new Map([["=IMPORTDATA(1)", "=Sensor"]]),
    );

    expect(csv).toContain('"\'=IMPORTDATA(1)"');
    expect(csv).toContain('"\'=Sensor"');
    expect(csv).toContain('"-1.25","230","22.5"');
  });
});
