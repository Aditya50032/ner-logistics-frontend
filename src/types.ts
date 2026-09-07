/**
 * Domain types mirroring the FastAPI/Pydantic response models.
 * Keep these in sync with backend schemas — they are the contract for src/lib/api.ts.
 */

export type Role =
  | "SUPER_ADMIN"
  | "GOVERNMENT_OFFICER"
  | "DISTRICT_OFFICER"
  | "FIELD_OFFICER"
  | "DRIVER";

export type AccessibilityStatus = "ACCESSIBLE" | "PARTIALLY_ACCESSIBLE" | "BLOCKED";
export type RoadStatus = "OPEN" | "PARTIAL" | "BLOCKED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentType =
  | "LANDSLIDE"
  | "FLOOD"
  | "HEAVY_RAIN"
  | "ROAD_DAMAGE"
  | "BRIDGE_DAMAGE"
  | "TRAFFIC"
  | "ACCIDENT"
  | "OTHER";

export type IncidentStatus = "REPORTED" | "UNDER_REVIEW" | "VERIFIED" | "RESOLVED";

export type VehicleStatus =
  | "IDLE"
  | "IN_TRANSIT"
  | "DELAYED"
  | "STOPPED"
  | "DELIVERED"
  | "EMERGENCY";

export type CargoType =
  | "MEDICINES"
  | "FOOD"
  | "CONSTRUCTION_MATERIAL"
  | "AGRICULTURAL_PRODUCE"
  | "EMERGENCY_RELIEF"
  | "OTHER";

export type ShipmentPriority = "NORMAL" | "HIGH" | "CRITICAL";
export type ShipmentStatus = "PLANNED" | "IN_TRANSIT" | "DELAYED" | "DELIVERED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  state?: string;
  district?: string;
  is_active: boolean;
}

export interface StateRef {
  id: string;
  name: string;
  code: string;
  districts: number;
  accessible_pct: number;
}

export interface District {
  id: string;
  state_id: string;
  state_name: string;
  name: string;
  lat: number;
  lng: number;
  accessibility_status: AccessibilityStatus;
  risk_score: number;
  population: number;
  last_updated: string;
}

export interface Road {
  id: string;
  road_name: string;
  road_number: string;
  road_type: string;
  status: RoadStatus;
  risk_level: RiskLevel;
  current_speed: number;
  normal_speed: number;
  estimated_delay_minutes: number;
  path: [number, number][];
  last_updated: string;
}

export interface Incident {
  id: string;
  incident_type: IncidentType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  status: IncidentStatus;
  reported_by: string;
  reported_at: string;
  photo_url?: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  driver_name: string;
  vehicle_type: string;
  cargo_type: CargoType;
  cargo_weight: number;
  origin: string;
  destination: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  eta: string;
  progress: number;
  route_id: string;
  last_gps_update: string;
}

export interface RouteSegment {
  road_number: string;
  road_name: string;
  from: string;
  to: string;
  distance_km: number;
  status: RoadStatus;
  risk_score: number;
  estimated_delay: number;
  note?: string;
}

export interface RoutePlan {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  normal_time_minutes: number;
  estimated_time_minutes: number;
  risk_score: number;
  risk_level: RiskLevel;
  status: RoadStatus;
  path: [number, number][];
  segments: RouteSegment[];
  prediction: RoutePrediction;
}

export interface RoutePrediction {
  landslide_probability: number;
  flood_probability: number;
  rainfall_risk: number;
  traffic_risk: number;
  road_damage_risk: number;
  overall_risk: number;
  predicted_delay_minutes: number;
  model_version: string;
}

export interface Shipment {
  id: string;
  /** Backend-only fields. Absent when the UI is running on the bundled demo dataset. */
  reference?: string;
  verification_code?: string;
  vehicle_id?: string | null;
  weight_kg?: number;
  commodity: string;
  cargo_type: CargoType;
  priority: ShipmentPriority;
  origin: string;
  destination: string;
  quantity: number;
  unit: string;
  status: ShipmentStatus;
  expected_delivery: string;
  vehicle_number: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: IncidentType | "SUPPLY" | "SYSTEM";
  severity: Severity;
  location: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  districts_monitored: number;
  accessible_routes_pct: number;
  active_alerts: number;
  live_vehicles: number;
  on_time_delivery_pct: number;
  disrupted_routes: number;
}

export interface ConnectivityPoint {
  day: string;
  accessible: number;
  partial: number;
  blocked: number;
}

export interface DelayPoint {
  corridor: string;
  delay: number;
  baseline: number;
}

export interface AnalyticsBundle {
  connectivity_trend: ConnectivityPoint[];
  delay_by_corridor: DelayPoint[];
  incidents_by_type: { type: string; count: number }[];
  rainfall_vs_risk: { hour: string; rainfall: number; risk: number }[];
}

/* ===================================================================
   Intelligence layer — AI risk, disruption detection, freight, recovery.
   Mirrors app/schemas/intelligence.py on the backend.
   =================================================================== */

export interface ComponentRisk {
  probability: number;
  percent: number;
  level: RiskLevel;
  drivers: string[];
  model: string;
}

/** An AI Risk Estimate. Decision support, never presented as a guaranteed forecast. */
export interface RiskAssessment {
  latitude: number;
  longitude: number;
  district: string | null;
  state: string | null;
  landslide: ComponentRisk;
  flood: ComponentRisk;
  traffic: ComponentRisk;
  road_damage: ComponentRisk;
  weather: ComponentRisk;
  overall_score: number;
  overall_percent: number;
  overall_level: RiskLevel;
  predicted_delay_minutes: number;
  drivers: string[];
  recommendation: string;
  model_version: string;
  is_estimate: boolean;
}

