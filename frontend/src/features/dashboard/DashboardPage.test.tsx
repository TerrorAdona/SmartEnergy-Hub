import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as analyticsApi from "@/api/analytics";
import * as alertsApi from "@/api/alerts";
import { DashboardPage } from "./DashboardPage";

vi.mock("@/api/analytics", () => ({ getAnalyticsSummary: vi.fn() }));
vi.mock("@/api/alerts", () => ({ getAlerts: vi.fn() }));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(analyticsApi.getAnalyticsSummary).mockResolvedValue({
      from: "2026-11-05T00:00:00Z",
      to: "2026-11-06T00:00:00Z",
      interval: "HOUR",
      buildingCount: 2,
      activeSensorCount: 3,
      totalEnergyKwh: 12.5,
      averagePowerKw: 2.5,
      timeline: [
        {
          bucketStart: "2026-11-05T10:00:00Z",
          energyKwh: 1.2,
          averagePowerKw: 2.4,
          measurementCount: 2,
        },
      ],
      byBuilding: [
        {
          id: "building-1",
          name: "North Wing",
          energyKwh: 12.5,
          averagePowerKw: 2.5,
          measurementCount: 10,
        },
      ],
      bySensor: [],
      comparison: {
        currentEnergyKwh: 12.5,
        previousEnergyKwh: 10,
        changePercent: 25,
      },
      recentMeasurements: [
        {
          measurementId: "measurement-1",
          sensorId: "sensor-1",
          timestamp: "2026-11-05T10:00:00Z",
          powerKw: 2.5,
          voltage: 230,
          temperature: 22,
        },
      ],
    });
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);
  });

  it("renders real analytics values and recent measurements from the API", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <DashboardPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findAllByText(/12[,.]5 kWh/)).not.toHaveLength(0);
    expect(screen.getByText("North Wing")).toBeInTheDocument();
    expect(screen.getByText("sensor-1")).toBeInTheDocument();
    expect(analyticsApi.getAnalyticsSummary).toHaveBeenCalledWith(
      expect.objectContaining({ interval: "HOUR" }),
    );
  });
});
