import { request } from "./equipment";
import type { EnergyMeasurement } from "./measurements";

export type AggregationInterval = "HOUR" | "DAY" | "MONTH";

export interface EnergyBucket {
  bucketStart: string;
  energyKwh: number | null;
  averagePowerKw: number | null;
  measurementCount: number;
}

export interface EntityEnergySummary {
  id: string;
  name: string;
  energyKwh: number | null;
  averagePowerKw: number | null;
  measurementCount: number;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  interval: AggregationInterval;
  buildingCount: number;
  activeSensorCount: number;
  totalEnergyKwh: number | null;
  averagePowerKw: number | null;
  timeline: EnergyBucket[];
  byBuilding: EntityEnergySummary[];
  bySensor: EntityEnergySummary[];
  comparison: {
    currentEnergyKwh: number | null;
    previousEnergyKwh: number | null;
    changePercent: number | null;
  } | null;
  recentMeasurements: EnergyMeasurement[];
}

export interface AnalyticsQuery {
  from: string;
  to: string;
  interval: AggregationInterval;
  compareFrom?: string;
  compareTo?: string;
}

export function getAnalyticsSummary(query: AnalyticsQuery) {
  const params = new URLSearchParams({
    from: query.from,
    to: query.to,
    interval: query.interval,
  });
  if (query.compareFrom) params.set("compareFrom", query.compareFrom);
  if (query.compareTo) params.set("compareTo", query.compareTo);
  return request<AnalyticsSummary>(`/analytics/summary?${params.toString()}`);
}