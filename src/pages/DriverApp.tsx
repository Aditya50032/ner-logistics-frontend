import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  Check,
  CloudRain,
  Construction,
  Droplets,
  Gauge,
  MapPin,
  Mountain,
  Navigation,
  Phone,
  Timer,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DriverRecovery } from "@/components/driver/DriverRecovery";
import { useAsync } from "@/lib/useAsync";
import { api } from "@/lib/api";
import { ROUTES, VEHICLES } from "@/lib/nerData";
import { cn, humanise, minutesToHm, riskColor, roadStatusColor } from "@/lib/utils";
import type { IncidentType } from "@/types";

const REPORT_TYPES: { type: IncidentType; label: string; icon: typeof Mountain }[] = [
  { type: "LANDSLIDE", label: "Landslide", icon: Mountain },
  { type: "FLOOD", label: "Flooding", icon: Droplets },
  { type: "HEAVY_RAIN", label: "Heavy rain", icon: CloudRain },
  { type: "ROAD_DAMAGE", label: "Road damage", icon: Construction },
  { type: "TRAFFIC", label: "Traffic jam", icon: Timer },
  { type: "ACCIDENT", label: "Accident", icon: TriangleAlert },
];

export default function DriverApp() {
  const vehicle = VEHICLES[2]; // AR-01-A-8834, held at Bomdila — the interesting case
  const route = ROUTES.find((r) => r.id === vehicle.route_id) ?? ROUTES[0];
  const [tab, setTab] = useState<"route" | "relay" | "report">("route");
  // The driver only sees a relay tab when one is actually assigned to them.
  const relay = useAsync(() => api.recoveries(true), []);
  const myRelay = relay.data?.[0] ?? null;
  const [online, setOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState(api.pendingReports());

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const blocking = route.segments.find((s) => s.status === "BLOCKED");

  return (
    <div className="mx-auto min-h-screen max-w-[520px] bg-navy-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line/80 bg-navy-950/90 px-4 py-3.5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[15px] font-medium text-white">{vehicle.vehicle_number}</p>
            <p className="text-[12px] text-ink-muted">
              {vehicle.origin} → {vehicle.destination}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!online && <Chip label="Offline" color="#F59E0B" />}
            <Link to="/" className="label-mono">
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Blocking warning takes the top slot — it is the only thing that matters right now */}
      {blocking && (
        <div className="m-4 rounded-xl border border-signal-blocked/45 bg-signal-blocked/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-signal-blocked" />
            <div>
              <p className="text-[14px] font-medium text-white">Road ahead is closed</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                {blocking.road_number} between {blocking.from} and {blocking.to}. {blocking.note}
              </p>
              <p className="mt-2 font-mono text-[12px] text-signal-blocked">
                Hold at {blocking.from} · review in {minutesToHm(blocking.estimated_delay)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="danger" size="sm">
              <Phone className="h-4 w-4" /> Call control room
            </Button>
            <Button variant="subtle" size="sm" onClick={() => setTab("report")}>
              Report status
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mx-4 flex rounded-lg border border-line p-1">
        {((myRelay
          ? (["route", "relay", "report"] as const)
          : (["route", "report"] as const)
        ) as readonly ("route" | "relay" | "report")[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-2 text-[13px] capitalize transition-colors",
              tab === t ? "bg-navy-700 text-white" : "text-ink-muted",
            )}
          >
            {t === "route" ? "My route" : t === "relay" ? "Cargo relay" : "Report"}
          </button>
        ))}
      </div>

      {tab === "relay" && myRelay && (
        <div className="p-4">
          <DriverRecovery recoveryId={myRelay.id} />
        </div>
      )}

      {tab === "route" && (
        <div className="space-y-4 p-4">
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-700 text-white">{route.route_name}</h2>
              <Chip label={route.risk_level} color={riskColor(route.risk_level)} />
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy-700">
              <div
                className="h-full rounded-full bg-signal-open"
                style={{ width: `${vehicle.progress}%` }}
              />
            </div>
            <p className="label-mono mt-2">{vehicle.progress}% of {route.distance_km} km covered</p>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line/60 pt-4">
              {[
                [Gauge, `${vehicle.speed} km/h`, "Speed"],
                [Navigation, vehicle.eta, "Status"],
                [Timer, `+${minutesToHm(route.estimated_time_minutes - route.normal_time_minutes)}`, "Delay"],
              ].map(([Icon, value, label], i) => {
                const I = Icon as typeof Gauge;
                return (
                  <div key={i}>
                    <I className="h-4 w-4 text-ink-faint" />
                    <p className="mt-1.5 text-[13.5px] text-white">{value as string}</p>
                    <p className="label-mono mt-0.5">{label as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Road ahead</h3>
            </div>
            <ol className="p-4">
              {route.segments.map((s, idx) => {
                const color = roadStatusColor(s.status);
                const last = idx === route.segments.length - 1;
                return (
                  <li key={idx} className="grid grid-cols-[24px_1fr] gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {!last && <span className="mt-1 w-px flex-1" style={{ backgroundColor: `${color}44` }} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] text-white">
                          {s.from} → {s.to}
                        </span>
                        <Chip label={humanise(s.status)} color={color} dot={false} />
                      </div>
                      <p className="label-mono mt-1">
                        {s.road_number} · {s.distance_km} km · +{s.estimated_delay} min
                      </p>
                      {s.note && <p className="mt-1 text-[12.5px] text-ink-muted">{s.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="panel p-4">
            <h3 className="panel-title">Cargo</h3>
            <div className="mt-3 grid gap-2 text-[13px] text-ink-muted">
              <Row label="Commodity" value={humanise(vehicle.cargo_type)} />
              <Row label="Weight" value={`${vehicle.cargo_weight} t`} />
              <Row label="Vehicle" value={vehicle.vehicle_type} />
              <Row label="Driver" value={vehicle.driver_name} />
            </div>
          </div>
        </div>
      )}

      {tab === "report" && (
        <ReportForm
          online={online}
          queued={queued}
          onQueued={() => setQueued(api.pendingReports())}
          vehicleNumber={vehicle.vehicle_number}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line/50 pb-2 last:border-0">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function ReportForm({
  online,
  queued,
  onQueued,
  vehicleNumber,
}: {
  online: boolean;
  queued: number;
  onQueued: () => void;
  vehicleNumber: string;
}) {
  const [type, setType] = useState<IncidentType | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<null | { queued: boolean }>(null);

  async function submit() {
    if (!type) return;
    const result = await api.submitFieldReport({
      incident_type: type,
      description: note,
      vehicle_number: vehicleNumber,
      latitude: 27.2646,
      longitude: 92.4159,
      network_status: online ? "ONLINE" : "OFFLINE",
      reported_at: new Date().toISOString(),
    });
    setSent({ queued: result.queued });
    onQueued();
  }

  if (sent) {
    return (
      <div className="p-4">
        <div className="panel grid place-items-center p-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-signal-open/15">
            <Check className="h-6 w-6 text-signal-open" />
          </span>
          <p className="mt-4 font-display text-[16px] font-700 text-white">
            {sent.queued ? "Saved on this phone" : "Report sent"}
          </p>
          <p className="mt-2 max-w-[16rem] text-[13px] leading-relaxed text-ink-muted">
            {sent.queued
              ? "It will upload on its own once you have signal. Keep driving."
              : "The district officer has it and will verify shortly."}
          </p>
          <Button
            variant="subtle"
            size="sm"
            className="mt-5"
            onClick={() => {
              setSent(null);
              setType(null);
              setNote("");
            }}
          >
            Report something else
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {!online && (
        <div className="flex items-start gap-3 rounded-xl border border-signal-partial/40 bg-signal-partial/10 p-3.5">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-signal-partial" />
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            No signal. Your report is saved on the phone and uploads automatically when the network returns.
            {queued > 0 && ` ${queued} report${queued > 1 ? "s" : ""} waiting.`}
          </p>
        </div>
      )}

      <div className="panel p-4">
        <h3 className="panel-title">What did you see?</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {REPORT_TYPES.map(({ type: t, label, icon: Icon }) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-3 text-left text-[13px] transition-colors",
                type === t
                  ? "border-signal-open/60 bg-signal-open/10 text-white"
                  : "border-line text-ink-muted hover:border-ink-faint",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", type === t ? "text-signal-open" : "text-ink-faint")} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <label className="panel-title" htmlFor="note">
          Anything else? (optional)
        </label>
        <textarea
          id="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Half the road is gone about 2 km after the checkpost"
          className="mt-3 w-full rounded-lg border border-line bg-navy-900/80 px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-signal-open"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4" /> Add photo
          </Button>
          <span className="flex items-center gap-1.5 text-[12px] text-ink-faint">
            <MapPin className="h-3.5 w-3.5" /> 27.265, 92.416 attached
          </span>
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={!type} onClick={submit}>
        {online ? "Send report" : "Save report"}
      </Button>
      <p className="text-center text-[12px] text-ink-faint">
        Reports go to the district officer for verification before they appear on the public map.
      </p>
    </div>
  );
}
