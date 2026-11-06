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
import { useI18n } from "@/i18n/useI18n";

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

function errorText(error: unknown, fallback: string): string | null {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return error ? fallback : null;
}

export function EquipmentManagementPage() {
  const { t, formatNumber } = useI18n();
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
    errorText(buildingsQuery.error, t.common.unexpected),
    errorText(sensorsQuery.error, t.common.unexpected),
    errorText(buildingSave.error, t.common.unexpected),
    errorText(sensorSave.error, t.common.unexpected),
    errorText(buildingDelete.error, t.common.unexpected),
    errorText(sensorDelete.error, t.common.unexpected),
    errorText(sensorStatus.error, t.common.unexpected),
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
        t.equipment.deleteBuilding(building.name),
      )
    ) {
      buildingDelete.mutate(building.id);
    }
  };

  const removeSensor = (sensor: Sensor) => {
    if (window.confirm(t.equipment.deleteSensor(sensor.name))) {
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
            {t.equipment.title}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t.equipment.subtitle}
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={view === "sensors" && buildings.length === 0}
        >
          <Plus className="h-4 w-4" />
          {view === "buildings" ? t.equipment.addBuilding : t.equipment.addSensor}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700">
        <div
          className="flex gap-2"
          role="tablist"
          aria-label={t.equipment.kind}
        >
          <Button
            role="tab"
            aria-selected={view === "buildings"}
            variant={view === "buildings" ? "primary" : "ghost"}
            onClick={() => setView("buildings")}
          >
            <Building2 className="h-4 w-4" />
            {t.equipment.buildings(buildings.length)}
          </Button>
          <Button
            role="tab"
            aria-selected={view === "sensors"}
            variant={view === "sensors" ? "primary" : "ghost"}
            onClick={() => setView("sensors")}
          >
            <Radio className="h-4 w-4" />
            {t.equipment.sensors(sensors.length)}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={retryQueries}
          disabled={buildingsQuery.isFetching || sensorsQuery.isFetching}
          aria-label={t.equipment.refresh}
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
            {t.common.retry}
          </Button>
        </div>
      )}

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                aria-label={t.equipment.search}
                placeholder={t.equipment.searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            {view === "sensors" && (
              <div className="flex gap-2">
                <select
                  aria-label={t.equipment.filterType}
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="input min-w-40"
                >
                  <option value="">{t.equipment.allTypes}</option>
                  {sensorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t.equipment.filterStatus}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="input min-w-36"
                >
                  <option value="">{t.equipment.allStatuses}</option>
                  <option value="ACTIVE">{t.equipment.active}</option>
                  <option value="INACTIVE">{t.equipment.inactive}</option>
                </select>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">
          {t.equipment.loading}
        </p>
      ) : view === "buildings" ? (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.equipment.building}</TableHead>
                  <TableHead>{t.equipment.location}</TableHead>
                  <TableHead>{t.equipment.description}</TableHead>
                  <TableHead>{t.equipment.sensorCount}</TableHead>
                  <TableHead className="text-right">{t.common.actions}</TableHead>
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
                          aria-label={t.equipment.edit(building.name)}
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
                          aria-label={t.equipment.remove(building.name)}
                          onClick={() => removeBuilding(building)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBuildings.length === 0 && (
                  <EmptyRow colSpan={5} text={t.equipment.noBuildings} />
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
                  <TableHead>{t.equipment.sensor}</TableHead>
                  <TableHead>{t.equipment.type}</TableHead>
                  <TableHead>{t.equipment.building}</TableHead>
                  <TableHead>{t.equipment.threshold}</TableHead>
                  <TableHead>{t.equipment.status}</TableHead>
                  <TableHead className="text-right">{t.common.actions}</TableHead>
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
                      )?.name ?? t.equipment.missingBuilding}
                    </TableCell>
                    <TableCell>
                      {formatNumber(sensor.consumptionThreshold)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sensor.status === "ACTIVE" ? "success" : "gray"
                        }
                      >
                        {sensor.status === "ACTIVE" ? t.equipment.active : t.equipment.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t.equipment.toggle(sensor.status === "ACTIVE", sensor.name)}
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
                          aria-label={t.equipment.edit(sensor.name)}
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
                          aria-label={t.equipment.remove(sensor.name)}
                          onClick={() => removeSensor(sensor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSensors.length === 0 && (
                  <EmptyRow colSpan={6} text={t.equipment.noSensors} />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={modalView === "buildings"}
        onClose={closeModal}
        title={editingBuilding ? t.equipment.editBuilding : t.equipment.newBuilding}
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
        title={editingSensor ? t.equipment.editSensor : t.equipment.newSensor}
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
  const { t } = useI18n();
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
        label={t.equipment.name}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={120}
      />
      <Input
        label={t.equipment.location}
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        required
        maxLength={250}
      />
      <label className="block">
        <span className="label">{t.equipment.description}</span>
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
        submitLabel={initialData ? t.common.save : t.common.create}
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
  const { t } = useI18n();
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
        label={t.equipment.name}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={120}
      />
      <label className="block">
        <span className="label">{t.equipment.type}</span>
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
        <span className="label">{t.equipment.building}</span>
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
          label={t.equipment.thresholdInput}
          type="number"
          min="0"
          step="any"
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          required
        />
        <label className="block">
          <span className="label">{t.equipment.status}</span>
          <select
            className="input w-full"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as Sensor["status"])
            }
          >
            <option value="ACTIVE">{t.equipment.active}</option>
            <option value="INACTIVE">{t.equipment.inactive}</option>
          </select>
        </label>
      </div>
      <FormActions
        loading={loading}
        onCancel={onCancel}
        submitLabel={initialData ? t.common.save : t.common.create}
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
  const { t } = useI18n();
  return (
    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        {t.common.cancel}
      </Button>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </div>
  );
}
