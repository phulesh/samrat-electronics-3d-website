import type { Opportunity } from "@/types";

export function getApplyUrl(item: Pick<Opportunity, "isVerified" | "applicationUrl" | "projectUrl" | "sourceUrl" | "verifiedUrl">) {
  if (!item.isVerified) return "";
  const candidates = [item.applicationUrl, item.projectUrl, item.sourceUrl].filter(Boolean) as string[];
  if (item.verifiedUrl && candidates.includes(item.verifiedUrl)) return item.verifiedUrl;
  return item.verifiedUrl || candidates[0] || "";
}

export function hasVerifiedApplyUrl(item: Pick<Opportunity, "isDemo" | "isVerified" | "applicationUrl" | "projectUrl" | "sourceUrl" | "verifiedUrl">) {
  return !item.isDemo && item.isVerified && Boolean(getApplyUrl(item));
}
