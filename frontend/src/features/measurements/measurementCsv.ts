import type { EnergyMeasurement } from "@/api/measurements";

export function measurementsToCsv(
  measurements: EnergyMeasurement[],
  sensorNameById: Map<string, string>,
) {
  const escapeCell = (value: string, text = false) => {
    const safeValue = text && /^[=+@-]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
  };
  const rows = [
    [
      "measurementId",
      "sensorId",
      "sensorName",
      "timestamp",
      "powerKw",
      "voltage",
      "temperature",
    ],
    ...measurements.map((measurement) => [
      escapeCell(measurement.measurementId, true),
      escapeCell(measurement.sensorId, true),
      escapeCell(
        sensorNameById.get(measurement.sensorId) ?? measurement.sensorId,
        true,
      ),
      escapeCell(measurement.timestamp, true),
      escapeCell(String(measurement.powerKw)),
      escapeCell(String(measurement.voltage)),
      escapeCell(String(measurement.temperature)),
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.join(",")).join("\r\n")}`;
}
