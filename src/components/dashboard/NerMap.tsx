import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { accessColor, humanise, riskColor, roadStatusColor, timeAgo, vehicleColor } from "@/lib/utils";
import { NER_CENTER } from "@/lib/nerData";
import type { District, Incident, RoutePlan, Vehicle } from "@/types";

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

type LayerKey = "districts" | "corridors" | "incidents" | "vehicles";

/** Markers are inline SVG so they inherit the same palette as the rest of the UI. */
function pinIcon(color: string, glyph: "truck" | "warn") {
  const path =
    glyph === "truck"
      ? '<path d="M2 8.5h9v6H2zM11 10.5h3.2l2.3 2.4v1.6H11z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="13.5" cy="15.5" r="1.4" fill="currentColor"/>'
      : '<path d="M9.5 3.2 17 16H2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.5 8v3.4M9.5 13.4v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
  return L.divIcon({
    className: "ner-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:${color}22;border:1px solid ${color}66;color:${color};box-shadow:0 6px 18px -8px ${color}">
      <svg viewBox="0 0 19 19" width="17" height="17">${path}</svg></span>`,
  });
}

export function NerMap({
  districts,
  routes,
  incidents,
  vehicles,
  height = 480,
  focusRoute,
}: {
  districts: District[];
  routes: RoutePlan[];
  incidents: Incident[];
  vehicles: Vehicle[];
  height?: number;
  focusRoute?: RoutePlan | null;
}) {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    districts: true,
    corridors: true,
    incidents: true,
    vehicles: true,
  });

  const shownRoutes = useMemo(() => (focusRoute ? [focusRoute] : routes), [focusRoute, routes]);

  const toggle = (key: LayerKey) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  return (
    <div className="relative overflow-hidden rounded-xl border border-line/80" style={{ height }}>
      <MapContainer
        center={focusRoute ? focusRoute.path[Math.floor(focusRoute.path.length / 2)] : NER_CENTER}
        zoom={focusRoute ? 7 : 6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={TILE_URL}
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          subdomains="abcd"
        />

        {layers.corridors &&
          shownRoutes.map((r) => (
            <Polyline
              key={r.id}
              positions={r.path}
              pathOptions={{ color: riskColor(r.risk_level), weight: 4, opacity: 0.9 }}
            >
              <Tooltip sticky>
                <span className="font-medium">{r.route_name}</span> · {r.distance_km} km · risk {r.risk_score}
              </Tooltip>
            </Polyline>
          ))}

        {layers.districts &&
          districts.map((d) => (
            <CircleMarker
              key={d.id}
              center={[d.lat, d.lng]}
              radius={6}
              pathOptions={{
                color: accessColor(d.accessibility_status),
                fillColor: accessColor(d.accessibility_status),
                fillOpacity: 0.5,
                weight: 1.5,
              }}
            >
              <Popup>
                <strong>{d.name}</strong>
                <br />
                {d.state_name}
                <br />
                Status: {humanise(d.accessibility_status)}
                <br />
                Risk score: {d.risk_score}/100
                <br />
                Population: {d.population.toLocaleString("en-IN")}
                <br />
                <span style={{ color: "#93A5BC" }}>Updated {timeAgo(d.last_updated)}</span>
              </Popup>
            </CircleMarker>
          ))}

        {layers.incidents &&
          incidents
            .filter((i) => i.status !== "RESOLVED")
            .map((i) => (
              <Marker
                key={i.id}
                position={[i.latitude, i.longitude]}
                icon={pinIcon(riskColor(i.severity), "warn")}
              >
                <Popup>
                  <strong>{i.title}</strong>
                  <br />
                  {humanise(i.incident_type)} · {humanise(i.severity)}
                  <br />
                  {i.description}
                  <br />
                  <span style={{ color: "#93A5BC" }}>
                    {i.reported_by} · {timeAgo(i.reported_at)}
                  </span>
                </Popup>
              </Marker>
            ))}

        {layers.vehicles &&
          vehicles.map((v) => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={pinIcon(vehicleColor(v.status), "truck")}>
              <Popup>
                <strong>{v.vehicle_number}</strong> · {humanise(v.status)}
                <br />
                {v.origin} → {v.destination}
                <br />
                {humanise(v.cargo_type)} · {v.cargo_weight} t
                <br />
                {v.speed} km/h · ETA {v.eta}
                <br />
                <span style={{ color: "#93A5BC" }}>GPS {timeAgo(v.last_gps_update)}</span>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Layer switches */}
      <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1.5 rounded-lg border border-line bg-navy-950/90 p-2 backdrop-blur">
        {(
          [
            ["districts", "Districts"],
            ["corridors", "Corridors"],
            ["incidents", "Incidents"],
            ["vehicles", "Vehicles"],
          ] as [LayerKey, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-[12px] text-ink-muted">
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => toggle(key)}
              className="h-3.5 w-3.5 accent-[#22C55E]"
            />
            {label}
          </label>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-3 rounded-lg border border-line bg-navy-950/90 px-3 py-2 backdrop-blur">
        {[
          ["Accessible", roadStatusColor("OPEN")],
          ["Partial", roadStatusColor("PARTIAL")],
          ["Blocked", roadStatusColor("BLOCKED")],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
