import { formatDistanceToNowStrict, parseISO } from "date-fns";
import type { ProjectType } from "@/types";

export function timeAgo(iso?: string) {
  if (!iso) return "Unknown";
  try {
    return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
  } catch {
    return "Recently";
  }
}

export function projectTypeLabel(type: ProjectType) {
  if (type === "fixed") return "Fixed Price";
  if (type === "hourly") return "Hourly";
  return "Not specified";
}

export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function compactMoney(n: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}
