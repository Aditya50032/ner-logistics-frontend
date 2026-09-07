import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Construction, ShieldCheck, Truck, Waypoints } from "lucide-react";
import { KpiCard, Sidebar, Topbar, type ViewId, NAV } from "@/components/dashboard/Shell";
import { NerMap } from "@/components/dashboard/NerMap";
import { AlertsPanel, DisruptedRoutes as SeededDisruptedRoutes, IncidentFeed, SupplyStatus } from "@/components/dashboard/Panels";
import { RiskMonitor } from "@/components/dashboard/RiskMonitor";
import { RecoveryOps } from "@/components/dashboard/RecoveryOps";
import { FreightOps } from "@/components/dashboard/FreightOps";
import { DisruptedRoutes as LiveDisruptedRoutes, SimulationPanel } from "@/components/dashboard/SimulationPanel";
import { useLiveEvents } from "@/lib/useLiveEvents";
import { RoutePlanner } from "@/components/dashboard/RoutePlanner";
import { VehicleTracking } from "@/components/dashboard/VehicleTracking";
import { Analytics } from "@/components/dashboard/Analytics";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { api, apiState } from "@/lib/api";
import { ALERTS, ANALYTICS, DISTRICTS, INCIDENTS, ROUTES, SHIPMENTS, STATES, STATS, VEHICLES } from "@/lib/nerData";
import { cn } from "@/lib/utils";
import type { Alert, AnalyticsBundle, AnalyticsOverview, DashboardStats, District, Incident, RoutePlan, Shipment, StateRef, Vehicle } from "@/types";

