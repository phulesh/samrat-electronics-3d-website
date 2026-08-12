import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { timeAgo } from "@/lib/format";

export default function Proposals() {
  const proposals = useAppStore((s) => s.proposals);
  const pushToast = useAppStore((s) => s.pushToast);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      <h1 className="font-display text-3xl font-bold">Proposals</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Generated from real requirement text + your profile.</p>
      {proposals.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-sm text-[var(--muted)]">No proposals yet. Open an opportunity and tap Generate Proposal.</div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <article key={p.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">{p.tone}</Badge>
                <span className="text-xs text-[var(--muted)]">{timeAgo(p.createdAt)}</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">{p.opportunityTitle}</h3>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--muted)]">{p.content}</pre>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(p.content);
                  pushToast("Copied");
                }}
              >
                Copy Proposal
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
