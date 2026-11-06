import { request } from "./equipment";

export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED";

export interface EnergyAlert {
  id: string;
  measurementId: string;
  sensorId: string;
  sensorName: string;
  buildingId: string;
  buildingName: string;
  type: string;
  observedValue: number;
  threshold: number;
  createdAt: string;
  status: AlertStatus;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

export interface AlertQuery {
  status?: AlertStatus;
  type?: string;
  sensorId?: string;
  buildingId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function getAlerts(query: AlertQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.size ? `?${params.toString()}` : "";
  return request<EnergyAlert[]>(`/alerts${suffix}`);
}

export const acknowledgeAlert = (id: string, acknowledgedBy = "operator") =>
  request<EnergyAlert>(`/alerts/${encodeURIComponent(id)}/acknowledge`, {
    method: "PATCH",
    body: JSON.stringify({ acknowledgedBy }),
  });