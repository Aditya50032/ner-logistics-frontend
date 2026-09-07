/**
 * Single place the frontend talks to FastAPI.
 *
 * Every method hits the real endpoint first. If VITE_API_BASE_URL is unset or the
 * request fails, it falls back to the bundled NER dataset and flips `apiState.live`
 * to false so the UI can say so honestly instead of pretending.
 */
import * as demo from "./nerData";
import type {
  Alert,
  AnalyticsBundle,
  AnalyticsOverview,
  CandidateVehicle,
  ConsolidationProposal,
  DashboardStats,
  DisruptedRoute,
  DisruptionEvent,
  District,
  FreightDecision,
  Incident,
  OptimisationMode,
  RecoveryDetail,
  RecoveryRequest,
  RiskAssessment,
  Road,
  RoutePlan,
  RoutePlanResult,
  RouteRisk,
  Shipment,
  SimulationRun,
  SimulationScenario,
  StateRef,
  SupplyCategoryStat,
  TimelineEntry,
  User,
  Vehicle,
} from "@/types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "ner.access_token";
const USER_KEY = "ner.user";

export const apiState = { live: Boolean(BASE) };

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error("offline");
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearSession();
    throw new Error("Session expired. Sign in again.");
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Try the API, fall back to seeded data, and record which one answered. */
async function withFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    const data = await request<T>(path);
    apiState.live = true;
    return data;
  } catch {
    apiState.live = false;
    return fallback;
  }
}

/**
 * For endpoints with no seeded equivalent. The intelligence layer computes its answers
 * from live data, so there is nothing honest to fall back to — a failure surfaces as a
 * failure and the UI shows an error state with a retry.
 */
