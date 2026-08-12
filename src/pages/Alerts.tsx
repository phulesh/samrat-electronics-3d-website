import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { useAppStore } from "@/store/useAppStore";
import type { AlertFrequency } from "@/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Alerts() {
  const saved = useAppStore((s) => s.savedSearches);
  const notifications = useAppStore((s) => s.notifications);
  const saveSearch = useAppStore((s) => s.saveSearch);
  const updateSavedSearch = useAppStore((s) => s.updateSavedSearch);
  const deleteSavedSearch = useAppStore((s) => s.deleteSavedSearch);
  const markNotificationsRead = useAppStore((s) => s.markNotificationsRead);
  const query = useAppStore((s) => s.query);
  const navigate = useNavigate();
  const [label, setLabel] = useState("");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      <h1 className="font-display text-3xl font-bold">Alerts</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Save a search like “n8n Automation + ₹10,000+ + Remote” and get notified.</p>

      <div className="glass mb-6 rounded-2xl p-4">
        <Label>Create alert from current / last search</Label>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder={query ? `${query} + Remote` : "Run a search first, then name this alert"}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Button
            onClick={() => {
              saveSearch(label || undefined);
              setLabel("");
            }}
          >
            Create Alert
          </Button>
        </div>
      </div>

      <h2 className="mb-3 font-display text-xl font-semibold">Saved searches</h2>
      <div className="mb-8 space-y-3">
        {saved.length === 0 && <p className="text-sm text-[var(--muted)]">No saved searches yet.</p>}
        {saved.map((s) => (
          <div key={s.id} className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="font-semibold">{s.label}</div>
              <div className="text-xs text-[var(--muted)]">{s.query}</div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.alertEnabled} onChange={(e) => updateSavedSearch(s.id, { alertEnabled: e.target.checked })} />
              Alerts
            </label>
            <Select
              value={s.frequency}
              onChange={(e) => updateSavedSearch(s.id, { frequency: e.target.value as AlertFrequency })}
              className="md:w-36"
            >
              <option>Instant</option>
              <option>Daily</option>
              <option>Weekly</option>
            </Select>
            <Button variant="secondary" onClick={() => navigate(`/search?q=${encodeURIComponent(s.query)}`)}>
              Run
            </Button>
            <Button variant="danger" onClick={() => deleteSavedSearch(s.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Notifications</h2>
        <Button variant="ghost" onClick={markNotificationsRead}>
          Mark read
        </Button>
      </div>
      <div className="space-y-2">
        {notifications.length === 0 && <p className="text-sm text-[var(--muted)]">No notifications yet. Enable Instant / Daily / Weekly on a saved search.</p>}
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(n.href)}
            className={`glass w-full rounded-2xl p-4 text-left ${n.read ? "opacity-70" : ""}`}
          >
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm text-[var(--muted)]">{n.body}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
