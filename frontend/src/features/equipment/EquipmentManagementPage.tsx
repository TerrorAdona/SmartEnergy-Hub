import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Edit,
  Plus,
  Power,
  Radio,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  ApiError,
  Building,
  BuildingInput,
  deleteBuilding,
  deleteSensor,
  getBuildings,
  getSensors,
  saveBuilding,
  saveSensor,
  Sensor,
  SensorInput,
  setSensorStatus,
} from "@/api/equipment";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

type EquipmentView = "buildings" | "sensors";
type ModalView = EquipmentView | null;

const sensorTypes = [
  "TEMPERATURE",
  "HUMIDITY",
  "POWER",
  "VOLTAGE",
  "CURRENT",
  "ENERGY",
  "FREQUENCY",
  "POWER_FACTOR",
  "IRRADIANCE",
  "WIND_SPEED",
  "PRESSURE",
  "FLOW",
  "LEVEL",
  "GENERIC",
];

function errorText(error: unknown): string | null {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return error ? "Une erreur inattendue est survenue." : null;
}

export function EquipmentManagementPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<EquipmentView>("sensors");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalView, setModalView] = useState<ModalView>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);

  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: getBuildings,
  });
  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: () => getSensors(),
  });
  const buildings = buildingsQuery.data ?? [];
  const sensors = sensorsQuery.data ?? [];

  const closeModal = () => {
    setModalView(null);
    setEditingBuilding(null);
    setEditingSensor(null);
  };

  const buildingSave = useMutation({
    mutationFn: ({ input, id }: { input: BuildingInput; id?: string }) =>
      saveBuilding(input, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["buildings"] });
      closeModal();
    },
  });
  const sensorSave = useMutation({
    mutationFn: ({ input, id }: { input: SensorInput; id?: string }) =>
      saveSensor(input, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sensors"] }),
        queryClient.invalidateQueries({ queryKey: ["buildings"] }),
      ]);
      closeModal();
    },
  });
  const buildingDelete = useMutation({
    mutationFn: deleteBuilding,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
  const sensorDelete = useMutation({
    mutationFn: deleteSensor,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sensors"] }),
        queryClient.invalidateQueries({ queryKey: ["buildings"] }),
      ]);
    },
  });
  const sensorStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Sensor["status"] }) =>
      setSensorStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensors"] }),
  });

  const error = [
    errorText(buildingsQuery.error),
    errorText(sensorsQuery.error),
    errorText(buildingSave.error),
    errorText(sensorSave.error),
    errorText(buildingDelete.error),
    errorText(sensorDelete.error),
    errorText(sensorStatus.error),
  ].find(Boolean);

  const filteredBuildings = buildings.filter((building) => {
    const term = search.toLowerCase();
    return (
      building.name.toLowerCase().includes(term) ||
      building.location.toLowerCase().includes(term)
    );
  });
  const filteredSensors = sensors.filter((sensor) => {
    const term = search.toLowerCase();
    const matchesText =
      sensor.name.toLowerCase().includes(term) ||
      sensor.type.toLowerCase().includes(term) ||
      (
        buildings.find((building) => building.id === sensor.buildingId)?.name ??
        ""
      )
        .toLowerCase()
        .includes(term);
    return (
      matchesText &&
      (!typeFilter || sensor.type === typeFilter) &&
      (!statusFilter || sensor.status === statusFilter)
    );
  });
  const sensorCountByBuilding = sensors.reduce<Record<string, number>>(
    (counts, sensor) => {
      counts[sensor.buildingId] = (counts[sensor.buildingId] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const isLoading = buildingsQuery.isLoading || sensorsQuery.isLoading;
  const openCreate = () => {
    setEditingBuilding(null);
    setEditingSensor(null);
    setModalView(view);
  };

  const removeBuilding = (building: Building) => {
    if (
      window.confirm(
        `Supprimer « ${building.name} » ? Les bâtiments associés à des capteurs ne peuvent pas être supprimés.`,
      )
    ) {
      buildingDelete.mutate(building.id);
    }
  };

  const removeSensor = (sensor: Sensor) => {
    if (window.confirm(`Supprimer le capteur « ${sensor.name} » ?`)) {
      sensorDelete.mutate(sensor.id);
    }
  };

  const retryQueries = () => {
    void Promise.all([buildingsQuery.refetch(), sensorsQuery.refetch()]);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Équipements
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Gérez les bâtiments et les capteurs associés.
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={view === "sensors" && buildings.length === 0}
        >
          <Plus className="h-4 w-4" />
          {view === "buildings" ? "Ajouter un bâtiment" : "Ajouter un capteur"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700">
        <div
          className="flex gap-2"
          role="tablist"
          aria-label="Type d’équipement"
        >
          <Button
            role="tab"
            aria-selected={view === "buildings"}
            variant={view === "buildings" ? "primary" : "ghost"}
            onClick={() => setView("buildings")}
          >
            <Building2 className="h-4 w-4" />
            Bâtiments ({buildings.length})
          </Button>
          <Button
            role="tab"
            aria-selected={view === "sensors"}
            variant={view === "sensors" ? "primary" : "ghost"}
            onClick={() => setView("sensors")}
          >
            <Radio className="h-4 w-4" />
            Capteurs ({sensors.length})
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={retryQueries}
          disabled={buildingsQuery.isFetching || sensorsQuery.isFetching}
          aria-label="Actualiser les équipements"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div
          className="flex items-start justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={retryQueries}>
            Réessayer
          </Button>
        </div>
      )}

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                aria-label="Rechercher"
                placeholder="Rechercher par nom..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            {view === "sensors" && (
              <div className="flex gap-2">
                <select
                  aria-label="Filtrer par type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="input min-w-40"
                >
                  <option value="">Tous les types</option>
                  {sensorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrer par état"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="input min-w-36"
                >
                  <option value="">Tous les états</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                </select>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">
          Chargement des équipements...
        </p>
      ) : view === "buildings" ? (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bâtiment</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Capteurs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell>
                      <div className="font-medium">{building.name}</div>
                      <div className="font-mono text-xs text-gray-500">
                        {building.id}
                      </div>
                    </TableCell>
                    <TableCell>{building.location}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-500">
                      {building.description || "—"}
                    </TableCell>
                    <TableCell>
                      {sensorCountByBuilding[building.id] ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Modifier ${building.name}`}
                          onClick={() => {
                            setEditingBuilding(building);
                            setModalView("buildings");
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Supprimer ${building.name}`}
                          onClick={() => removeBuilding(building)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBuildings.length === 0 && (
                  <EmptyRow colSpan={5} text="Aucun bâtiment trouvé." />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bâtiment</TableHead>
                  <TableHead>Seuil (kWh)</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSensors.map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell>
                      <div className="font-medium">{sensor.name}</div>
                      <div className="font-mono text-xs text-gray-500">
                        {sensor.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {sensor.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {buildings.find(
                        (building) => building.id === sensor.buildingId,
                      )?.name ?? "Bâtiment introuvable"}
                    </TableCell>
                    <TableCell>
                      {sensor.consumptionThreshold.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sensor.status === "ACTIVE" ? "success" : "gray"
                        }
                      >
                        {sensor.status === "ACTIVE" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`${sensor.status === "ACTIVE" ? "Désactiver" : "Activer"} ${sensor.name}`}
                          onClick={() =>
                            sensorStatus.mutate({
                              id: sensor.id,
                              status:
                                sensor.status === "ACTIVE"
                                  ? "INACTIVE"
                                  : "ACTIVE",
                            })
                          }
                          disabled={sensorStatus.isPending}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Modifier ${sensor.name}`}
                          onClick={() => {
                            setEditingSensor(sensor);
                            setModalView("sensors");
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Supprimer ${sensor.name}`}
                          onClick={() => removeSensor(sensor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSensors.length === 0 && (
                  <EmptyRow colSpan={6} text="Aucun capteur trouvé." />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={modalView === "buildings"}
        onClose={closeModal}
        title={editingBuilding ? "Modifier le bâtiment" : "Ajouter un bâtiment"}
        size="lg"
      >
        <BuildingForm
          initialData={editingBuilding}
          loading={buildingSave.isPending}
          onSubmit={(input) =>
            buildingSave.mutate({ input, id: editingBuilding?.id })
          }
          onCancel={closeModal}
        />
      </Modal>
      <Modal
        isOpen={modalView === "sensors"}
        onClose={closeModal}
        title={editingSensor ? "Modifier le capteur" : "Ajouter un capteur"}
        size="lg"
      >
        <SensorForm
          buildings={buildings}
          initialData={editingSensor}
          loading={sensorSave.isPending}
          onSubmit={(input) =>
            sensorSave.mutate({ input, id: editingSensor?.id })
          }
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-gray-500">
        {text}
      </TableCell>
    </TableRow>
  );
}

function BuildingForm({
  initialData,
  loading,
  onSubmit,
  onCancel,
}: {
  initialData: Building | null;
  loading: boolean;
  onSubmit: (input: BuildingInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, location, description: description || null });
      }}
    >
      <Input
        label="Nom"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={120}
      />
      <Input
        label="Emplacement"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        required
        maxLength={250}
      />
      <label className="block">
        <span className="label">Description</span>
        <textarea
          className="input min-h-24 w-full"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
        />
      </label>
      <FormActions
        loading={loading}
        onCancel={onCancel}
        submitLabel={initialData ? "Enregistrer" : "Créer"}
      />
    </form>
  );
}

function SensorForm({
  buildings,
  initialData,
  loading,
  onSubmit,
  onCancel,
}: {
  buildings: Building[];
  initialData: Sensor | null;
  loading: boolean;
  onSubmit: (input: SensorInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState(initialData?.type ?? "POWER");
  const [buildingId, setBuildingId] = useState(
    initialData?.buildingId ?? buildings[0]?.id ?? "",
  );
  const [status, setStatus] = useState<Sensor["status"]>(
    initialData?.status ?? "ACTIVE",
  );
  const [threshold, setThreshold] = useState(
    String(initialData?.consumptionThreshold ?? 0),
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          type,
          buildingId,
          status,
          consumptionThreshold: Number(threshold),
        });
      }}
    >
      <Input
        label="Nom"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={120}
      />
      <label className="block">
        <span className="label">Type</span>
        <select
          className="input w-full"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {sensorTypes.map((sensorType) => (
            <option key={sensorType} value={sensorType}>
              {sensorType.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Bâtiment</span>
        <select
          className="input w-full"
          value={buildingId}
          onChange={(event) => setBuildingId(event.target.value)}
          required
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Seuil de consommation (kWh)"
          type="number"
          min="0"
          step="any"
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          required
        />
        <label className="block">
          <span className="label">État</span>
          <select
            className="input w-full"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Sensor["status"])
            }
          >
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </label>
      </div>
      <FormActions
        loading={loading}
        onCancel={onCancel}
        submitLabel={initialData ? "Enregistrer" : "Créer"}
      />
    </form>
  );
}

function FormActions({
  loading,
  onCancel,
  submitLabel,
}: {
  loading: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        Annuler
      </Button>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </div>
  );
}
