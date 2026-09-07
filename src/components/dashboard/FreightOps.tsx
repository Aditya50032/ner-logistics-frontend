/**
 * Freight Optimisation.
 *
 * Two halves: the route optimiser with its four modes, and shipment consolidation. The
 * modes genuinely disagree — FASTEST will happily take a high-risk corridor that SAFEST
 * refuses — so the comparison is worth showing rather than collapsing to one answer.
 */
import { Boxes, Loader2, Route as RouteIcon, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useState } from "react";

import { AsyncBoundary, EmptyPanel } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import type { OptimisationMode, RiskLevel, RouteOption, RoutePlanResult } from "@/types";

const MODES: { id: OptimisationMode; label: string; icon: typeof Zap; hint: string }[] = [
  { id: "FASTEST", label: "Fastest", icon: Zap, hint: "Minimise travel time" },
  { id: "SAFEST", label: "Safest", icon: ShieldCheck, hint: "Minimise corridor risk" },
  { id: "LOWEST_COST", label: "Lowest cost", icon: Wallet, hint: "Minimise operational spend" },
  { id: "BALANCED", label: "Balanced", icon: RouteIcon, hint: "Weigh all four together" },
];

const RISK_TONE: Record<RiskLevel, string> = {
  LOW: "text-signal-open",
  MEDIUM: "text-signal-partial",
  HIGH: "text-signal-high",
  CRITICAL: "text-signal-blocked",
};

function rupees(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function hours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function OptionCard({ option, best }: { option: RouteOption; best: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        option.is_blocked
          ? "border-signal-blocked/40 opacity-70"
          : best
            ? "border-signal-open/50 bg-signal-open/[0.06]"
            : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{option.label}</p>
          <p className="label-mono mt-0.5">{option.road_numbers.join(" · ") || "—"}</p>
        </div>
        {best && !option.is_blocked && (
          <span className="shrink-0 rounded bg-signal-open/15 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-signal-open">
            Recommended
          </span>
        )}
        {option.is_blocked && (
          <span className="shrink-0 rounded bg-signal-blocked/15 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-signal-blocked">
            Blocked
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
        {[
          ["Distance", `${option.distance_km.toFixed(0)} km`, ""],
          ["Time", hours(option.estimated_time_minutes), ""],
          ["Risk", `${option.risk_score.toFixed(0)} ${option.risk_level}`, RISK_TONE[option.risk_level]],
          ["Cost", rupees(option.estimated_cost), ""],
        ].map(([label, value, tone]) => (
          <div key={label}>
            <dt className="label-mono">{label}</dt>
            <dd className={cn("stat-num mt-0.5 text-[13px] text-ink", tone)}>{value}</dd>
          </div>
        ))}
      </dl>

      {option.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 border-l-2 border-line pl-3">
          {option.reasons.map((r, i) => (
            <li key={i} className="text-[12px] leading-relaxed text-ink-muted">
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RouteOptimiser() {
  const [origin, setOrigin] = useState("Guwahati");
  const [destination, setDestination] = useState("Tawang");
  const [mode, setMode] = useState<OptimisationMode>("BALANCED");
  const [plan, setPlan] = useState<RoutePlanResult | null>(null);

  const optimise = useAction(() =>
    api.optimiseRoute({ origin, destination, mode, cargo_weight_kg: 7800, priority: "CRITICAL" }),
  );
  const approve = useAction((planId: string, optionId: string) =>
    api.approveRouteOption(planId, optionId),
  );

  const run = async () => {
    const result = await optimise.run();
    if (result) setPlan(result);
  };

  return (
    <div className="panel p-5">
      <h3 className="text-[15px] font-semibold text-ink">Route optimiser</h3>
      <p className="mt-0.5 text-[12.5px] text-ink-muted">
        Blocked roads are excluded outright; high-risk segments carry a time penalty.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ["Origin", origin, setOrigin],
          ["Destination", destination, setDestination],
        ].map(([label, value, set]) => (
          <label key={label as string} className="block">
            <span className="label-mono">{label as string}</span>
            <input
              value={value as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-navy-800 px-3 py-2 text-[13px] text-ink outline-none transition focus:border-signal-open/60"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {MODES.map(({ id, label, icon: Icon, hint }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            title={hint}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] transition",
              mode === id
                ? "border-signal-open/50 bg-signal-open/10 text-signal-open"
                : "border-line text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={optimise.pending}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-navy-700 px-4 py-2 text-[12.5px] text-ink ring-1 ring-line transition hover:ring-signal-open/50 disabled:opacity-50"
      >
        {optimise.pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RouteIcon className="h-3.5 w-3.5" />
        )}
        Generate alternatives
      </button>

      {optimise.error && (
        <p className="mt-3 rounded-lg border border-signal-blocked/40 p-3 text-[12.5px] text-signal-blocked">
          {optimise.error}
        </p>
      )}

      {plan && (
        <div className="mt-5 space-y-3">
          {plan.options.length === 0 ? (
            <EmptyPanel
              title="No route found"
              hint="Every path between these places is blocked on the current network."
            />
          ) : (
            <>
              {plan.options.map((o, i) => (
                <div key={`${o.label}-${i}`}>
                  <OptionCard option={o} best={i === 0} />
                </div>
              ))}
              {approve.error && (
                <p className="text-[12.5px] text-signal-blocked">{approve.error}</p>
              )}
              <p className="label-mono">Estimated operational cost — not an official tariff</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Consolidation() {
  const list = useAsync(() => api.consolidations(), []);
  const propose = useAction(() => api.proposeConsolidation());

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Shipment consolidation</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Groups pending consignments heading the same way onto one under-used vehicle.
          </p>
        </div>
        <button
          onClick={async () => {
            await propose.run();
            list.reload();
          }}
          disabled={propose.pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-open/50 hover:text-signal-open disabled:opacity-50"
        >
          {propose.pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Boxes className="h-3.5 w-3.5" />
          )}
          Find opportunities
        </button>
      </div>

      {propose.error && (
        <p className="mt-3 text-[12.5px] text-signal-blocked">{propose.error}</p>
      )}

      <div className="mt-4">
        <AsyncBoundary
          state={list}
          loadingLabel="Loading proposals"
          emptyWhen={(d) => d.length === 0}
          empty={
            <EmptyPanel
              title="No consolidation opportunities"
              hint="Two or more pending shipments must share a destination and fit one idle vehicle above the minimum utilisation."
            />
          }
        >
          {(rows) => (
            <div className="space-y-2.5">
              {rows.map((p) => (
                <div key={p.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-[13px] text-ink">
                      {(p.shipment_ids ?? []).length} shipments → {p.destination ?? "destination"}
                    </span>
                    <span className="stat-num text-[13px] text-signal-open">
                      {p.utilisation_pct.toFixed(0)}% utilised
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-muted">
                    <span>
                      {(p.total_weight_kg / 1000).toFixed(1)}T of{" "}
                      {(p.vehicle_capacity_kg / 1000).toFixed(1)}T
                    </span>
                    <span>saves {p.estimated_distance_saved_km.toFixed(0)} km</span>
                    <span>saves about {rupees(p.estimated_cost_saving)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AsyncBoundary>
      </div>
    </div>
  );
}

export function FreightOps() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <RouteOptimiser />
      <Consolidation />
    </div>
  );
}
