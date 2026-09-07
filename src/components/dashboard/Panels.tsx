import { useState } from "react";
import { AlertTriangle, CheckCheck, CloudRain, Construction, Droplets, Mountain, PackageCheck, Radio, Timer, TriangleAlert, TruckIcon } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, humanise, minutesToHm, riskColor, roadStatusColor, timeAgo } from "@/lib/utils";
import type { Alert, Incident, RoutePlan, Shipment } from "@/types";

const INCIDENT_ICON = {
  LANDSLIDE: Mountain,
  FLOOD: Droplets,
  HEAVY_RAIN: CloudRain,
  ROAD_DAMAGE: Construction,
  BRIDGE_DAMAGE: Construction,
  TRAFFIC: TruckIcon,
  ACCIDENT: TriangleAlert,
  OTHER: Radio,
  SUPPLY: PackageCheck,
  SYSTEM: Radio,
} as const;

export function AlertsPanel({ alerts, compact = false }: { alerts: Alert[]; compact?: boolean }) {
  const [read, setRead] = useState<Set<string>>(new Set(alerts.filter((a) => a.is_read).map((a) => a.id)));
  const unread = alerts.filter((a) => !read.has(a.id));

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Active Alerts"
        hint={`${unread.length} unread · ${alerts.length} in the last 24 hours`}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRead(new Set(alerts.map((a) => a.id)))}
            disabled={unread.length === 0}
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <div className={cn("divide-y divide-line/60 overflow-y-auto", compact ? "max-h-[320px]" : "max-h-[520px]")}>
        {alerts.map((a) => {
          const Icon = INCIDENT_ICON[a.alert_type] ?? AlertTriangle;
          const color = riskColor(a.severity);
          const isRead = read.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() => setRead((s) => new Set(s).add(a.id))}
              className={cn(
                "flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-navy-700/40",
                isRead && "opacity-55",
              )}
            >
              <span
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: `${color}1A`, border: `1px solid ${color}3D` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[13.5px] font-medium text-white">{a.title}</span>
                  {!isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-open" />}
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-muted">{a.message}</span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip label={a.severity} color={color} dot={false} />
                  <span className="label-mono">
                    {a.location} · {timeAgo(a.created_at)}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function DisruptedRoutes({ routes, onSelect }: { routes: RoutePlan[]; onSelect?: (r: RoutePlan) => void }) {
  const disrupted = [...routes].filter((r) => r.status !== "OPEN").sort((a, b) => b.risk_score - a.risk_score);

  return (
    <Panel>
      <PanelHeader title="Disrupted Routes" hint={`${disrupted.length} corridors running below normal`} />
      <div className="divide-y divide-line/60">
        {disrupted.map((r) => {
          const lost = r.estimated_time_minutes - r.normal_time_minutes;
          return (
            <button
              key={r.id}
              onClick={() => onSelect?.(r)}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-navy-700/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-white">{r.route_name}</span>
                <span className="label-mono mt-1 block">
                  {r.distance_km} km · {r.segments.length} segments
                </span>
              </span>
              <span className="hidden w-28 sm:block">
                <span className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                  <Timer className="h-3.5 w-3.5" /> +{minutesToHm(lost)}
                </span>
              </span>
              <span className="w-24 shrink-0">
                <span className="mb-1 flex items-center justify-between">
                  <span className="label-mono">Risk</span>
                  <span className="font-mono text-[11.5px] tabular-nums" style={{ color: riskColor(r.risk_level) }}>
                    {r.risk_score}
                  </span>
                </span>
                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${r.risk_score}%`, backgroundColor: riskColor(r.risk_level) }}
                  />
                </span>
              </span>
              <Chip label={r.status} color={roadStatusColor(r.status)} />
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function SupplyStatus({ shipments }: { shipments: Shipment[] }) {
  const critical = shipments.filter((s) => s.priority === "CRITICAL").length;
  const delayed = shipments.filter((s) => s.status === "DELAYED").length;

  return (
    <Panel>
      <PanelHeader
        title="Supply Status"
        hint={`${critical} critical consignments · ${delayed} running late`}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-line/60">
              {["Commodity", "Corridor", "Quantity", "Priority", "Status", "Due"].map((h) => (
                <th key={h} className="label-mono px-4 py-2.5 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {shipments.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-navy-700/40">
                <td className="px-4 py-3">
                  <p className="text-[13px] text-white">{s.commodity}</p>
                  <p className="label-mono mt-0.5">{s.vehicle_number}</p>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-ink-muted">
                  {s.origin} → {s.destination}
                </td>
                <td className="px-4 py-3 font-mono text-[12.5px] tabular-nums text-ink-muted">
                  {s.quantity} {s.unit}
                </td>
                <td className="px-4 py-3">
                  <Chip
                    label={s.priority}
                    color={s.priority === "CRITICAL" ? "#EF4444" : s.priority === "HIGH" ? "#F59E0B" : "#5E7391"}
                    dot={false}
                  />
                </td>
                <td className="px-4 py-3">
                  <Chip
                    label={humanise(s.status)}
                    color={s.status === "DELAYED" ? "#F59E0B" : s.status === "DELIVERED" ? "#3B82F6" : "#22C55E"}
                  />
                </td>
                <td className="px-4 py-3 text-[12.5px] text-ink-muted">{s.expected_delivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function IncidentFeed({ incidents }: { incidents: Incident[] }) {
  const [filter, setFilter] = useState<"ALL" | "OPEN">("OPEN");
  const list = filter === "OPEN" ? incidents.filter((i) => i.status !== "RESOLVED") : incidents;

  return (
    <Panel>
      <PanelHeader
        title="Incident Reports"
        hint="Geo-tagged reports from field officers and drivers"
        action={
          <div className="flex rounded-lg border border-line p-0.5">
            {(["OPEN", "ALL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
                  filter === f ? "bg-navy-700 text-white" : "text-ink-faint hover:text-ink",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <PanelBody className="grid gap-3 sm:grid-cols-2">
        {list.map((i) => {
          const Icon = INCIDENT_ICON[i.incident_type] ?? AlertTriangle;
          const color = riskColor(i.severity);
          return (
            <article key={i.id} className="rounded-lg border border-line/70 bg-navy-900/50 p-4">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: `${color}1A`, border: `1px solid ${color}3D` }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-[13.5px] font-medium leading-snug text-white">{i.title}</h4>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{i.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip label={humanise(i.incident_type)} color={color} dot={false} />
                <Chip
                  label={humanise(i.status)}
                  color={i.status === "VERIFIED" ? "#22C55E" : i.status === "RESOLVED" ? "#5E7391" : "#3B82F6"}
                />
                <span className="label-mono">
                  {i.latitude.toFixed(3)}, {i.longitude.toFixed(3)} · {timeAgo(i.reported_at)}
                </span>
              </div>
            </article>
          );
        })}
      </PanelBody>
    </Panel>
  );
}
