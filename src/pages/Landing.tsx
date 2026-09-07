import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Construction,
  HeartPulse,
  LayoutDashboard,
  Map as MapIcon,
  Route,
  ShieldCheck,
  Truck,
  Users,
  Waypoints,
} from "lucide-react";
import { Navbar, Logo } from "@/components/site/Navbar";
import { RidgeBackdrop } from "@/components/site/RidgeBackdrop";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { STATS } from "@/lib/nerData";
import type { DashboardStats } from "@/types";

const OVERVIEW = [
  { key: "districts_monitored", label: "Districts Monitored", icon: ShieldCheck, color: "#22C55E", suffix: "" },
  { key: "accessible_routes_pct", label: "Accessible Routes", icon: Waypoints, color: "#3B82F6", suffix: "%" },
  { key: "active_alerts", label: "Active Alerts", icon: AlertTriangle, color: "#EF4444", suffix: "" },
  { key: "live_vehicles", label: "Live Vehicles", icon: Truck, color: "#8B5CF6", suffix: "" },
  { key: "on_time_delivery_pct", label: "On-time Deliveries", icon: CheckCircle2, color: "#22C55E", suffix: "%" },
  { key: "disrupted_routes", label: "Disrupted Routes", icon: Construction, color: "#F59E0B", suffix: "" },
] as const;

const CAPABILITIES = [
  {
    icon: MapIcon,
    color: "#22C55E",
    title: "Real-time Connectivity",
    body: "Monitor road, bridge and transport accessibility across all districts in real-time.",
  },
  {
    icon: CloudRain,
    color: "#3B82F6",
    title: "AI Disruption Prediction",
    body: "Predict landslides, floods, heavy rainfall and other disruptions before they impact.",
  },
  {
    icon: Route,
    color: "#8B5CF6",
    title: "Smart Route Optimization",
    body: "AI-powered alternate routes with estimated delays and risk analysis.",
  },
  {
    icon: Truck,
    color: "#F59E0B",
    title: "Live Vehicle Tracking",
    body: "Track movement of essential supplies with real-time GPS integration.",
  },
  {
    icon: ClipboardList,
    color: "#22C55E",
    title: "Field Reporting",
    body: "Field officers can report incidents with geo-tagged updates even in offline mode.",
  },
];

const AUDIENCES = [
  { icon: Users, title: "For Government", body: "Better decision making and faster response" },
  { icon: Truck, title: "For Logistics Operators", body: "Optimized operations and reduced delays" },
  { icon: HeartPulse, title: "For Essential Supplies", body: "Ensure timely delivery of critical commodities" },
  { icon: Building2, title: "For Field Officers", body: "Easy reporting and real-time information sharing" },
];

