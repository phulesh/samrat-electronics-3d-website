import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import { fetchSourceStatus } from "@/lib/api";
import type { SourceStatus } from "@/types";

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pushToast = useAppStore((s) => s.pushToast);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSourceStatus()
      .then((d) => {
        setSources(d.sources);
        setLive(d.liveConnected);
      })
      .catch(() => {
        setLive(false);
        setSources([]);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Appearance, data sources, and future LLM connection.</p>

      <section className="glass mb-4 space-y-4 rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs text-[var(--muted)]">Dark mode and light mode</div>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="glass mb-4 space-y-4 rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold">Opportunity data</h2>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            Include labeled DEMO DATA
            <div className="text-xs text-[var(--muted)]">Never mixed without a DEMO DATA badge</div>
          </span>
          <input
            type="checkbox"
            checked={settings.includeDemo}
            onChange={(e) => updateSettings({ includeDemo: e.target.checked })}
          />
        </label>
        <div>
          <Label>Default currency</Label>
          <Select value={settings.defaultCurrency} onChange={(e) => updateSettings({ defaultCurrency: e.target.value as "INR" | "USD" })}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          {live === false
            ? "Live opportunity sources are not connected yet."
            : live
              ? "Live public sources responded. Each card still shows its original URL."
              : "Checking public sources…"}
        </div>
        <ul className="space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-mint-400">
                {s.name}
              </a>
              <span className={s.ok ? "text-mint-400" : "text-rose-300"}>{s.ok ? `${s.count} fetched` : s.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass mb-4 space-y-3 rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold">Future LLM key</h2>
        <p className="text-xs text-[var(--muted)]">
          Stored only in this browser. The current proposal engine works without a key. Ready for an OpenAI-compatible backend later.
        </p>
        <Label>API key (optional)</Label>
        <Input
          type="password"
          value={settings.openaiKey}
          onChange={(e) => updateSettings({ openaiKey: e.target.value })}
          placeholder="sk-…"
        />
      </section>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold">Local data</h2>
        <Button
          variant="danger"
          onClick={() => {
            localStorage.clear();
            pushToast("Local data cleared — reload the page");
          }}
        >
          Clear all local CRM / profile data
        </Button>
      </section>
    </div>
  );
}
