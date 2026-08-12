import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityDrawer } from "@/components/opportunities/OpportunityDrawer";
import { ProposalModal } from "@/components/proposal/ProposalModal";
import { SearchBox } from "@/components/search/SearchBox";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { RankedOpportunity, SearchFilters } from "@/types";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const REGIONS: { id: SearchFilters["region"]; label: string }[] = [
  { id: "worldwide", label: "Worldwide" },
  { id: "india", label: "India" },
  { id: "remote", label: "Remote" },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const smart = params.get("smart") !== "0";
  const runSearch = useAppStore((s) => s.runSearch);
  const results = useAppStore((s) => s.results);
  const loading = useAppStore((s) => s.loading);
  const notice = useAppStore((s) => s.notice);
  const liveConnected = useAppStore((s) => s.liveConnected);
  const sources = useAppStore((s) => s.sources);
  const expandedTerms = useAppStore((s) => s.expandedTerms);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const saveLead = useAppStore((s) => s.saveLead);
  const verifyLink = useAppStore((s) => s.verifyLink);
  const saveSearch = useAppStore((s) => s.saveSearch);
  const query = useAppStore((s) => s.query);

  const [open, setOpen] = useState<RankedOpportunity | undefined>();
  const [prop, setProp] = useState<RankedOpportunity | undefined>();

  useEffect(() => {
    if (q) runSearch(q, smart);
  }, [q, smart, runSearch]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Search</div>
        <h1 className="font-display text-3xl font-bold">“{query || q || "Your skill"}”</h1>
        <div className="mt-4">
          <SearchBox initial={q} onSearch={(value, s) => runSearch(value, s)} />
        </div>
      </div>

      {!liveConnected && (
        <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Live opportunity sources are not connected yet.
        </div>
      )}
      {notice && liveConnected && (
        <div className="mb-4 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">{notice}</div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {REGIONS.map((r) => (
          <Chip key={r.id} active={filters.region === r.id} onClick={() => setFilters({ region: r.id })}>
            {r.label}
          </Chip>
        ))}
        <Chip active={filters.budget} onClick={() => setFilters({ budget: !filters.budget })}>
          Budget
        </Chip>
        <Chip active={filters.projectType === "fixed"} onClick={() => setFilters({ projectType: filters.projectType === "fixed" ? "any" : "fixed" })}>
          Fixed Price
        </Chip>
        <Chip active={filters.projectType === "hourly"} onClick={() => setFilters({ projectType: filters.projectType === "hourly" ? "any" : "hourly" })}>
          Hourly
        </Chip>
        <Chip active={filters.recency === "today"} onClick={() => setFilters({ recency: filters.recency === "today" ? "any" : "today" })}>
          Today
        </Chip>
        <Chip active={filters.recency === "3d"} onClick={() => setFilters({ recency: filters.recency === "3d" ? "any" : "3d" })}>
          Last 3 Days
        </Chip>
        <Chip active={filters.recency === "7d"} onClick={() => setFilters({ recency: filters.recency === "7d" ? "any" : "7d" })}>
          Last 7 Days
        </Chip>
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as SearchFilters["sort"] })}
          className="rounded-full border border-[var(--line)] bg-transparent px-3 py-1.5 text-xs"
        >
          <option value="best">Best Match</option>
          <option value="newest">Newest</option>
          <option value="budget">Highest Budget</option>
          <option value="competition">Lowest Competition</option>
        </select>
        <Button variant="ghost" className="ml-auto text-xs" onClick={() => saveSearch()}>
          Save search
        </Button>
      </div>

      {smart && expandedTerms.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span>AI also understands</span>
          {expandedTerms.slice(0, 10).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-[var(--muted)]">
        {sources.map((s) => (
          <span key={s.id} className={s.ok ? "text-mint-400" : "text-rose-300"}>
            {s.name}: {s.ok ? `${s.verifiedCount ?? 0}/${s.count} verified` : s.message}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-48 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-[var(--muted)]">
          {q || query
            ? "No matching opportunities yet. Try a broader skill, enable DEMO DATA in Settings, or connect live sources."
            : "Enter a skill above or pick an example to rank public opportunities."}
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((item) => (
            <OpportunityCard
              key={item.id}
              item={item}
              onView={() => setOpen(item)}
              onSave={() => saveLead(item)}
              onPropose={() => setProp(item)}
            />
          ))}
        </div>
      )}

      {open && (
        <OpportunityDrawer
          item={open}
          onClose={() => setOpen(undefined)}
          onSave={() => saveLead(open)}
          onPropose={() => setProp(open)}
          onVerify={async () => {
            const updated = await verifyLink(open);
            setOpen(updated);
          }}
        />
      )}
      {prop && <ProposalModal item={prop} onClose={() => setProp(undefined)} />}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-mint-500 text-ink-950" : "border border-[var(--line)] text-[var(--muted)]"}`}
    >
      {children}
    </button>
  );
}
