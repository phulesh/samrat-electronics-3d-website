import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { ProposalModal } from "@/components/proposal/ProposalModal";
import { STATUS_FLOW, useAppStore } from "@/store/useAppStore";
import type { Lead, LeadStatus } from "@/types";
import { useMemo, useState } from "react";
import { X } from "lucide-react";

export default function CRM() {
  const leads = useAppStore((s) => s.leads);
  const updateLead = useAppStore((s) => s.updateLead);
  const deleteLead = useAppStore((s) => s.deleteLead);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prop, setProp] = useState(false);
  const filtered = useMemo(
    () => leads.filter((l) => `${l.opportunity.title} ${l.notes} ${l.tags.join(" ")} ${l.status}`.toLowerCase().includes(q.toLowerCase())),
    [leads, q],
  );
  const active = leads.find((l) => l.id === activeId);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Lead CRM</h1>
          <p className="text-sm text-[var(--muted)]">Move leads from first save to Won.</p>
        </div>
        <Input placeholder="Search CRM…" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
      </div>

      <div className="hidden gap-3 overflow-x-auto pb-4 lg:flex">
        {STATUS_FLOW.map((status) => {
          const col = filtered.filter((l) => l.status === status);
          return (
            <div key={status} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {status} <span>{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map((lead) => (
                  <button key={lead.id} onClick={() => setActiveId(lead.id)} className="glass w-full rounded-2xl p-3 text-left">
                    <div className="line-clamp-2 text-sm font-semibold">{lead.opportunity.title}</div>
                    <div className="mt-2 text-xs text-gold-400">{lead.opportunity.budgetLabel}</div>
                    <div className="mt-1 text-[11px] text-[var(--muted)]">{lead.opportunity.matchScore}% match</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:hidden">
        {filtered.map((lead) => (
          <button key={lead.id} onClick={() => setActiveId(lead.id)} className="glass rounded-2xl p-4 text-left">
            <Badge>{lead.status}</Badge>
            <div className="mt-2 font-semibold">{lead.opportunity.title}</div>
            <div className="text-xs text-[var(--muted)]">{lead.opportunity.budgetLabel}</div>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[var(--muted)]">No leads in CRM yet.</p>}
      </div>

      {active && (
        <LeadEditor
          lead={active}
          onClose={() => setActiveId(null)}
          onChange={(patch) => updateLead(active.id, patch)}
          onDelete={() => {
            deleteLead(active.id);
            setActiveId(null);
          }}
          onPropose={() => setProp(true)}
        />
      )}
      {active && prop && <ProposalModal item={active.opportunity} leadId={active.id} onClose={() => setProp(false)} />}
    </div>
  );
}

function LeadEditor({
  lead,
  onClose,
  onChange,
  onDelete,
  onPropose,
}: {
  lead: Lead;
  onClose: () => void;
  onChange: (patch: Partial<Lead>) => void;
  onDelete: () => void;
  onPropose: () => void;
}) {
  const [tag, setTag] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <aside className="glass relative z-10 h-full w-full max-w-lg overflow-y-auto p-5">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold">{lead.opportunity.title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        {lead.opportunity.isDemo && <Badge tone="demo">DEMO DATA</Badge>}
        <div className="mt-4 space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={lead.status} onChange={(e) => onChange({ status: e.target.value as LeadStatus })}>
              {STATUS_FLOW.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Follow-up</Label>
            <Input type="datetime-local" value={lead.followUpAt?.slice(0, 16) || ""} onChange={(e) => onChange({ followUpAt: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={5} value={lead.notes} onChange={(e) => onChange({ notes: e.target.value })} />
          </div>
          <div>
            <Label>Tags</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {lead.tags.map((t) => (
                <button
                  key={t}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs"
                  onClick={() => onChange({ tags: lead.tags.filter((x) => x !== t) })}
                >
                  {t} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add tag" />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!tag.trim()) return;
                  onChange({ tags: [...lead.tags, tag.trim()] });
                  setTag("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
          <a href={lead.opportunity.sourceUrl} target="_blank" rel="noreferrer" className="block text-sm text-mint-400">
            Original source →
          </a>
          {lead.proposal && (
            <div>
              <Label>Latest proposal</Label>
              <pre className="whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-xs">{lead.proposal}</pre>
            </div>
          )}
        </div>
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" onClick={onPropose}>
            Generate Proposal
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </aside>
    </div>
  );
}
