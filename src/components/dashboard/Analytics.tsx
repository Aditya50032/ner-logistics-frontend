import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { STATUS_HEX } from "@/lib/utils";
import type { AnalyticsBundle, StateRef } from "@/types";

const AXIS = { stroke: "#5E7391", fontSize: 11, fontFamily: "JetBrains Mono, monospace" };
const GRID = "#1C3454";

const tooltipStyle = {
  contentStyle: {
    background: "#0E1E33",
    border: "1px solid #1C3454",
    borderRadius: 10,
    fontSize: 12,
    color: "#F1F5F9",
  },
  labelStyle: { color: "#93A5BC", fontSize: 11 },
  cursor: { fill: "rgba(28,52,84,0.35)" },
};

export function Analytics({ data, states }: { data: AnalyticsBundle; states: StateRef[] }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Connectivity Trend" hint="Share of monitored district roads, last 7 days" />
          <PanelBody className="h-[280px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.connectivity_trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {(["open", "partial", "blocked"] as const).map((k) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={STATUS_HEX[k]} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={STATUS_HEX[k]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} unit="%" width={44} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#93A5BC" }} />
                <Area type="monotone" dataKey="accessible" name="Accessible" stroke={STATUS_HEX.open} fill="url(#g-open)" strokeWidth={2} />
                <Area type="monotone" dataKey="partial" name="Partial" stroke={STATUS_HEX.partial} fill="url(#g-partial)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke={STATUS_HEX.blocked} fill="url(#g-blocked)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Delay by Corridor" hint="Minutes lost against normal running time" />
          <PanelBody className="h-[280px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.delay_by_corridor} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="corridor" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} unit="m" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="delay" name="Delay (min)" radius={[4, 4, 0, 0]} maxBarSize={38}>
                  {data.delay_by_corridor.map((d) => (
                    <Cell
                      key={d.corridor}
                      fill={d.delay > 240 ? STATUS_HEX.blocked : d.delay > 90 ? STATUS_HEX.partial : STATUS_HEX.open}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel>
          <PanelHeader title="Rainfall against Corridor Risk" hint="6-hourly rainfall and modelled risk, today" />
          <PanelBody className="h-[280px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.rainfall_vs_risk} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="hour" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis yAxisId="left" tick={AXIS} tickLine={false} axisLine={false} width={44} unit="mm" />
                <YAxis yAxisId="right" orientation="right" tick={AXIS} tickLine={false} axisLine={false} width={40} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#93A5BC" }} />
                <Bar yAxisId="left" dataKey="rainfall" name="Rainfall (mm)" fill={STATUS_HEX.info} radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Line yAxisId="right" type="monotone" dataKey="risk" name="Risk score" stroke={STATUS_HEX.partial} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Incidents by Type" hint="Verified reports, last 30 days" />
          <PanelBody className="grid gap-3.5">
            {data.incidents_by_type.map((row) => {
              const max = Math.max(...data.incidents_by_type.map((r) => r.count));
              return (
                <div key={row.type}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12.5px] text-ink-muted">{row.type}</span>
                    <span className="font-mono text-[12px] tabular-nums text-ink">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-navy-700">
                    <div
                      className="h-full rounded-full bg-signal-info"
                      style={{ width: `${(row.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="State Accessibility" hint="Share of district roads currently accessible" />
        <PanelBody className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {states.map((s) => (
            <div key={s.id} className="rounded-lg border border-line/70 bg-navy-900/50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13.5px] text-white">{s.name}</span>
                <span className="font-mono text-[11px] text-ink-faint">{s.code}</span>
              </div>
              <p className="mt-3 font-display text-[26px] font-700 tabular-nums text-white">{s.accessible_pct}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.accessible_pct}%`,
                    backgroundColor:
                      s.accessible_pct >= 85 ? STATUS_HEX.open : s.accessible_pct >= 70 ? STATUS_HEX.partial : STATUS_HEX.blocked,
                  }}
                />
              </div>
              <p className="label-mono mt-2">{s.districts} districts</p>
            </div>
          ))}
        </PanelBody>
      </Panel>
    </div>
  );
}
