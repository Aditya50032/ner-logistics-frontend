/**
 * Simulation Mode and the Disrupted Routes panel.
 *
 * Running a scenario changes real data and lets the backend pipeline react. The step log
 * shown here is what the services actually did, on a compressed clock, not a scripted
 * animation.
 */
import {
  AlertOctagon,
  CloudRain,
  FlaskConical,
  Loader2,
  Mountain,
  Play,
  RotateCcw,
  Truck,
  Waves,
} from "lucide-react";
import { useState } from "react";

import { AsyncBoundary, EmptyPanel } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import type { DisruptedRoute, SimulationRun } from "@/types";

const SCENARIO_ICON: Record<string, typeof CloudRain> = {
  HEAVY_RAIN: CloudRain,
  LANDSLIDE: Mountain,
  FLOOD: Waves,
  ROAD_BLOCK: AlertOctagon,
  VEHICLE_STOP: Truck,
  CRITICAL_DELAY: AlertOctagon,
  CARGO_RECOVERY: Truck,
  FULL_SCENARIO: FlaskConical,
};

export function SimulationPanel({ onComplete }: { onComplete?: () => void }) {
  const scenarios = useAsync(() => api.scenarios(), []);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const runScenario = useAction((id: string) => api.runSimulation({ scenario: id, intensity: 1.4 }));
  const reset = useAction(() => api.resetSimulation());

  const trigger = async (id: string) => {
    setActive(id);
    const result = await runScenario.run(id);
    setActive(null);
    if (result) {
      setRun(result);
      onComplete?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-700 ring-1 ring-line">
            <FlaskConical className="h-4 w-4 text-signal-partial" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Simulation Mode</h2>
            <p className="mt-0.5 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
              Each scenario writes real data, then the prediction, detection, routing and freight
              services react to it exactly as they would to a live signal. Times shown are a
              compressed demonstration clock.
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await reset.run();
            setRun(null);
            onComplete?.();
          }}
          disabled={reset.pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-high/50 hover:text-signal-high disabled:opacity-50"
        >
          {reset.pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          Reset demonstration data
        </button>
      </div>

      {(runScenario.error || reset.error) && (
        <p className="panel border-signal-blocked/40 p-3 text-[12.5px] text-signal-blocked">
          {runScenario.error ?? reset.error}
        </p>
      )}

      <AsyncBoundary state={scenarios} loadingLabel="Loading scenarios">
        {(list) => (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {list.map((s) => {
              const Icon = SCENARIO_ICON[s.id] ?? FlaskConical;
              const running = active === s.id;
              const headline = s.id === "FULL_SCENARIO";
              return (
                <button
                  key={s.id}
                  onClick={() => trigger(s.id)}
                  disabled={runScenario.pending}
                  className={cn(
                    "panel p-4 text-left transition disabled:opacity-60",
                    headline
                      ? "ring-1 ring-signal-open/40 hover:ring-signal-open/70"
                      : "hover:border-line-strong",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {running ? (
                      <Loader2 className="h-4 w-4 animate-spin text-signal-open" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          headline ? "text-signal-open" : "text-ink-muted",
                        )}
                      />
                    )}
                    <span className="text-[13px] font-medium text-ink">{s.label}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{s.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-signal-open">
                    <Play className="h-3 w-3" />
                    {running ? "Running" : "Run"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </AsyncBoundary>

      {run && (
        <div className="panel p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-ink">
              {run.scenario.replace(/_/g, " ")}
            </h3>
            <span className="label-mono">
              {run.status} · {run.simulated_clock_minutes} simulated minutes
            </span>
          </div>
          <ol className="mt-4 space-y-3 border-l border-line pl-4">
            {(run.steps ?? []).map((step, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-signal-open ring-2 ring-navy-900" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="label-mono">{step.clock}</span>
                  <span className="text-[13px] font-medium text-ink">{step.step}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  BLOCKED: "text-signal-blocked",
  PARTIAL: "text-signal-partial",
  OPEN: "text-signal-open",
};

export function DisruptedRoutes() {
  const state = useAsync(() => api.disruptedRoutes(), []);
  const disruptions = useAsync(() => api.disruptions(true), []);
  const scan = useAction(() => api.scanDisruptions());

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-start justify-between gap-4 p-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Disrupted corridors</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Degraded roads with their vehicle and consignment impact, plus live detection events.
          </p>
        </div>
        <button
          onClick={async () => {
            await scan.run();
            state.reload();
            disruptions.reload();
          }}
          disabled={scan.pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-open/50 hover:text-signal-open disabled:opacity-50"
        >
          {scan.pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <AlertOctagon className="h-3.5 w-3.5" />
          )}
          Run detection scan
        </button>
      </div>

      <AsyncBoundary
        state={disruptions}
        loadingLabel="Loading detections"
        emptyWhen={(d) => d.length === 0}
        empty={
          <EmptyPanel
            title="No open detections"
            hint="The detection engine fuses AI risk, vehicle behaviour, field reports and official status. Run a scan to evaluate the network now."
          />
        }
      >
        {(events) => (
          <div className="space-y-2.5">
            {events.map((e) => (
              <div key={e.id} className="panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={cn(
                      "label-mono",
                      e.status === "VERIFIED_BLOCKED"
                        ? "text-signal-blocked"
                        : e.status === "LIKELY_BLOCKED"
                          ? "text-signal-high"
                          : "text-signal-partial",
                    )}
                  >
                    {e.status.replace(/_/g, " ")}
                  </span>
                  <span className="stat-num text-[13px] text-ink">
                    {e.confidence.toFixed(0)}% confidence
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink-muted">
                  {e.district ?? "Unmapped"} · {(e.affected_vehicle_ids ?? []).length} vehicle(s),{" "}
                  {(e.affected_shipment_ids ?? []).length} shipment(s) affected
                </p>
                {e.signals && (
                  <ul className="mt-2 space-y-1 border-l-2 border-line pl-3">
                    {e.signals.slice(0, 4).map((s, i) => (
                      <li key={i} className="text-[12px] leading-relaxed text-ink-muted">
                        {s.detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </AsyncBoundary>

      <AsyncBoundary
        state={state}
        loadingLabel="Loading corridors"
        emptyWhen={(d: DisruptedRoute[]) => d.length === 0}
        empty={<EmptyPanel title="Every corridor is open" />}
      >
        {(rows) => (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Road", "Status", "Risk", "Incident", "Vehicles", "Shipments", "Clearance"].map(
                    (h) => (
                      <th key={h} className="label-mono px-4 py-3 font-normal">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.road_id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <span className="stat-num text-[13px] text-ink">{r.road_number}</span>
                      <p className="text-[12px] text-ink-muted">{r.road_name}</p>
                    </td>
                    <td className={cn("px-4 py-3 text-[12.5px]", STATUS_TONE[r.status])}>
                      {r.status}
                    </td>
                    <td className="px-4 py-3">
                      <span className="stat-num text-[13px] text-ink">
                        {r.risk_score.toFixed(0)}
                      </span>
                      <span className="ml-1.5 text-[11.5px] text-ink-muted">{r.risk_level}</span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-[12.5px] text-ink-muted">
                      {r.incident_title ?? "—"}
                    </td>
                    <td className="stat-num px-4 py-3 text-[13px] text-ink">
                      {r.affected_vehicles}
                    </td>
                    <td className="stat-num px-4 py-3 text-[13px] text-ink">
                      {r.affected_shipments}
                    </td>
                    <td className="stat-num px-4 py-3 text-[13px] text-ink">
                      {r.estimated_clearance_minutes ? `${r.estimated_clearance_minutes}m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