export default function Landing() {
  const [stats, setStats] = useState<DashboardStats>(STATS);

  useEffect(() => {
    api.stats().then(setStats);
  }, []);

  return (
    <div id="home" className="min-h-screen bg-navy-900">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden pt-[76px]">
        <RidgeBackdrop />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-24">
          <div className="animate-rise">
            <div className="flex items-center gap-3">
              <span className="flex items-center">
                <span className="h-px w-10 bg-signal-open/70" />
                <span className="h-2 w-2 rounded-full border border-signal-open bg-navy-900" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal-open">
                AI-Powered Logistics Platform for North East Region
              </span>
            </div>

            <h1 className="mt-6 font-display text-[44px] font-800 leading-[1.02] tracking-tight text-white sm:text-[58px] lg:text-[68px]">
              Intelligent Logistics.
              <br />
              Stronger <span className="text-signal-open">North East.</span>
            </h1>

            <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-muted">
              Real-time connectivity monitoring, AI-powered route optimization, and disruption intelligence to
              ensure seamless movement of essential goods across the North Eastern Region.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/dashboard">
                <Button size="lg">
                  <LayoutDashboard className="h-[18px] w-[18px]" /> Explore Dashboard
                </Button>
              </Link>
              <a href="#about">
                <Button variant="outline" size="lg">
                  Learn More <ArrowRight className="h-[18px] w-[18px]" />
                </Button>
              </a>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-line/70 pt-6">
              {[
                ["8", "North Eastern states"],
                ["7", "Priority corridors"],
                ["24×7", "Disruption watch"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-[22px] font-700 tabular-nums text-white">{value}</dt>
                  <dd className="label-mono mt-1">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live overview card */}
          <div className="panel animate-rise p-5 lg:p-6" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-700 text-white">Real-time NER Overview</h2>
              <LiveDot />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
              {OVERVIEW.map(({ key, label, icon: Icon, color, suffix }) => (
                <div key={key}>
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full"
                    style={{ backgroundColor: `${color}1F`, border: `1px solid ${color}40` }}
                  >
                    <Icon className="h-[19px] w-[19px]" style={{ color }} />
                  </span>
                  <p className="mt-3 font-display text-[26px] font-700 leading-none tabular-nums text-white">
                    {stats[key]}
                    {suffix}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-ink-muted">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-4">
              <span className="label-mono">Sources: NHIDCL · IMD · GPS telemetry</span>
              <Link to="/dashboard" className="text-[12.5px] text-signal-open hover:underline">
                Open control room
              </Link>
            </div>
          </div>
        </div>

        {/* ---------- Capability cards ---------- */}
        <div id="features" className="relative mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {CAPABILITIES.map(({ icon: Icon, color, title, body }) => (
              <article
                key={title}
                className="panel group relative overflow-hidden p-5 transition-colors hover:border-line"
              >
                <Icon className="h-6 w-6" style={{ color }} />
                <h3 className="mt-4 font-display text-[15.5px] font-700 text-white">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{body}</p>
                <span
                  className="mt-5 block h-0.5 w-14 rounded-full transition-all duration-500 group-hover:w-24"
                  style={{ backgroundColor: color }}
                />
              </article>
            ))}
          </div>
        </div>

        {/* ---------- Audience strip ---------- */}
        <div className="relative border-y border-line/80 bg-navy-950/60">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-x-10 gap-y-8 px-5 py-9 lg:px-8">
            <div className="flex max-w-sm items-start gap-3">
              <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-signal-open" />
              <div>
                <h3 className="font-display text-[16px] font-700 text-white">Built for a Stronger North East</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  Empowering government, logistics operators and field teams with intelligent insights.
                </p>
              </div>
            </div>
            <div className="grid flex-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {AUDIENCES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3 border-l border-line/70 pl-5">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 text-ink-faint" />
                  <div>
                    <h4 className="font-display text-[14px] font-700 text-white">{title}</h4>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- About ---------- */}
      <section id="about" className="scroll-mt-24 border-b border-line/70 py-20">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="label-mono">The problem</span>
            <h2 className="mt-3 max-w-lg font-display text-[34px] font-700 leading-tight text-white sm:text-[40px]">
              One landslide can cut a district off for a week.
            </h2>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-ink-muted">
              The North East moves on a handful of national highways threading through young, rain-soaked
              mountains. When a slope fails on NH-6 or Sela Pass shuts, the consignment that matters — vaccines,
              rice, relief kits — sits still while dispatchers find out by phone, hours later.
            </p>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-muted">
              NER Logistics Intelligence puts road status, weather, incident reports and vehicle telemetry on one
              screen, then scores each corridor so officers can act before a delay becomes a shortage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button variant="subtle">Government dashboard</Button>
              </Link>
              <Link to="/driver">
                <Button variant="outline">Driver interface</Button>
              </Link>
            </div>
          </div>

          <div className="panel divide-y divide-line/70">
            {[
              ["Detection today", "Phone calls and word of mouth", "Hours"],
              ["Detection with NER-LI", "Geo-tagged field reports plus telemetry", "Under 5 minutes"],
              ["Rerouting today", "Manual, after the vehicle is stuck", "Reactive"],
              ["Rerouting with NER-LI", "Risk-scored alternates issued to the driver", "Before departure"],
            ].map(([label, detail, value]) => (
              <div key={label} className="flex items-center justify-between gap-6 p-5">
                <div>
                  <p className="font-display text-[14px] font-700 text-white">{label}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{detail}</p>
                </div>
                <span className="shrink-0 font-mono text-[12px] uppercase tracking-[0.12em] text-signal-open">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Solutions ---------- */}
      <section id="solutions" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8">
          <span className="label-mono">Solutions</span>
          <h2 className="mt-3 font-display text-[34px] font-700 text-white sm:text-[40px]">
            Two interfaces, one picture of the region.
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="panel p-7">
              <LayoutDashboard className="h-7 w-7 text-signal-open" />
              <h3 className="mt-5 font-display text-[20px] font-700 text-white">Government Operations Dashboard</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
                A control room for state and district officers: district accessibility on a live map, disruption
                alerts as they are verified, corridor risk scores, fleet positions and supply status.
              </p>
              <ul className="mt-6 grid gap-2.5 text-[13.5px] text-ink-muted">
                {[
                  "Role-based access for state, district and field officers",
                  "AI route planner with segment-level delay estimates",
                  "Connectivity analytics and incident history",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-open" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="mt-7 inline-block">
                <Button variant="subtle">
                  Open dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </article>

            <article className="panel p-7">
              <Truck className="h-7 w-7 text-signal-partial" style={{ color: "#F59E0B" }} />
              <h3 className="mt-5 font-display text-[20px] font-700 text-white">Truck Driver Mobile Interface</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
                A phone-first view for the person actually on the highway: what is ahead on the route, where to
                hold, and a two-tap way to report a blockage that works with no signal.
              </p>
              <ul className="mt-6 grid gap-2.5 text-[13.5px] text-ink-muted">
                {[
                  "Turn-by-turn risk warnings for the assigned corridor",
                  "Offline incident reporting that syncs when signal returns",
                  "Installable as a PWA on any Android handset",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-open" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/driver" className="mt-7 inline-block">
                <Button variant="subtle">
                  Open driver view <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Contact ---------- */}
      <section id="contact" className="scroll-mt-24 border-t border-line/70 py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <span className="label-mono">Contact us</span>
            <h2 className="mt-3 font-display text-[32px] font-700 text-white">Bring your district onto the map.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
              Tell us which corridors you manage and we will set up a walkthrough with your seeded district data.
            </p>
            <div className="mt-8 grid gap-3 text-[13.5px] text-ink-muted">
              <p>Operations desk · ner-logistics@example.gov.in</p>
              <p>Control room · +91 361 000 0000</p>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer className="border-t border-line/70 bg-navy-950/70">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Logo />
          <p className="text-[12.5px] text-ink-faint">
            Built for the Smart India Hackathon · Demonstration data for the North Eastern Region
          </p>
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  if (sent) {
    return (
      <div className="panel grid place-items-center p-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-signal-open" />
        <p className="mt-4 font-display text-[16px] font-700 text-white">Request received</p>
        <p className="mt-2 max-w-sm text-[13.5px] text-ink-muted">
          The operations desk will reach out to {email || "you"} within two working days.
        </p>
        <Button variant="ghost" size="sm" className="mt-5" onClick={() => setSent(false)}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <div className="panel p-6">
      <div className="grid gap-4">
        <Field label="Department or organisation" value={org} onChange={setOrg} placeholder="Directorate of Transport, Assam" />
        <Field label="Official email" value={email} onChange={setEmail} placeholder="name@nic.in" type="email" />
        <div className="grid gap-1.5">
          <label className="label-mono" htmlFor="note">
            Corridors you manage
          </label>
          <textarea
            id="note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="NH-6 Guwahati–Shillong, NH-306 Silchar–Aizawl"
            className="rounded-lg border border-line bg-navy-900/80 px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-signal-open"
          />
        </div>
        <Button className="mt-1" onClick={() => setSent(true)}>
          Request a walkthrough
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="grid gap-1.5">
      <label className="label-mono" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border border-line bg-navy-900/80 px-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-signal-open"
      />
    </div>
  );
}