export interface RouteRisk {
  route_id: string;
  route_name: string;
  origin: string;
  destination: string;
  assessment: RiskAssessment;
}

export type DisruptionStatus =
  | "NORMAL"
  | "POSSIBLE_DISRUPTION"
  | "LIKELY_BLOCKED"
  | "VERIFIED_BLOCKED";

export interface DisruptionSignal {
  kind: string;
  weight: number;
  detail: string;
}

export interface DisruptionEvent {
  id: string;
  road_id: string | null;
  incident_id: string | null;
  latitude: number;
  longitude: number;
  status: DisruptionStatus;
  confidence: number;
  signals: DisruptionSignal[] | null;
  ai_risk_score: number;
  affected_vehicle_ids: string[] | null;
  affected_shipment_ids: string[] | null;
  district: string | null;
  state: string | null;
  resolved_at: string | null;
  last_signal_at: string | null;
  created_at: string;
}

export type OptimisationMode = "FASTEST" | "SAFEST" | "LOWEST_COST" | "BALANCED";

export interface RouteOption {
  label: string;
  road_numbers: string[];
  waypoints: { name: string; lat: number; lng: number }[];
  distance_km: number;
  estimated_time_minutes: number;
  estimated_delay_minutes: number;
  risk_score: number;
  risk_level: RiskLevel;
  estimated_cost: number;
  optimisation_score: number;
  rank: number;
  is_blocked: boolean;
  reasons: string[];
}

export interface RoutePlanResult {
  id: string;
  origin: string;
  destination: string;
  optimisation_mode: OptimisationMode;
  options: RouteOption[];
  selected_option_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export type FreightAction = "WAIT" | "REROUTE" | "CARGO_RELAY";

export interface FreightOption {
  action: FreightAction;
  feasible: boolean;
  estimated_delay_minutes: number;
  estimated_cost: number;
  risk_score: number;
  detail: string;
  blockers: string[];
  payload: Record<string, unknown>;
}

export interface FreightDecision {
  shipment_id: string;
  shipment_reference: string;
  recommended_action: FreightAction;
  options: FreightOption[];
  rationale: string;
}

export interface CandidateVehicle {
  vehicle_id: string;
  vehicle_number: string;
  distance_km: number;
  distance_to_destination_km: number;
  available_capacity_kg: number;
  capacity_kg: number;
  eta_minutes: number;
  suitability_score: number;
  risk_score: number;
  ranking: number;
  handover: string;
  reasons: string[];
}

export interface ConsolidationProposal {
  id: string;
  vehicle_id: string;
  shipment_ids: string[] | null;
  total_weight_kg: number;
  vehicle_capacity_kg: number;
  utilisation_pct: number;
  estimated_cost_saving: number;
  estimated_distance_saved_km: number;
  destination: string | null;
  status: string;
}

export interface RecoveryCandidate {
  id: string;
  vehicle_id: string;
  distance_to_stranded_vehicle_km: number;
  available_capacity_kg: number;
  vehicle_capacity_kg: number;
  estimated_arrival_minutes: number;
  estimated_recovery_time_minutes: number;
  estimated_cost: number;
  overall_score: number;
  recommendation_rank: number;
  reasons: string[] | null;
  status: string;
  vehicle: Vehicle | null;
}

export interface RecoveryRequest {
  id: string;
  shipment_id: string;
  stranded_vehicle_id: string;
  status: string;
  reason: string;
  priority: string;
  stranded_latitude: number;
  stranded_longitude: number;
  recommended_vehicle_id: string | null;
  justification: string | null;
  predicted_delay_minutes: number | null;
  search_radius_km: number | null;
  failure_reason: string | null;
  district: string | null;
  state: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface RecoveryDetail extends RecoveryRequest {
  shipment: Shipment | null;
  stranded_vehicle: Vehicle | null;
  recommended_vehicle: Vehicle | null;
  transfer_location: {
    id: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    safety_score: number;
  } | null;
  candidates: RecoveryCandidate[];
}

export interface TimelineEntry {
  at: string;
  time: string;
  event: string;
  detail: string;
}

export interface SimulationScenario {
  id: string;
  label: string;
  description: string;
}

export interface SimulationStep {
  clock: string;
  step: string;
  detail: string;
  entity_type: string | null;
  entity_id: string | null;
}

export interface SimulationRun {
  id: string;
  scenario: string;
  status: string;
  simulated_clock_minutes: number;
  steps: SimulationStep[] | null;
  created_at: string;
  ended_at: string | null;
}

export interface AnalyticsOverview {
  total_roads: number;
  accessible_roads: number;
  partially_accessible_roads: number;
  blocked_roads: number;
  active_incidents: number;
  high_risk_corridors: number;
  active_vehicles: number;
  delayed_vehicles: number;
  critical_shipments: number;
  deliveries_at_risk: number;
  active_recoveries: number;
  open_disruptions: number;
  average_delay_minutes: number;
  on_time_delivery_pct: number;
  fleet_utilisation_pct: number;
  estimated_delay_cost_inr: number;
}

export interface SupplyCategoryStat {
  cargo_type: string;
  total: number;
  in_transit: number;
  delayed: number;
  delivered: number;
  critical: number;
  at_risk: number;
}

export interface DisruptedRoute {
  road_id: string;
  road_number: string;
  road_name: string;
  district: string | null;
  status: string;
  risk_level: RiskLevel;
  risk_score: number;
  incident_title: string | null;
  affected_vehicles: number;
  affected_shipments: number;
  estimated_clearance_minutes: number;
}
