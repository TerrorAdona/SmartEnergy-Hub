import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as equipmentApi from "@/api/equipment";
import * as measurementsApi from "@/api/measurements";
import { MeasurementsPage } from "./MeasurementsPage";

vi.mock("@/api/equipment", () => ({
  ApiError: class ApiError extends Error {},
  getSensors: vi.fn(),
}));

vi.mock("@/api/measurements", () => ({
  getMeasurements: vi.fn(),
}));

const sensor: equipmentApi.Sensor = {
  id: "sensor-1",
  name: "Main meter",
  type: "POWER",
  buildingId: "building-1",
  status: "ACTIVE",
  consumptionThreshold: 40,
  createdAt: "2026-01-01T00:00:00Z",
};

const measurement: measurementsApi.EnergyMeasurement = {
  measurementId: "measurement-1",
  sensorId: sensor.id,
  timestamp: "2026-11-06T10:00:00Z",
  powerKw: 12.345,
  voltage: 230.5,
  temperature: 22.4,
};

describe("MeasurementsPage", () => {
  beforeEach(() => {
    vi.mocked(equipmentApi.getSensors).mockResolvedValue([sensor]);
    vi.mocked(measurementsApi.getMeasurements).mockResolvedValue([measurement]);
  });

  it("shows API measurements and refetches when the sensor filter changes", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MeasurementsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findAllByText("Main meter")).toHaveLength(2);
    expect(screen.getByText("12.345")).toBeInTheDocument();
    expect(screen.getByText("230.50")).toBeInTheDocument();
    expect(screen.getByText("22.4 °C")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Capteur"), {
      target: { value: sensor.id },
    });
    await waitFor(() =>
      expect(measurementsApi.getMeasurements).toHaveBeenLastCalledWith(
        expect.objectContaining({ sensorId: sensor.id }),
      ),
    );
  });
});
