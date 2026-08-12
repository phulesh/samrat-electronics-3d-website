import type { SearchResponse } from "@/types";

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
