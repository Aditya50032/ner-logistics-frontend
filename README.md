# NER Logistics Intelligence — Frontend

**Smart Connectivity, Stronger North East**

AI-powered logistics accessibility and disruption intelligence for India's North Eastern Region.
This repository is the frontend: a public site, a government operations dashboard, and a
driver interface that installs as a PWA.

## Run it

```bash
npm install
cp .env.example .env      # optional — leave VITE_API_BASE_URL blank to run on seeded data
npm run dev               # http://localhost:5173
```

| Route        | What it is                                                        |
| ------------ | ----------------------------------------------------------------- |
| `/`          | Public landing page with the live NER overview                     |
| `/login`     | Role-based sign-in (demo accounts listed on the page)              |
| `/dashboard` | Government operations control room                                 |
| `/driver`    | Truck driver mobile interface, offline-capable                     |

## How it talks to the backend

Everything goes through `src/lib/api.ts`. Each method calls the FastAPI endpoint first and
falls back to `src/lib/nerData.ts` if `VITE_API_BASE_URL` is unset or the request fails, then
flips `apiState.live` to `false` so the UI shows "Demo data" instead of pretending. Nothing is
hardcoded inside components — point the env var at your API and every screen switches over.

Endpoints the frontend expects:

```
POST /auth/login            -> { access_token, user }
GET  /dashboard/stats       -> DashboardStats
GET  /states | /districts | /roads | /routes
GET  /incidents | /vehicles | /shipments | /alerts | /analytics
POST /routes/plan           -> RoutePlan   { origin, destination }
POST /field-reports         -> { id, queued }
```

The JWT is sent as `Authorization: Bearer <token>`; a 401 clears the session. Response shapes
are typed in `src/types.ts` — keep those in sync with your Pydantic models and TypeScript will
catch drift at build time.

The dev server proxies `/api` to `http://localhost:8000`, so Docker Compose works without CORS
configuration.

## Structure

```
src/
  components/ui/          Button, Panel, Chip — shadcn-compatible, `npx shadcn add` works alongside
  components/site/        Public navbar and the drawn hero backdrop
  components/dashboard/   Shell, NerMap, Panels, RoutePlanner, VehicleTracking, Analytics
  pages/                  Landing, Login, Dashboard, DriverApp
  lib/api.ts              The only place that talks to FastAPI
  lib/nerData.ts          Seeded NER dataset (8 states, 30 districts, 7 corridors, 12 vehicles)
  lib/utils.ts            cn(), status colours, formatters
  types.ts                Domain types shared with the backend contract
```

## Design notes

One status vocabulary runs through the whole product: green open, amber partial, red blocked,
blue informational. Map polylines, chips, progress bars and charts all read their colour from
`STATUS_HEX` in `src/lib/utils.ts`, so an operator never has to relearn what a colour means
between the map and a table.

Sora carries the display type, Inter the body, and JetBrains Mono every number, coordinate and
highway designation — the mono face is what makes the dashboard read as an instrument rather
than a web page.

## Offline behaviour

Driver reports are posted to `/field-reports`. If the request fails, the report is stored in
`localStorage` under `ner.report_queue` and the driver is told plainly that it will upload later.
Wire a service worker with Workbox for background sync when you deploy.


## Intelligence sections (added)

Six new dashboard sections, all reading from the FastAPI backend:

| Section | What it shows | Endpoints |
|---|---|---|
| AI Risk Monitor | Per-corridor landslide / flood / traffic / road-damage estimates with the model's own top contributions | `GET /predictions/routes`, `POST /predictions/refresh` |
| Disrupted Routes | Open detection events with confidence and signals, plus degraded corridors and their impact | `GET /disruptions`, `POST /disruptions/scan`, `GET /analytics/disrupted-routes` |
| Route Planner | Four optimisation modes producing ranked alternatives | `POST /routing/plan`, `POST /routing/plans/{id}/approve` |
| Freight Optimisation | Route optimiser and shipment consolidation | `POST /freight/consolidate`, `GET /freight/consolidations` |
| Emergency Recovery | Stranded consignments, the WAIT/REROUTE/RELAY comparison, ranked replacements, approval | `GET /recovery`, `POST /recovery/{id}/analyze`, `/approve`, `/assign` |
| Simulation | Eight scenarios on a compressed clock, with the real step log | `GET /simulation/scenarios`, `POST /simulation/run`, `POST /simulation/reset` |

Every AI-derived figure is labelled an AI Risk Estimate, and every cost is labelled an
estimated operational cost rather than an official tariff.

### Data states

`src/lib/useAsync.ts` and `src/components/ui/states.tsx` give every backend-backed panel
the same four states: loading skeleton, error with a retry, empty with a hint, and loaded.
No panel can render blank on a failed request.

Endpoints in the intelligence layer compute their answers from live data, so there is no
honest seeded fallback for them. When the backend is unreachable those views show an error
with a retry rather than substituting invented numbers. The original platform views keep
their seeded fallback and flip the topbar to "Demo data".

### Live updates

`src/lib/useLiveEvents.ts` subscribes to `/ws/recovery` with reconnect backoff. Disruption,
road, recovery and alert events trigger a refresh of the affected section. The banner tells
the operator when the socket is down, so a stale view is never mistaken for a live one.

### Driver relay

`src/components/driver/DriverRecovery.tsx` adds a Cargo relay tab that appears only when a
relay is actually assigned to that driver. Accept, decline, arrival, QR verification and
transfer confirmation each call a real endpoint. Write operations carry an idempotency key
held in localStorage per recovery per step, so a retry over a bad connection cannot create
a second transfer.
