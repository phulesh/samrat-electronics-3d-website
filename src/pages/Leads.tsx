import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ProposalModal } from "@/components/proposal/ProposalModal";
import { useAppStore } from "@/store/useAppStore";
import { timeAgo } from "@/lib/format";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Leads() {
  const leads = useAppStore((s) => s.leads);
  const deleteLead = useAppStore((s) => s.deleteLead);
  const [q, setQ] = useState("");
  const [propId, setPropId] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      leads.filter((l) =>
        `${l.opportunity.title} ${l.tags.join(" ")} ${l.status}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [leads, q],
  );
  const active = leads.find((l) => l.id === propId);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Saved Leads</h1>
          <p className="text-sm text-[var(--muted)]">Qualified opportunities you chose to keep.</p>
        </div>
        <Input placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
      </div>
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-[var(--muted)]">
          No saved leads yet. <Link to="/search?q=n8n+automation" className="text-mint-400">Find clients</Link> and tap Save Lead.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((lead) => (
            <article key={lead.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="iris">{lead.status}</Badge>
                    {lead.opportunity.isDemo && <Badge tone="demo">DEMO DATA</Badge>}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{lead.opportunity.title}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {lead.opportunity.matchScore}% match · saved {timeAgo(lead.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setPropId(lead.id)}>
                    Proposal
                  </Button>
                  <Link to="/crm" className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 text-sm">
                    Open CRM
                  </Link>
                  <Button variant="danger" onClick={() => deleteLead(lead.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {active && <ProposalModal item={active.opportunity} leadId={active.id} onClose={() => setPropId(null)} />}
    </div>
  );
}
