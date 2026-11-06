import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as alertsApi from "@/api/alerts";
import * as equipmentApi from "@/api/equipment";
import { AlertsPage } from "./AlertsPage";

vi.mock("@/api/alerts", () => ({
  acknowledgeAlert: vi.fn(),
  getAlerts: vi.fn(),
}));
vi.mock("@/api/equipment", () => ({
  ApiError: class ApiError extends Error {},
  getBuildings: vi.fn(),
  getSensors: vi.fn(),
}));

const alert: alertsApi.EnergyAlert = {
  id: "alert-1",
  measurementId: "measurement-1",
  sensorId: "sensor-1",
  sensorName: "Main power",
  buildingId: "building-1",
  buildingName: "North Wing",
  type: "POWER_THRESHOLD",
  observedValue: 45,
  threshold: 40,
  createdAt: "2026-11-06T10:00:00Z",
  status: "ACTIVE",
  acknowledgedAt: null,
  acknowledgedBy: null,
};

describe("AlertsPage", () => {
  beforeEach(() => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([alert]);
    vi.mocked(alertsApi.acknowledgeAlert).mockResolvedValue({
      ...alert,
      status: "ACKNOWLEDGED",
      acknowledgedBy: "operator",
    });
    vi.mocked(equipmentApi.getSensors).mockResolvedValue([]);
    vi.mocked(equipmentApi.getBuildings).mockResolvedValue([
      {
        id: "building-1",
        name: "North Wing",
        location: "Campus",
        description: null,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("loads alerts, applies building filters and acknowledges after confirmation", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AlertsPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Seuil de puissance")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Bâtiment"), {
      target: { value: "building-1" },
    });
    await waitFor(() =>
      expect(alertsApi.getAlerts).toHaveBeenLastCalledWith(
        expect.objectContaining({ buildingId: "building-1" }),
      ),
    );
    expect(await screen.findByText("Seuil de puissance")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Acquitter alert-1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmer l’acquittement" }),
    );
    await waitFor(() =>
      expect(alertsApi.acknowledgeAlert).toHaveBeenCalledWith("alert-1"),
    );
  });
});
