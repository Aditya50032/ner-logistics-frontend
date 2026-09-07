/**
 * AI Risk Monitor.
 *
 * Shows what the model produced and why. Every figure here is labelled an estimate,
 * because it is one — a transparent weighted baseline, not a validated forecast. The
 * drivers listed under each corridor are the model's own top contributions, so what the
 * operator reads is the same decomposition that produced the score.
 */
import { Brain, ChevronDown, Clock, Info, RefreshCw } from "lucide-react";
import { useState } from "react";

import { AsyncBoundary, EmptyPanel } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import type { ComponentRisk, RiskLevel, RouteRisk } from "@/types";

const LEVEL_STYLE: Record<RiskLevel, { bar: string; text: string; ring: string }> = {
  LOW: { bar: "bg-signal-open", text: "text-signal-open", ring: "ring-signal-open/40" },
  MEDIUM: { bar: "bg-signal-partial", text: "text-signal-partial", ring: "ring-signal-partial/40" },
  HIGH: { bar: "bg-signal-high", text: "text-signal-high", ring: "ring-signal-high/40" },
  CRITICAL: { bar: "bg-signal-blocked", text: "text-signal-blocked", ring: "ring-signal-blocked/40" },
};

function RiskBar({ label, risk }: { label: string; risk: ComponentRisk }) {
  const style = LEVEL_STYLE[risk.level];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-ink-muted">{label}</span>
        <span className={cn("stat-num text-[13px] tabular-nums", style.text)}>{risk.percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-700">
        <div
          className={cn("h-full rounded-full transition-all duration-500", style.bar)}
          style={{ width: `${Math.max(risk.percent, 2)}%` }}
        />
      </div>
    </div>
  );
}

function formatDelay(minutes: number): string {
  if (minutes < 60) return `+${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `+${h}h ${m}m` : `+${h}h`;
}

function CorridorCard({ item }: { item: RouteRisk }) {
  const [open, setOpen] = useState(false);
  const a = item.assessment;
  const style = LEVEL_STYLE[a.overall_level];

  return (
    <div className={cn("panel p-5 ring-1 ring-inset", style.ring)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{item.route_name}</h3>
          <p className="label-mono mt-0.5">
            {a.district ?? "Unmapped"} · model {a.model_version}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("stat-num text-2xl leading-none", style.text)}>{a.overall_percent}%</p>
          <p className={cn("label-mono mt-1", style.text)}>{a.overall_level}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <RiskBar label="Landslide" risk={a.landslide} />
        <RiskBar label="Flood" risk={a.flood} />
        <RiskBar label="Traffic" risk={a.traffic} />
        <RiskBar label="Road damage" risk={a.road_damage} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted">
          <Clock className="h-3.5 w-3.5" />
          Predicted delay
          <span className="stat-num text-ink">{formatDelay(a.predicted_delay_minutes)}</span>
        </span>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink">{a.recommendation}</p>

      {a.drivers.length > 0 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted transition hover:text-ink"
            aria-expanded={open}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            {open ? "Hide" : "Why this score"}
          </button>
          {open && (
            <ul className="mt-2 space-y-1.5 border-l-2 border-line pl-3">
              {a.drivers.map((d, i) => (
                <li key={i} className="text-[12.5px] leading-relaxed text-ink-muted">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export function RiskMonitor() {
  const state = useAsync(() => api.routeRisks(), []);
  const refresh = useAction(() => api.refreshPredictions());

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-700 ring-1 ring-line">
            <Brain className="h-4 w-4 text-signal-partial" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">AI Risk Monitor</h2>
            <p className="mt-0.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              These are AI Risk Estimates from a transparent baseline model. They support a
              decision; they do not replace one.
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await refresh.run();
            state.reload();
          }}
          disabled={refresh.pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-open/50 hover:text-signal-open disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refresh.pending && "animate-spin")} />
          {refresh.pending ? "Recomputing" : "Recompute risk"}
        </button>
      </div>

      {refresh.error && (
        <p className="panel border-signal-blocked/40 p-3 text-[12.5px] text-signal-blocked">
          {refresh.error}
        </p>
      )}

      <AsyncBoundary
        state={state}
        loadingLabel="Scoring corridors"
        emptyWhen={(d) => d.length === 0}
        empty={
          <EmptyPanel
            title="No corridors to score"
            hint="Seed the route table and the model will produce an estimate for each corridor."
          />
        }
      >
        {(routes) => (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...routes]
              .sort((a, b) => b.assessment.overall_score - a.assessment.overall_score)
              .map((r) => (
                <CorridorCard key={r.route_id} item={r} />
              ))}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
