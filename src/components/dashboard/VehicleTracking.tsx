import { useState } from "react";
import { Gauge, MapPin, Navigation } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { NerMap } from "./NerMap";
import { cn, humanise, timeAgo, vehicleColor } from "@/lib/utils";
import type { District, Incident, RoutePlan, Vehicle, VehicleStatus } from "@/types";

const FILTERS: (VehicleStatus | "ALL")[] = ["ALL", "IN_TRANSIT", "DELAYED", "STOPPED", "EMERGENCY", "IDLE"];

export function VehicleTracking({
  vehicles,
  districts,
  routes,
  incidents,
}: {
  vehicles: Vehicle[];
  districts: District[];
  routes: RoutePlan[];
  incidents: Incident[];
}) {
  const [filter, setFilter] = useState<VehicleStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const list = filter === "ALL" ? vehicles : vehicles.filter((v) => v.status === filter);
  const shown = selected ? [selected] : list;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Live Vehicle Tracking"
          hint={`${list.length} of ${vehicles.length} vehicles shown${selected ? ` · focused on ${selected.vehicle_number}` : ""}`}
          action={
            selected ? (
              <button onClick={() => setSelected(null)} className="text-[12.5px] text-signal-open hover:underline">
                Show all
              </button>
            ) : undefined
          }
        />
        <div className="p-3">
          <NerMap districts={districts} routes={routes} incidents={incidents} vehicles={shown} height={520} />
        </div>
      </Panel>

      <Panel className="flex h-full flex-col overflow-hidden">
        <PanelHeader title="Fleet" hint="Tap a vehicle to isolate it on the map" />
        <div className="flex flex-wrap gap-1.5 border-b border-line/60 px-4 py-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSelected(null);
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors",
                filter === f
                  ? "border-signal-open/50 bg-signal-open/10 text-signal-open"
                  : "border-line text-ink-faint hover:text-ink",
              )}
            >
              {f === "ALL" ? "All" : humanise(f)}
            </button>
          ))}
        </div>

        <div className="max-h-[520px] divide-y divide-line/60 overflow-y-auto">
          {list.map((v) => {
            const color = vehicleColor(v.status);
            const active = selected?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelected(active ? null : v)}
                className={cn(
                  "w-full px-4 py-3.5 text-left transition-colors hover:bg-navy-700/40",
                  active && "bg-navy-700/50",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[13px] font-medium text-white">{v.vehicle_number}</span>
                  <Chip label={humanise(v.status)} color={color} />
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink-muted">
                  {v.origin} → {v.destination} · {humanise(v.cargo_type)}
                </p>

                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${v.progress}%`, backgroundColor: color }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-faint">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" /> {v.speed} km/h
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3.5 w-3.5" /> ETA {v.eta}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {timeAgo(v.last_gps_update)}
                  </span>
                </div>
              </button>
            );
          })}
          {list.length === 0 && (
            <PanelBody>
              <p className="text-[13px] text-ink-muted">
                No vehicles with this status right now. Choose another filter to see the rest of the fleet.
              </p>
            </PanelBody>
          )}
        </div>
      </Panel>
    </div>
  );
}
