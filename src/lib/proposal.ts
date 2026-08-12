import type { FreelancerProfile, Opportunity, ProposalTone } from "@/types";

const openers = [
  (name: string, title: string) =>
    `Hi${name ? ` ${name.split(" ")[0]}` : ""}, I read your brief on “${title}” and I can take this from messy process to a clean, reliable system.`,
  (name: string, title: string) =>
    `Hello${name ? ` ${name.split(" ")[0]}` : ""} — your requirement for “${title}” is exactly the kind of build I ship for operators who want leverage, not another half-finished workflow.`,
  (_n: string, title: string) =>
    `Thanks for posting “${title}”. I already see a practical path to ship this without over-engineering.`,
];

function weeksFor(opp: Opportunity) {
  const len = (opp.description || "").length;
  if (opp.projectType === "hourly") return "I can start this week and keep a predictable weekly cadence.";
  if (len > 500) return "Typical timeline: discovery (2 days) → build (7–10 days) → QA & handoff (2 days).";
  return "Typical timeline: 5–8 working days from kickoff to handoff, with a mid-point review.";
}

function priceLine(opp: Opportunity, profile?: FreelancerProfile) {
  if (opp.budgetLabel && opp.budgetLabel !== "Not disclosed") {
    return `Estimated investment: ${opp.budgetLabel}, aligned to the scope in your brief. I’ll confirm a fixed quote after a 20-minute kickoff.`;
  }
  if (profile?.preferredBudget) {
    const label =
      opp.projectType === "hourly"
        ? `₹${profile.preferredBudget.toLocaleString("en-IN")}/hr`
        : `starting around ₹${profile.preferredBudget.toLocaleString("en-IN")}`;
    return `Estimated investment: ${label}, scoped to the outcomes below. Happy to propose a milestone plan.`;
  }
  return "I’ll share a fixed milestone quote after we confirm success criteria — no surprise retainers.";
}

function solution(opp: Opportunity) {
  const skills = opp.skills.slice(0, 5).join(", ") || "the stack in your brief";
  return `Proposed approach
1. Map the current workflow and success metrics (what “done” looks like).
2. Design the ${skills} solution around your existing tools — no unnecessary new software.
3. Implement, test edge cases (duplicates, failures, handoff), and document so your team can run it.
4. Handover with a short loom + SOP.`;
}

export function generateProposal(
  opp: Opportunity,
  profile: FreelancerProfile,
  tone: ProposalTone,
  seed = Date.now(),
) {
  const opener = openers[seed % openers.length](profile.name || "", opp.title);
  const understanding = `What I understood: ${opp.shortDescription || opp.description.slice(0, 220)}`;
  const skills = (profile.skills.length ? profile.skills : opp.skills).slice(0, 6).join(" · ");
  const who = profile.name ? `I’m ${profile.name}` : "I’m a specialist freelancer";
  const proof = profile.description
    ? profile.description.slice(0, 220)
    : "I help teams turn messy manual work into dependable automations and client-ready products.";
  const links = [profile.portfolio && `Portfolio: ${profile.portfolio}`, profile.website && `Website: ${profile.website}`, profile.github && `GitHub: ${profile.github}`]
    .filter(Boolean)
    .join("\n");

  if (tone === "short") {
    return `${opener}

${understanding}

I’ll deliver a focused ${opp.skills.slice(0, 3).join(" + ") || "custom"} solution, keep communication tight, and ship a usable first version quickly.

${weeksFor(opp)}
${priceLine(opp, profile)}

Relevant skills: ${skills}

If this matches what you need, reply with a 15-minute slot and I’ll send a milestone plan the same day.`;
  }

  return `${opener}

${understanding}

${who}. ${proof}

${solution(opp)}

Relevant skills: ${skills}
${weeksFor(opp)}
${priceLine(opp, profile)}

Next step: a short call to lock scope, then a written milestone plan. I’ll own delivery and keep you updated without noise.

${links}`.trim();
}
