import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as equipmentApi from "@/api/equipment";
import { EquipmentManagementPage } from "./EquipmentManagementPage";

vi.mock("@/api/equipment", () => ({
  ApiError: class ApiError extends Error {},
  getBuildings: vi.fn(),
  getSensors: vi.fn(),
  saveBuilding: vi.fn(),
  saveSensor: vi.fn(),
  deleteBuilding: vi.fn(),
  deleteSensor: vi.fn(),
  setSensorStatus: vi.fn(),
}));

const building: equipmentApi.Building = {
  id: "building-1",
  name: "North Wing",
  location: "Campus",
  description: null,
  createdAt: "2026-01-01T00:00:00Z",
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EquipmentManagementPage />
    </QueryClientProvider>,
  );
}

describe("EquipmentManagementPage", () => {
  beforeEach(() => {
    vi.mocked(equipmentApi.getBuildings).mockResolvedValue([building]);
    vi.mocked(equipmentApi.getSensors).mockResolvedValue([]);
    vi.mocked(equipmentApi.saveBuilding).mockResolvedValue(building);
    vi.mocked(equipmentApi.saveSensor).mockResolvedValue({
      id: "sensor-1",
      name: "Main power",
      type: "POWER",
      buildingId: building.id,
      status: "ACTIVE",
      consumptionThreshold: 10,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("loads buildings from the API and submits a new building", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("tab", { name: /Bâtiments/ }));
    expect(await screen.findByText("North Wing")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter un bâtiment" }),
    );

    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "East Wing" },
    });
    fireEvent.change(screen.getByLabelText("Emplacement"), {
      target: { value: "Campus East" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() =>
      expect(equipmentApi.saveBuilding).toHaveBeenCalledWith(
        { name: "East Wing", location: "Campus East", description: null },
        undefined,
      ),
    );
  });
});
