import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AggregationInterval, getAnalyticsSummary } from "@/api/analytics";
import { getAlerts } from "@/api/alerts";
import { ApiError } from "@/api/equipment";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

const DAY_MS = 24 * 60 * 60 * 1000;
const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

function errorText(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}

export function DashboardPage() {
  const [interval, setInterval] = useState<AggregationInterval>("HOUR");
  const [periodEnd] = useState(() => Date.now());
  const to = new Date(periodEnd);
  const periodMs =
    interval === "HOUR"
      ? DAY_MS
      : interval === "DAY"
        ? 7 * DAY_MS
        : 30 * DAY_MS;
  const from = new Date(periodEnd - periodMs);
  const compareFrom = new Date(periodEnd - 2 * periodMs);
  const summaryQuery = useQuery({
    queryKey: [
      "analytics-summary",
      from.toISOString(),
      to.toISOString(),
      interval,
    ],
    queryFn: () =>
      getAnalyticsSummary({
        from: from.toISOString(),
        to: to.toISOString(),
        interval,
        compareFrom: compareFrom.toISOString(),
        compareTo: from.toISOString(),
      }),
  });
  const alertsQuery = useQuery({
    queryKey: ["alerts", { limit: 5 }],
    queryFn: () => getAlerts({ limit: 5 }),
  });

  const summary = summaryQuery.data;
  const percentChange = summary?.comparison?.changePercent;
  const error = summaryQuery.error || alertsQuery.error;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {interval === "HOUR"
              ? "Synthèse mesurée sur 24 heures"
              : interval === "DAY"
                ? "Synthèse mesurée sur 7 jours"
                : "Synthèse mesurée sur 30 jours"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Agrégation"
            className="input"
            value={interval}
            onChange={(event) =>
              setInterval(event.target.value as AggregationInterval)
            }
          >
            <option value="HOUR">Par heure</option>
            <option value="DAY">Par jour</option>
            <option value="MONTH">Par mois</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              void summaryQuery.refetch();
              void alertsQuery.refetch();
            }}
            loading={summaryQuery.isFetching || alertsQuery.isFetching}
            disabled={summaryQuery.isFetching || alertsQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        </div>
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
            onClick={() => void summaryQuery.refetch()}
          >
            Réessayer
          </Button>
        </div>
      )}

      {summaryQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">
          Chargement des statistiques énergétiques...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Bâtiments"
              value={summary ? String(summary.buildingCount) : "—"}
            />
            <MetricCard
              label="Capteurs actifs"
              value={summary ? String(summary.activeSensorCount) : "—"}
            />
            <MetricCard
              label="Énergie consommée"
              value={
                summary?.totalEnergyKwh == null
                  ? "—"
                  : `${numberFormat.format(summary.totalEnergyKwh)} kWh`
              }
              detail={
                percentChange == null
                  ? "Comparaison indisponible"
                  : `${numberFormat.format(percentChange)}% vs période précédente`
              }
              trend={percentChange}
            />
            <MetricCard
              label="Puissance moyenne observée"
              value={
                summary?.averagePowerKw == null
                  ? "—"
                  : `${numberFormat.format(summary.averagePowerKw)} kW`
              }
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Évolution{" "}
                  {interval === "HOUR"
                    ? "horaire"
                    : interval === "DAY"
                      ? "journalière"
                      : "mensuelle"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Énergie intégrée à partir des mesures disponibles (kWh)
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {summary?.timeline.length ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={summary.timeline}
                      margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="bucketStart"
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        }
                        minTickGap={24}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(String(value)).toLocaleString()
                        }
                        formatter={(value) => [
                          `${numberFormat.format(Number(value))} kWh`,
                          "Énergie",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="energyKwh"
                        stroke="#0f766e"
                        fill="#14b8a6"
                        fillOpacity={0.18}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-gray-500">
                  Aucune mesure exploitable sur cette période.
                </p>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dernières mesures
                  </h2>
                  <Link
                    to="/measurements"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Voir l’historique
                  </Link>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Heure</TableHead>
                      <TableHead>Capteur</TableHead>
                      <TableHead className="text-right">Puissance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary?.recentMeasurements.map((measurement) => (
                      <TableRow key={measurement.measurementId}>
                        <TableCell className="font-mono text-xs">
                          {new Date(measurement.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {measurement.sensorId}
                        </TableCell>
                        <TableCell className="text-right">
                          {numberFormat.format(measurement.powerKw)} kW
                        </TableCell>
                      </TableRow>
                    ))}
                    {!summary?.recentMeasurements.length && (
                      <EmptyRow
                        colSpan={3}
                        text={
                          summary
                            ? "Aucune mesure disponible."
                            : "Données indisponibles."
                        }
                      />
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Alertes récentes
                  </h2>
                  <Link
                    to="/alerts"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Voir les alertes
                  </Link>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {alertsQuery.data?.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {alert.sensorName} · {alert.type}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.buildingName} ·{" "}
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          {numberFormat.format(alert.observedValue)} kW / seuil{" "}
                          {numberFormat.format(alert.threshold)} kW
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.status === "ACTIVE" ? "danger" : "warning"
                        }
                      >
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                  {!alertsQuery.data?.length && (
                    <p className="p-4 text-sm text-gray-500">
                      Aucune alerte enregistrée.
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Consommation par bâtiment
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary?.byBuilding.map((building) => (
                  <div
                    key={building.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="font-medium">{building.name}</p>
                      <p className="text-xs text-gray-500">
                        {building.measurementCount} mesures · puissance moyenne{" "}
                        {building.averagePowerKw == null
                          ? "—"
                          : `${numberFormat.format(building.averagePowerKw)} kW`}
                      </p>
                    </div>
                    <span className="font-mono">
                      {building.energyKwh == null
                        ? "—"
                        : `${numberFormat.format(building.energyKwh)} kWh`}
                    </span>
                  </div>
                ))}
                {!summary?.byBuilding.length && (
                  <p className="p-4 text-sm text-gray-500">
                    {summary
                      ? "Aucune mesure agrégée par bâtiment."
                      : "Statistiques indisponibles."}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Consommation par capteur
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary?.bySensor.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="font-medium">{sensor.name}</p>
                      <p className="text-xs text-gray-500">
                        {sensor.measurementCount} mesures · puissance moyenne{" "}
                        {sensor.averagePowerKw == null
                          ? "—"
                          : `${numberFormat.format(sensor.averagePowerKw)} kW`}
                      </p>
                    </div>
                    <span className="font-mono">
                      {sensor.energyKwh == null
                        ? "—"
                        : `${numberFormat.format(sensor.energyKwh)} kWh`}
                    </span>
                  </div>
                ))}
                {!summary?.bySensor.length && (
                  <p className="p-4 text-sm text-gray-500">
                    Aucune mesure agrégée par capteur.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  trend,
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: number | null;
}) {
  return (
    <Card>
      <CardBody className="p-5">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {detail && (
          <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            {trend != null &&
              (trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ))}
            {detail}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-gray-500">
        {text}
      </TableCell>
    </TableRow>
  );
}
