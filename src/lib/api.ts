import type { Opportunity, SearchResponse } from "@/types";

export async function searchLive(query: string): Promise<SearchResponse> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error("Live search unavailable");
  }
  return res.json();
}

export async function fetchSourceStatus() {
  const res = await fetch("/api/sources");
  if (!res.ok) throw new Error("Sources unavailable");
  return res.json() as Promise<{
    sources: SearchResponse["sources"];
    liveConnected: boolean;
    fetchedAt: string;
  }>;
}

export async function verifyOpportunity(opportunity: Opportunity): Promise<Opportunity> {
  const res = await fetch("/api/opportunities/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunity }),
  });
  if (!res.ok) throw new Error("Link verification failed");
  const payload = (await res.json()) as { opportunity: Opportunity };
  return payload.opportunity;
}
