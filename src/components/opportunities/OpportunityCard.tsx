import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MatchRing } from "./MatchRing";
import { projectTypeLabel, timeAgo } from "@/lib/format";
import { getApplyUrl, hasVerifiedApplyUrl } from "@/lib/verifiedLinks";
import type { RankedOpportunity } from "@/types";
import { BookmarkPlus, ExternalLink, FilePenLine, MapPin, ShieldCheck, Timer } from "lucide-react";

export function OpportunityCard({
  item,
  onView,
  onSave,
  onPropose,
}: {
  item: RankedOpportunity;
  onView: () => void;
  onSave: () => void;
  onPropose: () => void;
}) {
  const applyUrl = getApplyUrl(item);
  const canApply = hasVerifiedApplyUrl(item);

  return (
    <article className="glass group rounded-2xl p-4 transition hover:border-mint-500/25 md:p-5">
      <div className="flex gap-4">
        <MatchRing score={item.matchScore} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {item.isDemo && <Badge tone="demo">DEMO DATA</Badge>}
            {!item.isDemo && item.isVerified && <Badge tone="mint">🟢 VERIFIED ORIGINAL LINK</Badge>}
            {!item.isDemo && !item.isVerified && <Badge tone="rose">{item.verificationStatus}</Badge>}
            <Badge tone="iris">{item.sourceName}</Badge>
            <Badge tone={item.qualification.competition === "Low" ? "mint" : item.qualification.competition === "High" ? "rose" : "gold"}>
              {item.qualification.competition} competition
            </Badge>
          </div>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.shortDescription}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.skills.slice(0, 6).map((s) => (
          <span key={s} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-[var(--text)]">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--muted)] sm:grid-cols-4">
        <div>
          <div className="uppercase tracking-wide">Budget</div>
          <div className="mt-0.5 font-semibold text-gold-400">{item.budgetLabel}</div>
        </div>
        <div>
          <div className="uppercase tracking-wide">Type</div>
          <div className="mt-0.5 font-semibold text-[var(--text)]">{projectTypeLabel(item.projectType)}</div>
        </div>
        <div className="flex items-start gap-1">
          <MapPin className="mt-3 h-3.5 w-3.5" />
          <div>
            <div className="uppercase tracking-wide">Location</div>
            <div className="mt-0.5 font-semibold text-[var(--text)]">{item.location}</div>
          </div>
        </div>
        <div className="flex items-start gap-1">
          <Timer className="mt-3 h-3.5 w-3.5" />
          <div>
            <div className="uppercase tracking-wide">Posted</div>
            <div className="mt-0.5 font-semibold text-[var(--text)]">{timeAgo(item.postedAt)}</div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">{item.matchReason}</p>

      {!canApply && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
          <div className="font-semibold">⚠️ Application link unavailable</div>
          <div>Source link could not be verified.</div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={onView}>
          View Client Requirement
        </Button>
        {canApply && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-mint-500 px-4 py-2.5 text-sm font-semibold tracking-tight text-ink-950 shadow-glow transition hover:bg-mint-400 active:scale-[0.98]"
          >
            <ShieldCheck className="h-4 w-4" /> 🚀 APPLY NOW
          </a>
        )}
        <Button variant="secondary" onClick={onSave}>
          <BookmarkPlus className="h-4 w-4" /> Save Lead
        </Button>
        <Button variant="secondary" onClick={onPropose}>
          <FilePenLine className="h-4 w-4" /> Generate Proposal
        </Button>
      </div>
      {item.isVerified && item.verifiedUrl && (
        <a
          href={item.verifiedUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-mint-400 hover:underline"
        >
          Verified original source: {item.sourceName} <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </article>
  );
}
