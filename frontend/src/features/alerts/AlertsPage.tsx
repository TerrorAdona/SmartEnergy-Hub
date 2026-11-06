import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, RefreshCw, Search } from "lucide-react";
import { acknowledgeAlert, EnergyAlert, getAlerts } from "@/api/alerts";
import { ApiError, getBuildings, getSensors } from "@/api/equipment";
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

function errorText(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}

export function AlertsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<EnergyAlert | null>(null);

  const alertsQuery = useQuery({
    queryKey: ["alerts", { status, type, buildingId, from, to }],
    queryFn: () => getAlerts({
      status: status ? (status as "ACTIVE" | "ACKNOWLEDGED") : undefined,
      type: type || undefined,
      buildingId: buildingId || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      limit: 500,
    }),
    enabled: (!from || Number.isFinite(new Date(from).getTime())) &&
      (!to || Number.isFinite(new Date(to).getTime())) &&
      (!from || !to || new Date(from) <= new Date(to)),
  });
  const sensorsQuery = useQuery({ queryKey: ["sensors"], queryFn: () => getSensors() });
  const buildingsQuery = useQuery({ queryKey: ["buildings"], queryFn: getBuildings });
  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setSelectedAlert(null);
    },
  });

  const sensorsById = new Map((sensorsQuery.data ?? []).map((sensor) => [sensor.id, sensor]));
  const buildingsById = new Map((buildingsQuery.data ?? []).map((building) => [building.id, building]));
  const searchTerm = search.trim().toLowerCase();
  const alerts = (alertsQuery.data ?? []).filter((alert) =>
    !searchTerm || [alert.id, alert.type, alert.sensorId, alert.sensorName, alert.buildingName]
      .some((value) => value.toLowerCase().includes(searchTerm)),
  );
  const activeCount = alerts.filter((alert) => alert.status === "ACTIVE").length;
  const error = alertsQuery.error || sensorsQuery.error || buildingsQuery.error || acknowledgeMutation.error;
  const dateRangeValid = !from || !to || new Date(from) <= new Date(to);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertes</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Dépassements de seuil détectés à partir des mesures reçues.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={alertsQuery.data ? (activeCount ? "danger" : "success") : "gray"}>
            <Bell className="mr-1 h-3 w-3" /> {alertsQuery.data ? `${activeCount} active${activeCount === 1 ? "" : "s"}` : "Indisponible"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void Promise.all([alertsQuery.refetch(), sensorsQuery.refetch(), buildingsQuery.refetch()])}
            disabled={alertsQuery.isFetching}
            loading={alertsQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" role="alert">
          <span>{errorText(error)}</span>
          <Button variant="ghost" size="sm" onClick={() => void alertsQuery.refetch()}>Réessayer</Button>
        </div>
      )}

      <Card>
        <CardBody className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input aria-label="Rechercher une alerte" placeholder="Capteur, bâtiment, type..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" />
          </div>
          <select aria-label="Statut" className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acquittée</option>
          </select>
          <select aria-label="Bâtiment" className="input" value={buildingId} onChange={(event) => setBuildingId(event.target.value)}>
            <option value="">Tous les bâtiments</option>
            {(buildingsQuery.data ?? []).map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
          </select>
          <select aria-label="Type" className="input" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Tous les types</option>
            <option value="POWER_THRESHOLD">Seuil de puissance</option>
          </select>
          <Input label="Du" aria-label="Du" type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input label="Au" aria-label="Au" type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} />
        </CardBody>
      </Card>

      {!dateRangeValid ? (
        <p className="text-sm text-red-600" role="alert">La date de début doit précéder la date de fin.</p>
      ) : alertsQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">Chargement des alertes...</p>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Capteur / bâtiment</TableHead>
                  <TableHead className="text-right">Observé / seuil (kW)</TableHead>
                  <TableHead>Créée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Acquittée par</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const sensor = sensorsById.get(alert.sensorId);
                  const building = buildingsById.get(alert.buildingId);
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="font-medium">{alert.type.replace(/_/g, " ")}</div>
                        <div className="font-mono text-xs text-gray-500">{alert.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sensor?.name ?? alert.sensorName}</div>
                        <div className="text-xs text-gray-500">{building?.name ?? alert.buildingName}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{alert.observedValue.toFixed(2)} / {alert.threshold.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{new Date(alert.createdAt).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={alert.status === "ACTIVE" ? "danger" : "warning"}>{alert.status === "ACTIVE" ? "Active" : "Acquittée"}</Badge></TableCell>
                      <TableCell className="text-sm">{alert.acknowledgedBy ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {alert.status === "ACTIVE" && (
                          <Button variant="outline" size="sm" aria-label={`Acquitter ${alert.id}`} onClick={() => setSelectedAlert(alert)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!alerts.length && <TableRow><TableCell colSpan={7} className="py-10 text-center text-gray-500">Aucune alerte correspondant aux filtres.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <p className="text-sm text-gray-500">{alerts.length} alerte{alerts.length === 1 ? "" : "s"}</p>

      <Modal isOpen={selectedAlert !== null} onClose={() => setSelectedAlert(null)} title="Acquitter l’alerte" description={selectedAlert?.id}>
        <div className="space-y-4">
          <p>Cette alerte restera dans l’historique avec son nouveau statut.</p>
          {selectedAlert && <p className="rounded bg-gray-50 p-3 text-sm dark:bg-gray-800">{selectedAlert.sensorName} · {selectedAlert.observedValue} kW / seuil {selectedAlert.threshold} kW</p>}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="outline" onClick={() => setSelectedAlert(null)} disabled={acknowledgeMutation.isPending}>Annuler</Button>
            <Button loading={acknowledgeMutation.isPending} onClick={() => selectedAlert && acknowledgeMutation.mutate(selectedAlert.id)}>Confirmer l’acquittement</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}