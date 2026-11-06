import { request } from "./equipment";

export interface SimulationStatus {
  running: boolean;
  intervalSeconds: number;
  activeSensors: number;
  lastPublished: number;
  lastTickAt: string | null;
}

export function getSimulation() {
  return request<SimulationStatus>("/simulation");
}

export function setSimulation(running: boolean) {
  return request<SimulationStatus>("/simulation", {
    method: "PUT",
    body: JSON.stringify({ running }),
  });
}
