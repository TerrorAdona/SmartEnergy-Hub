import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { ApiError, getSensors } from "@/api/equipment";
import { getMeasurements } from "@/api/measurements";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

function localDateTimeValue(date: Date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

function errorText(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}

export function MeasurementsPage() {
  const [sensorId, setSensorId] = useState("");
  const [to, setTo] = useState(() => localDateTimeValue(new Date()));
  const [from, setFrom] = useState(() =>
    localDateTimeValue(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  );

  const sensorsQuery = useQuery({
    queryKey: ["sensors"],
    queryFn: () => getSensors(),
  });
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const validRange =
    Number.isFinite(fromDate.getTime()) &&
    Number.isFinite(toDate.getTime()) &&
    fromDate <= toDate;
  const measurementsQuery = useQuery({
    queryKey: ["measurements", sensorId, from, to],
    queryFn: () =>
      getMeasurements({
        sensorId: sensorId || undefined,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      }),
    enabled: validRange,
  });

  const sensors = sensorsQuery.data ?? [];
  const sensorById = new Map(sensors.map((sensor) => [sensor.id, sensor]));
  const measurements = measurementsQuery.data ?? [];
  const error = sensorsQuery.error || measurementsQuery.error;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mesures
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Historique des mesures énergétiques des capteurs.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void measurementsQuery.refetch()}
          disabled={!validRange || measurementsQuery.isFetching}
          loading={measurementsQuery.isFetching}
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {error && (
        <div
          className="flex items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          <span>{errorText(error)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void measurementsQuery.refetch()}
          >
            Réessayer
          </Button>
        </div>
      )}

      <Card>
        <CardBody className="grid gap-4 p-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Capteur</span>
            <select
              aria-label="Capteur"
              className="input w-full"
              value={sensorId}
              onChange={(event) => setSensorId(event.target.value)}
            >
              <option value="">Tous les capteurs</option>
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Du"
            aria-label="Du"
            type="datetime-local"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="Au"
            aria-label="Au"
            type="datetime-local"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </CardBody>
      </Card>

      {!validRange ? (
        <p className="text-sm text-red-600" role="alert">
          La date de début doit précéder la date de fin.
        </p>
      ) : measurementsQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">
          Chargement des mesures...
        </p>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date et heure</TableHead>
                  <TableHead>Capteur</TableHead>
                  <TableHead className="text-right">Puissance (kW)</TableHead>
                  <TableHead className="text-right">Tension (V)</TableHead>
                  <TableHead className="text-right">Température (°C)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.map((measurement) => {
                  const sensor = sensorById.get(measurement.sensorId);
                  return (
                    <TableRow key={measurement.measurementId}>
                      <TableCell className="font-mono text-sm">
                        {new Date(measurement.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {sensor?.name ?? "Capteur"}
                        </div>
                        <div className="font-mono text-xs text-gray-500">
                          {measurement.sensorId}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {measurement.powerKw.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {measurement.voltage.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <Badge variant="gray">
                          {measurement.temperature.toFixed(1)} °C
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {measurements.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-gray-500"
                    >
                      Aucune mesure sur cette période.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <p className="text-sm text-gray-500">
        {measurements.length} mesure{measurements.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
