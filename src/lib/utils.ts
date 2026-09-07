import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AccessibilityStatus, RiskLevel, RoadStatus, Severity, VehicleStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** One colour vocabulary, used by chips, the map and the charts alike. */
export const STATUS_HEX = {
  open: "#22C55E",
  partial: "#F59E0B",
  blocked: "#EF4444",
  info: "#3B82F6",
  route: "#8B5CF6",
  idle: "#5E7391",
} as const;

export function roadStatusColor(status: RoadStatus): string {
  return status === "OPEN" ? STATUS_HEX.open : status === "PARTIAL" ? STATUS_HEX.partial : STATUS_HEX.blocked;
}

export function accessColor(status: AccessibilityStatus): string {
  return status === "ACCESSIBLE"
    ? STATUS_HEX.open
    : status === "PARTIALLY_ACCESSIBLE"
      ? STATUS_HEX.partial
      : STATUS_HEX.blocked;
}

export function riskColor(level: RiskLevel | Severity): string {
  switch (level) {
    case "LOW":
      return STATUS_HEX.open;
    case "MEDIUM":
      return STATUS_HEX.partial;
    case "HIGH":
      return "#FB923C";
    default:
      return STATUS_HEX.blocked;
  }
}

export function vehicleColor(status: VehicleStatus): string {
  switch (status) {
    case "IN_TRANSIT":
      return STATUS_HEX.open;
    case "DELAYED":
      return STATUS_HEX.partial;
    case "EMERGENCY":
      return STATUS_HEX.blocked;
    case "DELIVERED":
      return STATUS_HEX.info;
    case "STOPPED":
      return "#FB923C";
    default:
      return STATUS_HEX.idle;
  }
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

/** "LANDSLIDE" -> "Landslide", "PARTIALLY_ACCESSIBLE" -> "Partially accessible" */
export function humanise(value: string): string {
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function minutesToHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}

export function clockNow(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}
