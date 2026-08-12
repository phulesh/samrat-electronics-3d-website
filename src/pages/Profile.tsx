import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";

export default function Profile() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const pushToast = useAppStore((s) => s.pushToast);
  const [form, setForm] = useState(profile);

  const set = (key: keyof typeof form, value: string | number | string[]) => setForm({ ...form, [key]: value });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10">
      <h1 className="font-display text-3xl font-bold">Freelancer Profile</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Used to improve AI matching, qualification, and proposals.</p>
      <div className="glass space-y-4 rounded-3xl p-5">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
        </Field>
        <Field label="Skills (comma separated)">
          <Input value={form.skills.join(", ")} onChange={(e) => set("skills", split(e.target.value))} placeholder="n8n, AI Automation, WhatsApp" />
        </Field>
        <Field label="Services">
          <Input value={form.services.join(", ")} onChange={(e) => set("services", split(e.target.value))} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Experience (years)">
            <Input type="number" value={form.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Minimum budget (₹)">
            <Input type="number" value={form.minBudget} onChange={(e) => set("minBudget", Number(e.target.value))} />
          </Field>
          <Field label="Preferred budget (₹)">
            <Input type="number" value={form.preferredBudget} onChange={(e) => set("preferredBudget", Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Languages">
          <Input value={form.languages.join(", ")} onChange={(e) => set("languages", split(e.target.value))} />
        </Field>
        <Field label="Portfolio">
          <Input value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="https://" />
        </Field>
        <Field label="GitHub">
          <Input value={form.github} onChange={(e) => set("github", e.target.value)} />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
        <Field label="Profile description">
          <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Button
          onClick={() => {
            updateProfile(form);
            pushToast("Profile saved — matching will use this");
          }}
        >
          Save profile
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function split(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
