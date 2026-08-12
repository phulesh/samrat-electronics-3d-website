import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MatchRing } from "./MatchRing";
import { projectTypeLabel, timeAgo } from "@/lib/format";
import { getApplyUrl, hasVerifiedApplyUrl } from "@/lib/verifiedLinks";
import type { RankedOpportunity } from "@/types";
import { ExternalLink, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export function OpportunityDrawer({
  item,
  onClose,
  onSave,
  onPropose,
  onVerify,
}: {
  item: RankedOpportunity;
  onClose: () => void;
  onSave: () => void;
  onPropose: () => void;
  onVerify: () => Promise<void> | void;
}) {
  const [verifying, setVerifying] = useState(false);
  const applyUrl = getApplyUrl(item);
  const canApply = hasVerifiedApplyUrl(item);

  async function handleVerify() {
    setVerifying(true);
    try {
      await onVerify();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-0 md:p-4">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <aside className="glass relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto rounded-none md:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-5">
          <div className="flex gap-3">
            <MatchRing score={item.matchScore} />
            <div>
              <div className="flex flex-wrap gap-2">
                {item.isDemo && <Badge tone="demo">DEMO DATA</Badge>}
                {!item.isDemo && item.isVerified && <Badge tone="mint">🟢 VERIFIED ORIGINAL LINK</Badge>}
                {!item.isDemo && !item.isVerified && <Badge tone="rose">{item.verificationStatus}</Badge>}
              </div>
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
          <div className="rounded-2xl border border-[var(--line)] bg-white/5 p-4 text-sm">
            {canApply ? (
              <>
                <div className="flex items-center gap-2 font-semibold text-mint-400">
                  <ShieldCheck className="h-4 w-4" /> 🟢 VERIFIED ORIGINAL LINK
                </div>
                <div className="mt-1 break-all text-xs text-[var(--muted)]">{item.verifiedUrl}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  Verified {item.verifiedAt ? timeAgo(item.verifiedAt) : "recently"} · Source: {item.sourceName}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-amber-200">⚠️ Application link unavailable</div>
                <div className="mt-1 text-[var(--muted)]">Source link could not be verified.</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{item.verificationMessage}</div>
              </>
            )}
          </div>

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
              ["Verification", item.isVerified ? "VERIFIED" : item.verificationStatus],
              ["Source", item.sourceName],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{k}</div>
                <div className="mt-1 break-words font-semibold">{v}</div>
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
          {item.isVerified && item.verifiedUrl && (
            <a href={item.verifiedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-mint-400 underline">
              Open verified original source <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <div className="sticky bottom-0 mt-auto grid gap-2 border-t border-[var(--line)] bg-[var(--bg-elev)] p-4 sm:grid-cols-2">
          {canApply ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl bg-mint-500 px-4 py-3 text-sm font-semibold tracking-tight text-ink-950 shadow-glow transition hover:bg-mint-400 active:scale-[0.98] sm:col-span-2"
            >
              <ShieldCheck className="h-4 w-4" /> 🚀 APPLY NOW
            </a>
          ) : (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100 sm:col-span-2">
              <div className="font-semibold">⚠️ Application link unavailable</div>
              <div>Source link could not be verified.</div>
            </div>
          )}
          <Button variant="secondary" onClick={handleVerify} disabled={verifying || item.isDemo}>
            <RefreshCw className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
            {verifying ? "Verifying…" : "Verify Link"}
          </Button>
          <Button variant="secondary" onClick={onSave}>
            Save Lead
          </Button>
          <Button className="sm:col-span-2" onClick={onPropose}>
            Generate Proposal
          </Button>
        </div>
      </aside>
    </div>
  );
}
