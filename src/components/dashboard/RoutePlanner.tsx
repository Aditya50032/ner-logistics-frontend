import { useState } from "react";
import { Loader2, Sparkles, Timer, TriangleAlert } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NerMap } from "./NerMap";
import { api } from "@/lib/api";
import { cn, humanise, minutesToHm, riskColor, roadStatusColor } from "@/lib/utils";
import type { District, Incident, RoutePlan, Vehicle } from "@/types";

const ORIGINS = ["Guwahati", "Silchar", "Jorhat", "Agartala"];
const DESTINATIONS = ["Tawang", "Shillong", "Imphal", "Aizawl", "Ziro", "Kohima"];

const RISK_FACTORS: { key: keyof RoutePlan["prediction"]; label: string }[] = [
  { key: "landslide_probability", label: "Landslide" },
  { key: "flood_probability", label: "Flood" },
  { key: "rainfall_risk", label: "Rainfall" },
  { key: "traffic_risk", label: "Traffic" },
  { key: "road_damage_risk", label: "Road damage" },
];

export function RoutePlanner({
  routes,
  districts,
  incidents,
  vehicles,
}: {
  routes: RoutePlan[];
  districts: District[];
  incidents: Incident[];
  vehicles: Vehicle[];
}) {
  const [origin, setOrigin] = useState("Guwahati");
  const [destination, setDestination] = useState("Tawang");
  const [plan, setPlan] = useState<RoutePlan | null>(routes[0] ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPlanner() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.planRoute(origin, destination);
      setPlan(result);
    } catch (e) {
      setPlan(null);
      setError(e instanceof Error ? e.message : "Route planning failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[400px_1fr]">
      <div className="grid gap-4">
        <Panel>
          <PanelHeader title="AI Route Planner" hint="Scored against live weather, incidents and road status" />
          <PanelBody className="grid gap-4">
            <Select label="Origin" value={origin} options={ORIGINS} onChange={setOrigin} />
            <Select label="Destination" value={destination} options={DESTINATIONS} onChange={setDestination} />
            <Button onClick={runPlanner} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Scoring corridor" : "Plan route"}
            </Button>
            {error && (
              <p className="flex items-start gap-2 rounded-lg border border-signal-blocked/40 bg-signal-blocked/10 p-3 text-[12.5px] text-signal-blocked">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error} Pick one of the seeded corridors below.
              </p>
            )}

            <div className="border-t border-line/60 pt-3">
              <p className="label-mono mb-2">Seeded corridors</p>
              <div className="flex flex-wrap gap-1.5">
                {routes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setPlan(r);
                      setOrigin(r.origin);
                      setDestination(r.destination);
                      setError(null);
                    }}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11.5px] transition-colors",
                      plan?.id === r.id
                        ? "border-signal-open/50 bg-signal-open/10 text-signal-open"
                        : "border-line text-ink-muted hover:text-ink",
                    )}
                  >
                    {r.origin} → {r.destination}
                  </button>
                ))}
              </div>
            </div>
          </PanelBody>
        </Panel>

        {plan && (
          <Panel>
            <PanelHeader title="Risk Breakdown" hint={`Model ${plan.prediction.model_version}`} />
            <PanelBody className="grid gap-3.5">
              {RISK_FACTORS.map(({ key, label }) => {
                const pct = Math.round((plan.prediction[key] as number) * 100);
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[12.5px] text-ink-muted">{label}</span>
                      <span className="font-mono text-[12px] tabular-nums text-ink">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-navy-700">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: riskColor(pct >= 60 ? "HIGH" : pct >= 35 ? "MEDIUM" : "LOW") }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="mt-1 flex items-center justify-between border-t border-line/60 pt-3">
                <span className="text-[13px] text-white">Predicted delay</span>
                <span className="font-mono text-[13px] tabular-nums text-signal-partial" style={{ color: "#F59E0B" }}>
                  +{minutesToHm(plan.prediction.predicted_delay_minutes)}
                </span>
              </div>
            </PanelBody>
          </Panel>
        )}
      </div>

      <div className="grid gap-4">
        <Panel className="overflow-hidden">
          <PanelHeader
            title={plan ? plan.route_name : "Corridor map"}
            hint={
              plan
                ? `${plan.distance_km} km · normal ${minutesToHm(plan.normal_time_minutes)} · now ${minutesToHm(plan.estimated_time_minutes)}`
                : "Select a corridor to focus the map"
            }
            action={plan ? <Chip label={plan.risk_level} color={riskColor(plan.risk_level)} /> : undefined}
          />
          <div className="p-3">
            <NerMap
              districts={districts}
              routes={routes}
              incidents={incidents}
              vehicles={vehicles}
              focusRoute={plan}
              height={380}
            />
          </div>
        </Panel>

        {plan && (
          <Panel>
            <PanelHeader title="Segment Timeline" hint="Where the time is actually being lost" />
            <PanelBody>
              <ol className="relative grid gap-0">
                {plan.segments.map((s, idx) => {
                  const color = roadStatusColor(s.status);
                  const last = idx === plan.segments.length - 1;
                  return (
                    <li key={`${s.road_number}-${idx}`} className="relative grid grid-cols-[28px_1fr] gap-3 pb-5">
                      <div className="flex flex-col items-center">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-navy-800"
                          style={{ backgroundColor: color }}
                        />
                        {!last && <span className="mt-1 w-px flex-1" style={{ backgroundColor: `${color}55` }} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-medium text-white">
                            {s.from} → {s.to}
                          </span>
                          <span className="label-mono">{s.road_number}</span>
                          <Chip label={humanise(s.status)} color={color} dot={false} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
                          <span className="font-mono tabular-nums">{s.distance_km} km</span>
                          <span className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5" /> +{s.estimated_delay} min
                          </span>
                          <span className="font-mono tabular-nums" style={{ color: riskColor(s.risk_score >= 70 ? "CRITICAL" : s.risk_score >= 50 ? "HIGH" : s.risk_score >= 30 ? "MEDIUM" : "LOW") }}>
                            risk {s.risk_score}
                          </span>
                        </div>
                        {s.note && <p className="mt-1.5 text-[12.5px] italic text-ink-faint">{s.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </PanelBody>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="label-mono" htmlFor={label}>
        {label}
      </label>
      <select
        id={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-line bg-navy-900 px-3 text-[13.5px] text-ink focus:border-signal-open"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