async function live<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) {
    throw new Error(
      "This view needs the backend. Set VITE_API_BASE_URL and start the FastAPI service.",
    );
  }
  const data = await request<T>(path, init);
  apiState.live = true;
  return data;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    if (!BASE) {
      // Demo sign-in: role is taken from the address so every dashboard is reachable.
      const role = email.includes("driver")
        ? "DRIVER"
        : email.includes("field")
          ? "FIELD_OFFICER"
          : email.includes("district")
            ? "DISTRICT_OFFICER"
            : "GOVERNMENT_OFFICER";
      const user: User = {
        id: "demo-user",
        name: email.split("@")[0].replace(/[._]/g, " ") || "Operations Officer",
        email,
        role,
        state: "Assam",
        district: "Kamrup Metropolitan",
        is_active: true,
      };
      localStorage.setItem(TOKEN_KEY, "demo-token");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      apiState.live = false;
      return user;
    }
    const data = await request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    apiState.live = true;
    return data.user;
  },

  stats: () => withFallback<DashboardStats>("/dashboard/stats", demo.STATS),
  states: () => withFallback<StateRef[]>("/states", demo.STATES),
  districts: () => withFallback<District[]>("/districts", demo.DISTRICTS),
  roads: () => withFallback<Road[]>("/roads", demo.ROADS),
  routes: () => withFallback<RoutePlan[]>("/routes", demo.ROUTES),
  incidents: () => withFallback<Incident[]>("/incidents", demo.INCIDENTS),
  vehicles: () => withFallback<Vehicle[]>("/vehicles", demo.VEHICLES),
  shipments: () => withFallback<Shipment[]>("/shipments", demo.SHIPMENTS),
  alerts: () => withFallback<Alert[]>("/alerts", demo.ALERTS),
  analytics: () => withFallback<AnalyticsBundle>("/analytics", demo.ANALYTICS),

  /** POST /routes/plan — the AI planner. Falls back to the closest seeded corridor. */
  async planRoute(origin: string, destination: string): Promise<RoutePlan> {
    try {
      const plan = await request<RoutePlan>("/routes/plan", {
        method: "POST",
        body: JSON.stringify({ origin, destination }),
      });
      apiState.live = true;
      return plan;
    } catch {
      apiState.live = false;
      const match = demo.ROUTES.find(
        (r) =>
          r.origin.toLowerCase() === origin.toLowerCase() &&
          r.destination.toLowerCase() === destination.toLowerCase(),
      );
      if (match) return match;
      throw new Error(`No corridor data for ${origin} → ${destination} yet.`);
    }
  },

  /** POST /field-reports — used by the driver and field officer interface. */
  async submitFieldReport(body: Record<string, unknown>): Promise<{ id: string; queued: boolean }> {
    try {
      return await request<{ id: string; queued: boolean }>("/field-reports", {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch {
      // Offline-first: park it in localStorage and let the driver keep working.
      const queue = JSON.parse(localStorage.getItem("ner.report_queue") ?? "[]");
      const record = { ...body, id: `local-${Date.now()}`, queued: true };
      queue.push(record);
      localStorage.setItem("ner.report_queue", JSON.stringify(queue));
      return { id: record.id as string, queued: true };
    }
  },

  pendingReports(): number {
    return JSON.parse(localStorage.getItem("ner.report_queue") ?? "[]").length;
  },

  /* ================= AI risk predictions ================= */

  riskAtPoint: (lat: number, lng: number) =>
    live<RiskAssessment>(`/predictions/point?latitude=${lat}&longitude=${lng}`),

  routeRisks: () => live<RouteRisk[]>("/predictions/routes"),

  refreshPredictions: () =>
    live<{ routes_scored: number; districts_scored: number; model_version: string }>(
      "/predictions/refresh",
      { method: "POST" },
    ),

  /* ================= disruption detection ================= */

  disruptions: (openOnly = true) =>
    live<DisruptionEvent[]>(`/disruptions?open_only=${openOnly}`),

  scanDisruptions: () =>
    live<{ scanned_points: number; events: DisruptionEvent[]; roads_blocked: number }>(
      "/disruptions/scan",
      { method: "POST" },
    ),

  resolveDisruption: (id: string) =>
    live<{ resolved: boolean }>(`/disruptions/${id}/resolve`, { method: "POST" }),

  promoteDisruption: (id: string, incidentType: string) =>
    live<{ incident_id: string; title: string }>(`/disruptions/${id}/promote`, {
      method: "POST",
      body: JSON.stringify({ incident_type: incidentType }),
    }),

  /* ================= route optimisation ================= */

  optimiseRoute: (body: {
    origin: string;
    destination: string;
    mode: OptimisationMode;
    vehicle_id?: string;
    cargo_weight_kg?: number;
    priority?: string;
  }) => live<RoutePlanResult>("/routing/plan", { method: "POST", body: JSON.stringify(body) }),

  approveRouteOption: (planId: string, optionId: string) =>
    live<RoutePlanResult>(`/routing/plans/${planId}/approve?option_id=${optionId}`, {
      method: "POST",
    }),

  /* ================= freight optimisation ================= */

  freightOptions: (shipmentId: string, clearanceMinutes?: number) =>
    live<FreightDecision>(
      `/freight/evaluate/${shipmentId}` +
        (clearanceMinutes ? `?clearance_minutes=${clearanceMinutes}` : ""),
      { method: "POST" },
    ),

  freightCandidates: (shipmentId: string) =>
    live<CandidateVehicle[]>(`/freight/candidates/${shipmentId}`),

  proposeConsolidation: () =>
    live<ConsolidationProposal[]>("/freight/consolidate", { method: "POST" }),

  consolidations: () => live<ConsolidationProposal[]>("/freight/consolidations"),

  /* ================= emergency cargo recovery ================= */

  recoveries: (activeOnly = false) =>
    live<RecoveryRequest[]>(`/recovery?active_only=${activeOnly}`),

  recovery: (id: string) => live<RecoveryDetail>(`/recovery/${id}`),

  recoveryTimeline: (id: string) => live<TimelineEntry[]>(`/recovery/${id}/timeline`),

  detectRecoveries: (shipmentId?: string) =>
    live<{ created: RecoveryRequest[]; assessments: unknown[] }>("/recovery/detect", {
      method: "POST",
      body: JSON.stringify(shipmentId ? { shipment_id: shipmentId } : {}),
    }),

  analyseRecovery: (id: string) =>
    live<RecoveryDetail>(`/recovery/${id}/analyze`, { method: "POST" }),

  approveRecovery: (id: string, note?: string) =>
    live<RecoveryDetail>(`/recovery/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  assignRecovery: (id: string) =>
    live<RecoveryDetail>(`/recovery/${id}/assign`, { method: "POST" }),

  acceptRecovery: (id: string) =>
    live<RecoveryDetail>(`/recovery/${id}/accept`, { method: "POST" }),

  declineRecovery: (id: string, reason: string) =>
    live<RecoveryDetail>(`/recovery/${id}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  arrivedAtHandover: (id: string) =>
    live<RecoveryDetail>(`/recovery/${id}/arrived`, { method: "POST" }),

  startTransfer: (id: string, idempotencyKey: string) =>
    live<Record<string, unknown>>(`/recovery/${id}/transfer/start`, {
      method: "POST",
      body: JSON.stringify({ idempotency_key: idempotencyKey }),
    }),

  verifyTransfer: (id: string, code: string, side: string) =>
    live<Record<string, unknown>>(`/recovery/${id}/transfer/verify`, {
      method: "POST",
      body: JSON.stringify({ verification_code: code, side }),
    }),

  completeTransfer: (id: string, idempotencyKey: string) =>
    live<Record<string, unknown>>(`/recovery/${id}/transfer/complete`, {
      method: "POST",
      body: JSON.stringify({ idempotency_key: idempotencyKey }),
    }),

  /* ================= simulation ================= */

  scenarios: () => live<SimulationScenario[]>("/simulation/scenarios"),

  runSimulation: (body: {
    scenario: string;
    latitude?: number;
    longitude?: number;
    road_number?: string;
    intensity?: number;
  }) => live<SimulationRun>("/simulation/run", { method: "POST", body: JSON.stringify(body) }),

  simulationRuns: () => live<SimulationRun[]>("/simulation/runs"),

  resetSimulation: () =>
    live<{ reset: boolean }>("/simulation/reset", { method: "POST" }),

  /* ================= analytics ================= */

  overview: () => live<AnalyticsOverview>("/analytics/overview"),
  supplyChain: () => live<SupplyCategoryStat[]>("/analytics/supply-chain"),
  disruptedRoutes: () => live<DisruptedRoute[]>("/analytics/disrupted-routes"),
  recoveryAnalytics: () => live<Record<string, unknown>>("/analytics/recoveries"),
};
