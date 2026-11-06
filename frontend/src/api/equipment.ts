export interface Building {
  id: string;
  name: string;
  location: string;
  description: string | null;
  createdAt: string;
}

export type BuildingInput = Omit<Building, "id" | "createdAt">;

export interface Sensor {
  id: string;
  name: string;
  type: string;
  buildingId: string;
  status: "ACTIVE" | "INACTIVE";
  consumptionThreshold: number;
  createdAt: string;
}

export type SensorInput = Omit<Sensor, "id" | "createdAt">;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"
).replace(/\/$/, "");

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message || message;
    } catch {
      // Keep the status-based message for empty or non-JSON error responses.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const getBuildings = () => request<Building[]>("/buildings");

export const saveBuilding = (input: BuildingInput, id?: string) =>
  request<Building>(
    id ? `/buildings/${encodeURIComponent(id)}` : "/buildings",
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    },
  );

export const deleteBuilding = (id: string) =>
  request<void>(`/buildings/${encodeURIComponent(id)}`, { method: "DELETE" });

export const getSensors = (buildingId?: string) => {
  const query = buildingId
    ? `?buildingId=${encodeURIComponent(buildingId)}`
    : "";
  return request<Sensor[]>(`/sensors${query}`);
};

export const saveSensor = (input: SensorInput, id?: string) =>
  request<Sensor>(id ? `/sensors/${encodeURIComponent(id)}` : "/sensors", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(input),
  });

export const setSensorStatus = (id: string, status: Sensor["status"]) =>
  request<Sensor>(`/sensors/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteSensor = (id: string) =>
  request<void>(`/sensors/${encodeURIComponent(id)}`, { method: "DELETE" });
