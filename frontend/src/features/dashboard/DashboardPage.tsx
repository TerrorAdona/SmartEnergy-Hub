import { useEffect, useState } from "react";
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
import { useI18n } from "@/i18n/useI18n";
import { useSimulationStore } from "@/stores/simulationStore";

const DAY_MS = 24 * 60 * 60 * 1000;

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return fallback;
}

export function DashboardPage() {
  const { t, formatNumber, formatDateTime, formatTime } = useI18n();
  const [interval, setInterval] = useState<AggregationInterval>("HOUR");
  const [periodEnd, setPeriodEnd] = useState(() => Date.now());
  const lastTickAt = useSimulationStore((state) => state.lastTickAt);
  useEffect(() => {
    if (!lastTickAt) return;
    setPeriodEnd((current) =>
      Date.now() - current >= 15_000 ? Date.now() : current,
    );
  }, [lastTickAt]);
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
  const formatPower = (value: number | null) =>
    value == null ? "—" : `${formatNumber(value)} kW`;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t.dashboard.periods[interval]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label={t.dashboard.aggregation}
            className="input"
            value={interval}
            onChange={(event) =>
              setInterval(event.target.value as AggregationInterval)
            }
          >
            <option value="HOUR">{t.dashboard.hour}</option>
            <option value="DAY">{t.dashboard.day}</option>
            <option value="MONTH">{t.dashboard.month}</option>
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
            onClick={() => void summaryQuery.refetch()}
          >
            {t.common.retry}
          </Button>
        </div>
      )}

      {summaryQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500" role="status">
          {t.dashboard.loading}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t.dashboard.buildings}
              value={summary ? String(summary.buildingCount) : "—"}
            />
            <MetricCard
              label={t.dashboard.activeSensors}
              value={summary ? String(summary.activeSensorCount) : "—"}
            />
            <MetricCard
              label={t.dashboard.energy}
              value={
                summary?.totalEnergyKwh == null
                  ? "—"
                  : `${formatNumber(summary.totalEnergyKwh)} kWh`
              }
              detail={
                percentChange == null
                  ? t.dashboard.noComparison
                  : t.dashboard.comparison(formatNumber(percentChange))
              }
              trend={percentChange}
            />
            <MetricCard
              label={t.dashboard.averagePower}
              value={formatPower(summary?.averagePowerKw ?? null)}
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.dashboard.evolution[interval]}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.dashboard.evolutionHint}
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
                        tickFormatter={(value: string) => formatTime(value)}
                        minTickGap={24}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => formatDateTime(String(value))}
                        formatter={(value) => [
                          `${formatNumber(Number(value))} kWh`,
                          t.dashboard.energySeries,
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
                  {t.dashboard.noTimeline}
                </p>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t.dashboard.recent}
                  </h2>
                  <Link
                    to="/measurements"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {t.dashboard.history}
                  </Link>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.dashboard.time}</TableHead>
                      <TableHead>{t.dashboard.sensor}</TableHead>
                      <TableHead className="text-right">{t.dashboard.power}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary?.recentMeasurements.map((measurement) => (
                      <TableRow key={measurement.measurementId}>
                        <TableCell className="font-mono text-xs">
                          {formatDateTime(measurement.timestamp)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {measurement.sensorId}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(measurement.powerKw)} kW
                        </TableCell>
                      </TableRow>
                    ))}
                    {!summary?.recentMeasurements.length && (
                      <EmptyRow
                        colSpan={3}
                        text={
                          summary
                            ? t.dashboard.noMeasurements
                            : t.dashboard.dataUnavailable
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
                    {t.dashboard.recentAlerts}
                  </h2>
                  <Link
                    to="/alerts"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {t.dashboard.seeAlerts}
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
                          {alert.sensorName} ·{" "}
                          {alert.type === "POWER_THRESHOLD"
                            ? t.alerts.powerThreshold
                            : alert.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.buildingName} · {formatDateTime(alert.createdAt)}
                        </p>
                        <p className="text-sm">
                          {t.dashboard.threshold(
                            formatNumber(alert.observedValue),
                            formatNumber(alert.threshold),
                          )}
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.status === "ACTIVE" ? "danger" : "warning"
                        }
                      >
                        {alert.status === "ACTIVE"
                          ? t.alerts.active
                          : t.alerts.acknowledged}
                      </Badge>
                    </div>
                  ))}
                  {!alertsQuery.data?.length && (
                    <p className="p-4 text-sm text-gray-500">
                      {t.dashboard.noAlerts}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.dashboard.byBuilding}
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
                        {t.dashboard.summaryLine(
                          building.measurementCount,
                          formatPower(building.averagePowerKw),
                        )}
                      </p>
                    </div>
                    <span className="font-mono">
                      {building.energyKwh == null
                        ? "—"
                        : `${formatNumber(building.energyKwh)} kWh`}
                    </span>
                  </div>
                ))}
                {!summary?.byBuilding.length && (
                  <p className="p-4 text-sm text-gray-500">
                    {summary
                      ? t.dashboard.noBuildingAggregate
                      : t.dashboard.statsUnavailable}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.dashboard.bySensor}
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
                        {t.dashboard.summaryLine(
                          sensor.measurementCount,
                          formatPower(sensor.averagePowerKw),
                        )}
                      </p>
                    </div>
                    <span className="font-mono">
                      {sensor.energyKwh == null
                        ? "—"
                        : `${formatNumber(sensor.energyKwh)} kWh`}
                    </span>
                  </div>
                ))}
                {!summary?.bySensor.length && (
                  <p className="p-4 text-sm text-gray-500">
                    {t.dashboard.noSensorAggregate}
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
