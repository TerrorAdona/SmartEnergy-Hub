import { request } from "./equipment";

export interface EnergyMeasurement {
  measurementId: string;
  sensorId: string;
  timestamp: string;
  powerKw: number;
  voltage: number;
  temperature: number;
}

export interface MeasurementQuery {
  sensorId?: string;
  from: string;
  to: string;
}

export function getMeasurements(query: MeasurementQuery) {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.sensorId) params.set("sensorId", query.sensorId);
  return request<EnergyMeasurement[]>(`/measurements?${params.toString()}`);
}
