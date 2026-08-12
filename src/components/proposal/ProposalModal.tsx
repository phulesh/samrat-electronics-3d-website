import { Button } from "@/components/ui/Button";
import { generateProposal } from "@/lib/proposal";
import { useAppStore } from "@/store/useAppStore";
import type { RankedOpportunity } from "@/types";
import { Copy, RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";

export function ProposalModal({
  item,
  leadId,
  onClose,
}: {
  item: RankedOpportunity;
  leadId?: string;
  onClose: () => void;
}) {
  const profile = useAppStore((s) => s.profile);
  const generateFor = useAppStore((s) => s.generateFor);
  const saveLead = useAppStore((s) => s.saveLead);
  const pushToast = useAppStore((s) => s.pushToast);
  const [tone, setTone] = useState<"professional" | "short">("professional");
  const [seed, setSeed] = useState(1);
  const draft = useMemo(() => generateProposal(item, profile, tone, seed), [item, profile, tone, seed]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-black/55 p-0 md:place-items-center md:p-6">
      <div className="glass flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl md:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">AI Proposal Generator</div>
            <h2 className="font-display text-lg font-semibold">{item.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pt-4">
          <Button variant={tone === "professional" ? "primary" : "secondary"} onClick={() => setTone("professional")}>
            Professional Proposal
          </Button>
          <Button variant={tone === "short" ? "primary" : "secondary"} onClick={() => setTone("short")}>
            Short Proposal
          </Button>
        </div>
        <textarea
          readOnly
          value={draft}
          className="m-5 min-h-[320px] flex-1 resize-none rounded-2xl border border-[var(--line)] bg-black/20 p-4 text-sm leading-relaxed"
        />
        <div className="flex flex-col gap-2 border-t border-[var(--line)] p-4 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => {
              navigator.clipboard.writeText(draft);
              pushToast("Proposal copied");
            }}
          >
            <Copy className="h-4 w-4" /> Copy Proposal
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setSeed((s) => s + 1)}>
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
          <Button
            variant="gold"
            className="flex-1"
            onClick={() => {
              const id = leadId || saveLead(item).id;
              generateFor(item, tone, id);
              onClose();
            }}
          >
            Save to CRM
          </Button>
        </div>
      </div>
    </div>
  );
}
