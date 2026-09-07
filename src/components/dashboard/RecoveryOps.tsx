/**
 * Emergency Freight Recovery.
 *
 * The officer-facing side of cargo relay: what is stranded, what the optimiser compared,
 * which replacement it recommends and why, and the approval action. Every button here
 * calls a real endpoint and reflects what came back.
 */
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PackageSearch,
  Scale,
  Truck,
} from "lucide-react";
import { useState } from "react";

import { AsyncBoundary, EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/ui/states";
import { api } from "@/lib/api";
import { useAction, useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";
import type { FreightAction, RecoveryDetail, RecoveryRequest, TimelineEntry } from "@/types";

const TERMINAL = new Set(["TRANSFER_COMPLETED", "CANCELLED", "FAILED"]);

const STATUS_TONE: Record<string, string> = {
  DETECTED: "text-signal-partial",
  ANALYZING: "text-signal-partial",
  VEHICLE_SEARCH: "text-signal-partial",
  RECOMMENDATION_READY: "text-signal-high",
  AWAITING_APPROVAL: "text-signal-high",
  APPROVED: "text-signal-open",
  DRIVER_ASSIGNED: "text-signal-open",
  DRIVER_EN_ROUTE: "text-signal-open",
  AT_TRANSFER_LOCATION: "text-signal-open",
  TRANSFER_IN_PROGRESS: "text-signal-open",
  TRANSFER_COMPLETED: "text-signal-open",
  CANCELLED: "text-ink-faint",
  FAILED: "text-signal-blocked",
};

const ACTION_LABEL: Record<FreightAction, string> = {
  WAIT: "Wait for clearance",
  REROUTE: "Reroute the vehicle",
  CARGO_RELAY: "Transfer the cargo",
};

function rupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function minutes(value: number): string {
  if (value < 60) return `${value} min`;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** The WAIT / REROUTE / RELAY comparison for one stranded consignment. */
function FreightComparison({ shipmentId }: { shipmentId: string }) {
  const state = useAsync(() => api.freightOptions(shipmentId), [shipmentId]);

  return (
    <AsyncBoundary state={state} loadingLabel="Comparing options">
      {(decision) => (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {decision.options.map((o) => {
              const chosen = o.action === decision.recommended_action;
              return (
                <div
                  key={o.action}
                  className={cn(
                    "rounded-lg border p-3",
                    chosen
                      ? "border-signal-open/50 bg-signal-open/[0.07]"
                      : o.feasible
                        ? "border-line"
                        : "border-line/60 opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-ink">
                      {ACTION_LABEL[o.action]}
                    </span>
                    {chosen && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-signal-open" />}
                  </div>
                  {o.feasible ? (
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="stat-num text-[15px] text-ink">
                        {minutes(o.estimated_delay_minutes)}
                      </span>
                      <span className="stat-num text-[12.5px] text-ink-muted">
                        {rupees(o.estimated_cost)}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12px] text-signal-blocked">Not available</p>
                  )}
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{o.detail}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-lg border border-line bg-navy-800/40 p-3 text-[12.5px] leading-relaxed text-ink-muted">
            <span className="text-ink">Why: </span>
            {decision.rationale}
          </p>
          <p className="label-mono">Estimated operational cost — not an official tariff</p>
        </div>
      )}
    </AsyncBoundary>
  );
}

function Timeline({ recoveryId }: { recoveryId: string }) {
  const state = useAsync(() => api.recoveryTimeline(recoveryId), [recoveryId]);
  return (
    <AsyncBoundary
      state={state}
      loadingLabel="Loading timeline"
      emptyWhen={(d: TimelineEntry[]) => d.length === 0}
      empty={<EmptyPanel title="No events recorded yet" />}
    >
      {(entries) => (
        <ol className="space-y-2.5 border-l border-line pl-4">
          {entries.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-signal-open ring-2 ring-navy-900" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="label-mono">{e.time}</span>
                <span className="text-[13px] text-ink">{e.event}</span>
              </div>
              {e.detail && <p className="mt-0.5 text-[12px] text-ink-muted">{e.detail}</p>}
            </li>
          ))}
        </ol>
      )}
    </AsyncBoundary>
  );
}

function RecoveryDetailPanel({ id, onChanged }: { id: string; onChanged: () => void }) {
  const state = useAsync(() => api.recovery(id), [id]);
  const [tab, setTab] = useState<"recommendation" | "options" | "timeline">("recommendation");

  const analyse = useAction(() => api.analyseRecovery(id));
  const approve = useAction(() => api.approveRecovery(id, "Approved from the operations dashboard"));
  const assign = useAction(() => api.assignRecovery(id));

  const after = async (fn: () => Promise<unknown>) => {
    await fn();
    state.reload();
    onChanged();
  };

  if (state.loading && !state.settled) return <LoadingPanel label="Loading recovery" rows={5} />;
  if (state.error) return <ErrorPanel message={state.error} onRetry={state.reload} />;
  if (!state.data) return null;

  const r: RecoveryDetail = state.data;
  const top = r.candidates?.[0];
  const actionError = analyse.error ?? approve.error ?? assign.error;
  const busy = analyse.pending || approve.pending || assign.pending;

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">
            {r.shipment?.reference ?? "Recovery request"}
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {r.shipment?.commodity ?? "Consignment"} ·{" "}
            {((r.shipment?.weight_kg ?? 0) / 1000).toFixed(1)}T · {r.priority}
          </p>
        </div>
        <span className={cn("label-mono", STATUS_TONE[r.status] ?? "text-ink-muted")}>
          {r.status.replace(/_/g, " ")}
        </span>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Stranded vehicle", r.stranded_vehicle?.vehicle_number ?? "—"],
          ["Cause", r.reason.replace(/_/g, " ")],
          ["Handover point", r.transfer_location?.name ?? "Not selected"],
          ["Search radius", r.search_radius_km ? `${r.search_radius_km} km` : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="label-mono">{label}</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {r.justification && (
        <p className="mt-4 rounded-lg border border-line bg-navy-800/40 p-3 text-[12.5px] leading-relaxed text-ink-muted">
          <span className="text-ink">Detected because: </span>
          {r.justification}
        </p>
      )}

      <div className="mt-5 flex gap-1 border-b border-line">
        {(
          [
            ["recommendation", "Recommendation"],
            ["options", "Freight options"],
            ["timeline", "Timeline"],
          ] as const
        ).map(([id_, label]) => (
          <button
            key={id_}
            onClick={() => setTab(id_)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[12.5px] transition",
              tab === id_
                ? "border-signal-open text-signal-open"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "recommendation" &&
          (r.candidates?.length ? (
            <div className="space-y-2.5">
              {r.candidates.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "rounded-lg border p-3",
                    c.recommendation_rank === 1
                      ? "border-signal-open/50 bg-signal-open/[0.07]"
                      : "border-line",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-ink-muted" />
                      <span className="stat-num text-[13px] text-ink">
                        {c.vehicle?.vehicle_number ?? "Vehicle"}
                      </span>
                      {c.recommendation_rank === 1 && (
                        <span className="rounded bg-signal-open/15 px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-signal-open">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="stat-num text-[15px] text-ink">
                      {c.overall_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-muted">
                    <span>{c.distance_to_stranded_vehicle_km.toFixed(0)} km away</span>
                    <span>{(c.available_capacity_kg / 1000).toFixed(1)}T free</span>
                    <span>ETA {minutes(c.estimated_arrival_minutes)}</span>
                    <span>{rupees(c.estimated_cost)}</span>
                  </div>
                  {c.reasons && (
                    <ul className="mt-2 space-y-1 border-l-2 border-line pl-3">
                      {c.reasons.slice(0, 4).map((reason, i) => (
                        <li key={i} className="text-[12px] leading-relaxed text-ink-muted">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No replacement vehicles evaluated yet"
              hint="Run the analysis to search the fleet, score every candidate and rank them."
              action={
                <button
                  onClick={() => after(analyse.run)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-open/50 hover:text-signal-open disabled:opacity-50"
                >
                  <PackageSearch className="h-3.5 w-3.5" />
                  Find replacement vehicles
                </button>
              }
            />
          ))}

        {tab === "options" &&
          (r.shipment ? (
            <FreightComparison shipmentId={r.shipment.id} />
          ) : (
            <EmptyPanel title="No shipment attached" />
          ))}

        {tab === "timeline" && <Timeline recoveryId={r.id} />}
      </div>

      {actionError && (
        <p className="mt-4 rounded-lg border border-signal-blocked/40 p-3 text-[12.5px] text-signal-blocked">
          {actionError}
        </p>
      )}

      {!TERMINAL.has(r.status) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {r.status === "DETECTED" && (
            <button
              onClick={() => after(analyse.run)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-700 px-3.5 py-2 text-[12.5px] text-ink ring-1 ring-line transition hover:ring-signal-open/50 disabled:opacity-50"
            >
              {analyse.pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PackageSearch className="h-3.5 w-3.5" />
              )}
              Analyse and rank vehicles
            </button>
          )}
          {r.status === "AWAITING_APPROVAL" && top && (
            <button
              onClick={() => after(approve.run)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-signal-open/15 px-3.5 py-2 text-[12.5px] font-medium text-signal-open ring-1 ring-signal-open/40 transition hover:bg-signal-open/25 disabled:opacity-50"
            >
              {approve.pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve relay to {top.vehicle?.vehicle_number ?? "recommended vehicle"}
            </button>
          )}
          {r.status === "APPROVED" && (
            <button
              onClick={() => after(assign.run)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-700 px-3.5 py-2 text-[12.5px] text-ink ring-1 ring-line transition hover:ring-signal-open/50 disabled:opacity-50"
            >
              {assign.pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
              Assign the driver
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function RecoveryOps() {
  const list = useAsync(() => api.recoveries(false), []);
  const [selected, setSelected] = useState<string | null>(null);
  const detect = useAction(() => api.detectRecoveries());

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-700 ring-1 ring-line">
            <Scale className="h-4 w-4 text-signal-high" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Emergency Freight Recovery</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              Stranded consignments, the options compared for each, and the approval decision.
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await detect.run();
            list.reload();
          }}
          disabled={detect.pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink transition hover:border-signal-open/50 hover:text-signal-open disabled:opacity-50"
        >
          {detect.pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ClipboardList className="h-3.5 w-3.5" />
          )}
          Scan for cargo at risk
        </button>
      </div>

      {detect.error && (
        <p className="panel border-signal-blocked/40 p-3 text-[12.5px] text-signal-blocked">
          {detect.error}
        </p>
      )}

      <AsyncBoundary
        state={list}
        loadingLabel="Loading recovery operations"
        emptyWhen={(d: RecoveryRequest[]) => d.length === 0}
        empty={
          <EmptyPanel
            title="No recovery operations"
            hint="Nothing is stranded. Run a scan to check every in-transit consignment against its thresholds."
          />
        }
      >
        {(rows) => (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div className="space-y-2">
              {rows.map((r) => {
                const active = selected === r.id || (!selected && rows[0].id === r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={cn(
                      "panel w-full p-3 text-left transition",
                      active ? "ring-1 ring-signal-open/50" : "hover:border-line-strong",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="stat-num truncate text-[13px] text-ink">
                        {r.shipment_id.slice(0, 8)}
                      </span>
                      <span className={cn("label-mono", STATUS_TONE[r.status] ?? "text-ink-muted")}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[12px] text-ink-muted">
                      {r.district ?? "Unmapped"} · {r.reason.replace(/_/g, " ")}
                    </p>
                  </button>
                );
              })}
            </div>
            <RecoveryDetailPanel id={selected ?? rows[0].id} onChanged={list.reload} />
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
