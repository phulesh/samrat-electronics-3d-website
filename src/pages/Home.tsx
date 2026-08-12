import { HeroBackground } from "@/components/hero/HeroBackground";
import { SearchBox } from "@/components/search/SearchBox";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { NAV } from "@/components/layout/nav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DEMO_OPPORTUNITIES } from "@/data/demoOpportunities";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowRight, Radar, ShieldCheck, Sparkles, Workflow } from "lucide-react";

const STEPS = [
  { t: "Search a skill", d: "n8n, chatbot, React — or combine with +." },
  { t: "AI ranks public opportunities", d: "Match score, intent, competition, freshness." },
  { t: "Qualify & save", d: "Keep only leads worth your time in the CRM." },
  { t: "Propose & win", d: "Generate a tailored proposal and track it to Won." },
];

const FEATURES = [
  { icon: Sparkles, t: "AI Smart Search", d: "Semantic expansion: n8n also finds workflow, CRM, WhatsApp, and Sheets automation." },
  { icon: Radar, t: "Match scoring", d: "0–100 score from skills, tech, budget, experience, location, type, and freshness." },
  { icon: Workflow, t: "Built-in CRM", d: "Statuses from New Lead to Won, notes, tags, follow-ups, proposals." },
  { icon: ShieldCheck, t: "Public sources only", d: "No login bypass, no CAPTCHA tricks. Every card keeps its original link." },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="relative isolate overflow-hidden">
        <HeroBackground />
        <div className="relative mx-auto hidden max-w-6xl items-center justify-between px-6 pt-4 lg:flex">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="" className="h-10 w-10 rounded-xl object-cover" />
            <span className="font-display text-lg font-bold">ClientFinder AI</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-[var(--muted)]">
            {NAV.slice(1, 7).map((n) => (
              <NavLink key={n.to} to={n.to} className="hover:text-[var(--text)]">
                {n.label}
              </NavLink>
            ))}
            <ThemeToggle />
          </div>
        </div>

        <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 md:pt-20">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge tone="mint">Freelancer OS</Badge>
            <Badge tone="gold">Public data · original sources</Badge>
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Find Clients Who <span className="text-gradient">Need Your Skills</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[var(--muted)] md:text-lg">
            Search your skill. AI finds relevant opportunities and helps you turn them into qualified leads.
          </p>
          <div className="mt-8">
            <SearchBox large />
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Try multi-skill: <button className="text-mint-400" onClick={() => navigate("/search?q=n8n+%2B+WhatsApp+%2B+AI+%2B+Google+Sheets&smart=1")}>n8n + WhatsApp + AI + Google Sheets</button>
          </p>
        </section>
      </div>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.t} className="glass rounded-2xl p-4">
            <div className="font-mono text-xs text-mint-400">0{i + 1}</div>
            <div className="mt-2 font-display font-semibold">{s.t}</div>
            <p className="mt-1 text-sm text-[var(--muted)]">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">What a ranked opportunity looks like</h2>
            <p className="text-sm text-[var(--muted)]">Sample cards below are labeled DEMO DATA — not live client posts.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_OPPORTUNITIES.slice(0, 2).map((o) => (
            <article key={o.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone="demo">DEMO DATA</Badge>
                <Badge tone="mint">94% match</Badge>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{o.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{o.shortDescription}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.skills.slice(0, 4).map((s) => (
                  <span key={s} className="rounded-lg bg-white/5 px-2 py-1 text-xs">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-gold-400">{o.budgetLabel}</span>
                <span className="text-[var(--muted)]">{o.location}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.t} className="glass rounded-2xl p-5">
            <f.icon className="h-5 w-5 text-gold-400" />
            <h3 className="mt-3 font-display text-lg font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="glass flex flex-col items-start justify-between gap-4 rounded-3xl p-6 md:flex-row md:items-center md:p-8">
          <div>
            <h2 className="font-display text-2xl font-bold">Ready when live APIs are connected</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              Architecture is wired for RemoteOK, Remotive, Arbeitnow, Jobicy, Himalayas, and HN public feeds. Demo examples are always labeled DEMO DATA.
            </p>
          </div>
          <Button onClick={() => navigate("/search?q=n8n+automation&smart=1")}>
            Open Find Clients <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
