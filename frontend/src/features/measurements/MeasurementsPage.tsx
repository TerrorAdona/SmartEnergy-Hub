import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { ApiError, getSensors } from "@/api/equipment";
import { getMeasurements } from "@/api/measurements";
import { measurementsToCsv } from "./measurementCsv";
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
import { useI18n } from "@/i18n/useI18n";

function localDateTimeValue(date: Date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return fallback;
}

export function MeasurementsPage() {
  const { t, formatDateTime } = useI18n();
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

  const exportCsv = () => {
    const csv = measurementsToCsv(
      measurements,
      new Map(sensors.map((sensor) => [sensor.id, sensor.name])),
    );
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `energy-measurements-${from.slice(0, 10)}-${to.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.measurements.title}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t.measurements.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!measurements.length}
          >
            <Download className="h-4 w-4" /> {t.measurements.export}
          </Button>
          <Button
            variant="outline"
            onClick={() => void measurementsQuery.refetch()}
            disabled={!validRange || measurementsQuery.isFetching}
            loading={measurementsQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> {t.common.refresh}
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          <span>{errorText(error, t.common.unexpected)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void measurementsQuery.refetch()}
          >
            {t.common.retry}
          </Button>
        </div>
      )}

      <Card>
        <CardBody className="grid gap-4 p-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">{t.measurements.sensor}</span>
            <select
              aria-label={t.measurements.sensor}
              className="input w-full"
              value={sensorId}
              onChange={(event) => setSensorId(event.target.value)}
            >
              <option value="">{t.measurements.allSensors}</option>
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label={t.common.from}
            aria-label={t.common.from}
            type="datetime-local"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label={t.common.to}
            aria-label={t.common.to}
            type="datetime-local"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </CardBody>
      </Card>

      {!validRange ? (
        <p className="text-sm text-red-600" role="alert">
          {t.common.rangeError}
        </p>
      ) : measurementsQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">
          {t.measurements.loading}
        </p>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.measurements.when}</TableHead>
                  <TableHead>{t.measurements.sensor}</TableHead>
                  <TableHead className="text-right">{t.measurements.power}</TableHead>
                  <TableHead className="text-right">{t.measurements.voltage}</TableHead>
                  <TableHead className="text-right">{t.measurements.temperature}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.map((measurement) => {
                  const sensor = sensorById.get(measurement.sensorId);
                  return (
                    <TableRow key={measurement.measurementId}>
                      <TableCell className="font-mono text-sm">
                        {formatDateTime(measurement.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {sensor?.name ?? t.measurements.unknownSensor}
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
                      {t.measurements.empty}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <p className="text-sm text-gray-500">
        {t.measurements.count(measurements.length)}
      </p>
    </div>
  );
}
