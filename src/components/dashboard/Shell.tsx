import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bell,
  Boxes,
  Brain,
  ChevronLeft,
  FlaskConical,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Map as MapIcon,
  Package,
  Route,
  Search,
  Settings,
  Truck,
  type LucideProps,
} from "lucide-react";
import { cn, clockNow } from "@/lib/utils";
import { LiveDot } from "@/components/ui/badge";
import { apiState, clearSession, getStoredUser } from "@/lib/api";

export type ViewId =
  | "overview"
  | "map"
  | "risk"
  | "routes"
  | "freight"
  | "recovery"
  | "disruptions"
  | "vehicles"
  | "incidents"
  | "supply"
  | "analytics"
  | "simulation"
  | "settings";

export const NAV: { id: ViewId; label: string; icon: ComponentType<LucideProps> }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "map", label: "Connectivity Map", icon: MapIcon },
  { id: "risk", label: "AI Risk Monitor", icon: Brain },
  { id: "disruptions", label: "Disrupted Routes", icon: AlertOctagon },
  { id: "routes", label: "Route Planner", icon: Route },
  { id: "freight", label: "Freight Optimisation", icon: Boxes },
  { id: "recovery", label: "Emergency Recovery", icon: LifeBuoy },
  { id: "vehicles", label: "Vehicle Tracking", icon: Truck },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "supply", label: "Supply Status", icon: Package },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "simulation", label: "Simulation", icon: FlaskConical },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  view,
  onChange,
  collapsed,
  onToggle,
}: {
  view: ViewId;
  onChange: (v: ViewId) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const user = getStoredUser();

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-line/80 bg-navy-950/80 backdrop-blur-xl transition-[width] duration-300 lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
    >
      <div className="flex h-[68px] items-center gap-3 border-b border-line/70 px-4">
        <Link to="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-700 ring-1 ring-line">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M3 19l6-14 6 8 6-6" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="11" r="3" fill="none" stroke="#3B82F6" strokeWidth="1.8" />
          </svg>
        </Link>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[13.5px] font-700 text-white">NER Logistics</p>
            <p className="label-mono">Control room</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors",
                active ? "bg-signal-open/10 text-white" : "text-ink-muted hover:bg-navy-700/60 hover:text-ink",
              )}
            >
              {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-signal-open" />}
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-signal-open")} />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-line/70 p-3">
        {!collapsed && user && (
          <div className="mb-3 rounded-lg border border-line/70 bg-navy-800/60 p-3">
            <p className="truncate text-[13px] font-medium capitalize text-white">{user.name}</p>
            <p className="label-mono mt-1 truncate">{user.role.replace(/_/g, " ")}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:text-ink"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
          {!collapsed && (
            <Link
              to="/"
              onClick={clearSession}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-line text-[13px] text-ink-muted hover:text-ink"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ view, unread }: { view: ViewId; unread: number }) {
  const [now, setNow] = useState(clockNow());
  const user = getStoredUser();

  useEffect(() => {
    const t = setInterval(() => setNow(clockNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const title = NAV.find((n) => n.id === view)?.label ?? "Overview";

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-4 border-b border-line/80 bg-navy-900/85 px-4 backdrop-blur-xl lg:px-6">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[17px] font-700 text-white">{title}</h1>
        <p className="label-mono mt-0.5">North Eastern Region · All 8 states</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-line bg-navy-800/70 px-3 py-2 xl:flex">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            placeholder="Search district, highway or vehicle"
            className="w-56 bg-transparent text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>

        <span className="hidden font-mono text-[12.5px] tabular-nums text-ink-muted sm:inline">{now} IST</span>

        <LiveDot label={apiState.live ? "Live feed" : "Demo data"} muted={!apiState.live} />

        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted hover:text-ink">
          <Bell className="h-[17px] w-[17px]" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-signal-blocked px-1 font-mono text-[10px] font-medium text-white">
              {unread}
            </span>
          )}
        </button>

        <div className="hidden h-9 items-center gap-2.5 rounded-lg border border-line bg-navy-800/70 pl-2.5 pr-3 md:flex">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-signal-open/20 font-mono text-[11px] text-signal-open">
            {(user?.name ?? "OO").slice(0, 2).toUpperCase()}
          </span>
          <span className="text-[13px] capitalize text-ink">{user?.name ?? "Operations Officer"}</span>
        </div>
      </div>
    </header>
  );
}

export function KpiCard({
  label,
  value,
  suffix = "",
  delta,
  icon: Icon,
  color,
  footnote,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  delta?: string;
  icon: ComponentType<LucideProps>;
  color: string;
  footnote?: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-lg"
          style={{ backgroundColor: `${color}1A`, border: `1px solid ${color}3D` }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color }} />
        </span>
        {delta && (
          <span className="font-mono text-[11px] tabular-nums" style={{ color }}>
            {delta}
          </span>
        )}
      </div>
      <p className="stat-num mt-4">
        {value}
        {suffix}
      </p>
      <p className="mt-1.5 text-[12.5px] text-ink-muted">{label}</p>
      {footnote && <p className="label-mono mt-2">{footnote}</p>}
    </div>
  );
}