export default function Dashboard() {
  const [view, setView] = useState<ViewId>("overview");
  const [collapsed, setCollapsed] = useState(false);

  const [stats, setStats] = useState<DashboardStats>(STATS);
  const [districts, setDistricts] = useState<District[]>(DISTRICTS);
  const [routes, setRoutes] = useState<RoutePlan[]>(ROUTES);
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);
  const [shipments, setShipments] = useState<Shipment[]>(SHIPMENTS);
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);
  const [analytics, setAnalytics] = useState<AnalyticsBundle>(ANALYTICS);
  const [states, setStates] = useState<StateRef[]>(STATES);
  // Computed KPIs from the backend. Null until the API answers, and every card falls
  // back to the seeded figure rather than showing a blank tile.
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Live events push a refresh instead of the operator hunting for a reload button.
  const { status: liveStatus } = useLiveEvents((event) => {
    if (
      event.event.startsWith("disruption") ||
      event.event.startsWith("road") ||
      event.event.startsWith("recovery") ||
      event.event.startsWith("alert")
    ) {
      setRefreshKey((k) => k + 1);
    }
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [s, d, r, i, v, sh, a, an, st] = await Promise.all([
        api.stats(),
        api.districts(),
        api.routes(),
        api.incidents(),
        api.vehicles(),
        api.shipments(),
        api.alerts(),
        api.analytics(),
        api.states(),
      ]);
      const liveOverview = await api.overview().catch(() => null);
      if (!cancelled) setOverview(liveOverview);
      if (cancelled) return;
      setStats(s);
      setDistricts(d);
      setRoutes(r);
      setIncidents(i);
      setVehicles(v);
      setShipments(sh);
      setAlerts(a);
      setAnalytics(an);
      setStates(st);
    }
    load();
    // Poll while the operator is watching; the backend also exposes a websocket feed.
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar view={view} onChange={setView} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar view={view} unread={unread} />

        {/* Mobile section switcher */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-line/70 px-4 py-2.5 lg:hidden">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                "whitespace-nowrap rounded-md border px-3 py-1.5 text-[12.5px] transition-colors",
                view === id ? "border-signal-open/50 bg-signal-open/10 text-signal-open" : "border-line text-ink-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <main className="flex-1 space-y-4 p-4 lg:p-6">
          {!apiState.live && (
            <p className="rounded-lg border border-signal-info/30 bg-signal-info/10 px-4 py-2.5 text-[12.5px] text-ink-muted">
              Showing the seeded NER dataset. Set <code className="font-mono text-signal-info">VITE_API_BASE_URL</code>{" "}
              and start the FastAPI service to switch to live data.
            </p>
          )}

          {view === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <KpiCard
                  label="Districts Monitored"
                  value={stats.districts_monitored}
                  icon={ShieldCheck}
                  color="#22C55E"
                  footnote={`${states.length} states`}
                />
                <KpiCard
                  label="Accessible Roads"
                  value={overview ? overview.accessible_roads : stats.accessible_routes_pct}
                  icon={Waypoints}
                  color="#3B82F6"
                  footnote={overview ? `of ${overview.total_roads} monitored` : "seeded figure"}
                />
                <KpiCard
                  label="Active Alerts"
                  value={overview ? overview.active_incidents : stats.active_alerts}
                  delta={`${unread} unread`}
                  icon={AlertTriangle}
                  color="#EF4444"
                  footnote={overview ? `${overview.open_disruptions} open detections` : "last 24 hours"}
                />
                <KpiCard
                  label="Live Vehicles"
                  value={overview ? overview.active_vehicles : stats.live_vehicles}
                  icon={Truck}
                  color="#8B5CF6"
                  footnote={
                    overview
                      ? `${overview.delayed_vehicles} delayed · ${overview.fleet_utilisation_pct}% loaded`
                      : `${vehicles.filter((v) => v.status === "IN_TRANSIT").length} in transit`
                  }
                />
                <KpiCard
                  label="On-time Deliveries"
                  value={overview ? overview.on_time_delivery_pct : stats.on_time_delivery_pct}
                  suffix="%"
                  icon={CheckCircle2}
                  color="#22C55E"
                  footnote={
                    overview ? `${overview.average_delay_minutes.toFixed(0)} min average delay` : "rolling 7 days"
                  }
                />
                <KpiCard
                  label="Blocked Roads"
                  value={overview ? overview.blocked_roads : stats.disrupted_routes}
                  icon={Construction}
                  color="#F59E0B"
                  footnote={
                    overview ? `${overview.active_recoveries} recovery operation(s)` : "needs rerouting"
                  }
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
                <Panel className="overflow-hidden">
                  <PanelHeader
                    title="North East Connectivity"
                    hint="District accessibility, corridor risk, verified incidents and live fleet"
                  />
                  <div className="p-3">
                    <NerMap districts={districts} routes={routes} incidents={incidents} vehicles={vehicles} height={460} />
                  </div>
                </Panel>
                <AlertsPanel alerts={alerts} />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <SeededDisruptedRoutes routes={routes} onSelect={() => setView("disruptions")} />
                <SupplyStatus shipments={shipments.slice(0, 6)} />
              </div>
            </>
          )}

          {view === "map" && (
            <Panel className="overflow-hidden">
              <PanelHeader title="Connectivity Map" hint="Toggle layers to isolate districts, corridors, incidents or fleet" />
              <div className="p-3">
                <NerMap districts={districts} routes={routes} incidents={incidents} vehicles={vehicles} height={640} />
              </div>
            </Panel>
          )}

          {view === "routes" && (
            <RoutePlanner routes={routes} districts={districts} incidents={incidents} vehicles={vehicles} />
          )}

          {view === "vehicles" && (
            <VehicleTracking vehicles={vehicles} districts={districts} routes={routes} incidents={incidents} />
          )}

          {view === "incidents" && (
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
              <IncidentFeed incidents={incidents} />
              <AlertsPanel alerts={alerts} />
            </div>
          )}

          {view === "supply" && (
            <div className="grid gap-4">
              <SupplyStatus shipments={shipments} />
              <SeededDisruptedRoutes routes={routes} onSelect={() => setView("disruptions")} />
            </div>
          )}

          {view === "analytics" && <Analytics data={analytics} states={states} />}

          {liveStatus !== "open" && apiState.live && (
            <p className="rounded-lg border border-signal-partial/30 bg-signal-partial/10 px-4 py-2.5 text-[12.5px] text-ink-muted">
              Live event stream is {liveStatus}. Data below is from the last successful load;
              it will refresh automatically once the socket reconnects.
            </p>
          )}

          {view === "risk" && <RiskMonitor key={refreshKey} />}

          {view === "disruptions" && <LiveDisruptedRoutes key={refreshKey} />}

          {view === "freight" && <FreightOps />}

          {view === "recovery" && <RecoveryOps key={refreshKey} />}

          {view === "simulation" && (
            <SimulationPanel onComplete={() => setRefreshKey((k) => k + 1)} />
          )}

          {view === "settings" && (
            <Panel>
              <PanelHeader title="Settings" hint="Access control and data sources" />
              <PanelBody className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-line/70 bg-navy-900/50 p-4">
                  <h4 className="font-display text-[14px] font-700 text-white">Roles in this deployment</h4>
                  <ul className="mt-3 grid gap-2 text-[13px] text-ink-muted">
                    {[
                      ["SUPER_ADMIN", "Full access, user management, audit log"],
                      ["GOVERNMENT_OFFICER", "All states, planning and analytics"],
                      ["DISTRICT_OFFICER", "Own district, verify incidents"],
                      ["FIELD_OFFICER", "Report incidents, upload photos"],
                      ["DRIVER", "Assigned route and reporting only"],
                    ].map(([role, scope]) => (
                      <li key={role} className="flex flex-wrap justify-between gap-2 border-b border-line/50 pb-2 last:border-0">
                        <span className="font-mono text-[12px] text-ink">{role}</span>
                        <span className="text-[12.5px]">{scope}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-line/70 bg-navy-900/50 p-4">
                  <h4 className="font-display text-[14px] font-700 text-white">Data sources</h4>
                  <ul className="mt-3 grid gap-2 text-[13px] text-ink-muted">
                    <li>Road and bridge status — NHIDCL and state PWD feeds</li>
                    <li>Weather and rainfall — IMD observations and forecasts</li>
                    <li>Vehicle positions — GPS telemetry, 30-second polling</li>
                    <li>Incidents — field officer and driver reports, verified by district</li>
                  </ul>
                  <p className="label-mono mt-4">
                    API: {import.meta.env.VITE_API_BASE_URL || "not configured — using seeded data"}
                  </p>
                </div>
              </PanelBody>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}
