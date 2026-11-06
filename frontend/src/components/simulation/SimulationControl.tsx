import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { getSimulation, setSimulation } from "@/api/simulation";
import { useI18n } from "@/i18n/useI18n";
import { useSimulationStore } from "@/stores/simulationStore";

export function SimulationControl() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const setLive = useSimulationStore((state) => state.setLive);
  const statusQuery = useQuery({
    queryKey: ["simulation"],
    queryFn: getSimulation,
    refetchInterval: 5_000,
  });
  const toggle = useMutation({
    mutationFn: (running: boolean) => setSimulation(running),
    onSuccess: (status) => {
      queryClient.setQueryData(["simulation"], status);
      if (status.running) {
        void queryClient.invalidateQueries({ queryKey: ["alerts"] });
        void queryClient.invalidateQueries({ queryKey: ["measurements"] });
      }
    },
  });

  const status = statusQuery.data;
  const running = status?.running ?? false;

  useEffect(() => {
    setLive(running, status?.lastTickAt ?? null);
  }, [running, status?.lastTickAt, setLive]);

  useEffect(() => {
    if (!status?.lastTickAt) return;
    void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    void queryClient.invalidateQueries({ queryKey: ["measurements"] });
  }, [status?.lastTickAt, queryClient]);

  const pending = toggle.isPending;
  const failed = toggle.isError || statusQuery.isError;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={running}
      aria-label={`${running ? t.simulation.stop : t.simulation.start}. ${t.simulation.sensors(status?.activeSensors ?? 0)}`}
      title={
        failed
          ? t.simulation.failed
          : t.simulation.sensors(status?.activeSensors ?? 0)
      }
      disabled={pending}
      onClick={() => toggle.mutate(!running)}
      className={clsx(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
        running
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
        pending && "opacity-60",
      )}
    >
      <span
        className={clsx(
          "h-2.5 w-2.5 rounded-full",
          running ? "animate-pulse bg-emerald-500" : "bg-gray-400",
        )}
      />
      <span>{t.simulation.label}</span>
      <span className="text-xs">{running ? t.simulation.on : t.simulation.off}</span>
      {failed && <span className="sr-only">{t.simulation.failed}</span>}
    </button>
  );
}
