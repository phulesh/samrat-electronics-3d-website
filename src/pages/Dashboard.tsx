import { useAppStore } from "@/store/useAppStore";
import { compactMoney } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const leads = useAppStore((s) => s.leads);
  const results = useAppStore((s) => s.results);
  const proposals = useAppStore((s) => s.proposals);

  const newLeads = leads.filter((l) => l.status === "New Lead").length;
  const qualified = leads.filter((l) => l.status === "Qualified").length;
  const sent = leads.filter((l) => l.status === "Proposal Sent" || l.status === "Follow-up").length;
  const won = leads.filter((l) => l.status === "Won");
  const pipeline = leads
    .filter((l) => l.status !== "Lost")
    .reduce((sum, l) => sum + (l.opportunity.budgetMax || l.opportunity.budgetMin || 0), 0);
  const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0;

  const bySkill = Object.entries(
    [...results, ...leads.map((l) => l.opportunity)].reduce<Record<string, number>>((acc, o) => {
      const key = o.skills[0] || "Other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .slice(0, 8);

  const byBudget = [
    { name: "Undisclosed", value: results.filter((r) => !r.budgetMin).length },
    { name: "Has budget", value: results.filter((r) => r.budgetMin).length },
  ];

  const byStatus = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const bySource = Object.entries(
    results.reduce<Record<string, number>>((acc, r) => {
      acc[r.sourceName] = (acc[r.sourceName] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const key = day.toISOString().slice(0, 10);
    return {
      name: day.toLocaleDateString("en-IN", { weekday: "short" }),
      value: [...results, ...leads.map((l) => l.opportunity)].filter((o) => o.postedAt?.slice(0, 10) === key).length,
    };
  });

  const cards = [
    ["Total Opportunities", results.length],
    ["New Leads", newLeads],
    ["Qualified Leads", qualified],
    ["Proposals Generated", proposals.length],
    ["Proposals Sent", sent],
    ["Won Projects", won.length],
    ["Pipeline Value", compactMoney(pipeline || 0)],
    ["Conversion Rate", `${conversion}%`],
  ];

  const colors = ["#2ee9a6", "#e8c36a", "#7c6cff", "#5ec8ff", "#ff6b7a", "#9ae6b4", "#c4b5fd"];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Pipeline health from searches, CRM, and proposals stored on this device.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={k} className="glass rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{k}</div>
            <div className="mt-2 font-display text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Opportunities by skill">
          <BarChart data={bySkill}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#2ee9a6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Opportunities by budget">
          <PieChart>
            <Pie data={byBudget} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {byBudget.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
        <ChartCard title="Leads by status">
          <BarChart data={byStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#7c6cff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Opportunities by source">
          <PieChart>
            <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {bySource.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
        <div className="lg:col-span-2">
          <ChartCard title="Weekly opportunities">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#e8c36a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
