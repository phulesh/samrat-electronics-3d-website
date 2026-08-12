import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MatchRing } from "./MatchRing";
import { projectTypeLabel, timeAgo } from "@/lib/format";
import type { RankedOpportunity } from "@/types";
import { X } from "lucide-react";

export function OpportunityDrawer({
  item,
  onClose,
  onSave,
  onPropose,
}: {
  item: RankedOpportunity;
  onClose: () => void;
  onSave: () => void;
  onPropose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-0 md:p-4">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <aside className="glass relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto rounded-none md:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-5">
          <div className="flex gap-3">
            <MatchRing score={item.matchScore} />
            <div>
              {item.isDemo && <Badge tone="demo">DEMO DATA</Badge>}
              <h2 className="mt-1 font-display text-xl font-semibold">{item.title}</h2>
              <p className="text-sm text-[var(--muted)]">
                {item.company || "Client"} · {item.sourceName} · {timeAgo(item.postedAt)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <p className="text-sm leading-relaxed text-[var(--text)]">{item.description}</p>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Required skills</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.skills.map((s) => (
                <span key={s} className="rounded-lg bg-white/5 px-2 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Budget", item.budgetLabel],
              ["Project type", projectTypeLabel(item.projectType)],
              ["Location", item.location],
              ["Client intent", item.qualification.intent],
              ["Project quality", item.qualification.quality],
              ["Competition", item.qualification.competition],
              ["Winning probability", `${item.qualification.winningProbability}%`],
              ["AI match", `${item.matchScore}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{k}</div>
                <div className="mt-1 font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--line)] p-3 text-sm">
            <div className="font-semibold">{item.matchScore}% Match</div>
            <p className="mt-1 text-[var(--muted)]">{item.matchReason}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Score breakdown</h3>
            <div className="mt-2 space-y-2">
              {Object.entries(item.breakdown).map(([k, v]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-xs capitalize text-[var(--muted)]">
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-mint-500" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="block text-sm text-mint-400 underline">
            Open original source →
          </a>
        </div>
        <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-[var(--line)] bg-[var(--bg-elev)] p-4">
          <Button className="flex-1" onClick={onPropose}>
            Generate Proposal
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onSave}>
            Save Lead
          </Button>
        </div>
      </aside>
    </div>
  );
}
