import { expandQuery, tokenizeQuery } from "@/data/skillGraph";
import type {
  FreelancerProfile,
  MatchBreakdown,
  Opportunity,
  Qualification,
  RankedOpportunity,
  SearchFilters,
} from "@/types";

function haystack(opp: Opportunity) {
  return `${opp.title} ${opp.description} ${opp.skills.join(" ")} ${opp.tags.join(" ")} ${opp.company || ""}`.toLowerCase();
}

function overlapScore(terms: string[], text: string) {
  if (!terms.length) return { score: 0, matched: [] as string[] };
  let hits = 0;
  const matched: string[] = [];
  for (const term of terms) {
    if (term.length < 2) continue;
    if (text.includes(term)) {
      hits += term.length > 8 ? 1.25 : 1;
      matched.push(term);
    }
  }
  return { score: Math.min(100, (hits / Math.max(terms.length * 0.35, 1)) * 100), matched };
}

function freshnessScore(iso: string) {
  const ageH = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (Number.isNaN(ageH)) return 40;
  if (ageH <= 12) return 100;
  if (ageH <= 36) return 88;
  if (ageH <= 72) return 76;
  if (ageH <= 168) return 62;
  if (ageH <= 336) return 48;
  return 30;
}

function budgetScore(opp: Opportunity, profile?: FreelancerProfile) {
  if (!opp.budgetMin && !opp.budgetMax) return 55;
  if (!profile) return 70;
  const mid = ((opp.budgetMin || opp.budgetMax || 0) + (opp.budgetMax || opp.budgetMin || 0)) / 2;
  if (!mid) return 55;
  const min = profile.minBudget || 0;
  const pref = profile.preferredBudget || min;
  if (opp.budgetCurrency !== "INR" && pref > 500) {
    // Rough hourly USD vs INR project budgets — treat as loosely compatible.
    return mid >= 20 ? 72 : 58;
  }
  if (mid >= pref) return 96;
  if (mid >= min) return 80;
  if (mid >= min * 0.7) return 60;
  return 38;
}

function locationScore(opp: Opportunity, filters: SearchFilters, profile?: FreelancerProfile) {
  const loc = `${opp.location}`.toLowerCase();
  if (filters.region === "remote") return opp.remote || /remote|worldwide|anywhere/i.test(loc) ? 96 : 20;
  if (filters.region === "india") return /india|bengaluru|bangalore|mumbai|delhi|pune|hyderabad|chennai|remote/i.test(loc) ? 92 : 35;
  if (profile?.location && loc.includes(profile.location.toLowerCase())) return 94;
  return opp.remote ? 86 : 70;
}

function experienceScore(opp: Opportunity, profile?: FreelancerProfile) {
  const text = haystack(opp);
  const years = profile?.experienceYears ?? 3;
  if (/senior|lead|staff|principal/.test(text)) return years >= 5 ? 90 : 55;
  if (/junior|intern|entry/.test(text)) return years <= 3 ? 88 : 70;
  return 78 + Math.min(12, years);
}

export function qualify(opp: Opportunity, matchScore: number, breakdown: MatchBreakdown): Qualification {
  const ageH = (Date.now() - new Date(opp.postedAt).getTime()) / 36e5;
  const intent: Qualification["intent"] =
    ageH <= 18 && matchScore >= 80 ? "Very High" : ageH <= 72 && matchScore >= 68 ? "High" : matchScore >= 50 ? "Medium" : "Low";

  const hasBudget = Boolean(opp.budgetMin || opp.budgetMax);
  const quality: Qualification["quality"] =
    opp.description.length > 280 && hasBudget && opp.skills.length >= 3
      ? "Excellent"
      : opp.description.length > 140
        ? "Good"
        : opp.description.length > 40
          ? "Average"
          : "Poor";

  const competition: Qualification["competition"] =
    ageH <= 10 ? "High" : ageH <= 72 || matchScore >= 85 ? "Medium" : "Low";

  const win =
    matchScore * 0.55 +
    (intent === "Very High" ? 18 : intent === "High" ? 12 : intent === "Medium" ? 6 : 0) +
    (quality === "Excellent" ? 12 : quality === "Good" ? 8 : 3) +
    (competition === "Low" ? 14 : competition === "Medium" ? 8 : 2) +
    breakdown.freshness * 0.05;

  return {
    intent,
    quality,
    competition,
    winningProbability: Math.max(8, Math.min(96, Math.round(win))),
  };
}

export function rankOpportunities(
  items: Opportunity[],
  query: string,
  filters: SearchFilters,
  profile?: FreelancerProfile,
): RankedOpportunity[] {
  const qTerms = expandQuery(query);
  const required = tokenizeQuery(query);
  const profileSkills = (profile?.skills || []).map((s) => s.toLowerCase());
  const allTerms = [...new Set([...qTerms, ...profileSkills])];

  const ranked = items.map((opp) => {
    const text = haystack(opp);
    const skillHit = overlapScore([...required, ...profileSkills, ...opp.skills.map((s) => s.toLowerCase())], text);
    const reqHit = overlapScore(qTerms, text);
    const techHit = overlapScore(allTerms, `${opp.skills.join(" ")} ${opp.title}`.toLowerCase());
    const comboBonus =
      required.length > 1
        ? required.filter((t) => text.includes(t)).length / required.length
        : 1;

    const breakdown: MatchBreakdown = {
      skill: Math.round(skillHit.score),
      requirement: Math.round(reqHit.score * comboBonus),
      technology: Math.round(techHit.score),
      budget: Math.round(budgetScore(opp, profile)),
      experience: Math.round(experienceScore(opp, profile)),
      location: Math.round(locationScore(opp, filters, profile)),
      projectType:
        filters.projectType === "any" || opp.projectType === "unknown"
          ? 70
          : opp.projectType === filters.projectType
            ? 95
            : 40,
      freshness: Math.round(freshnessScore(opp.postedAt)),
    };

    const matchScore = Math.round(
      breakdown.skill * 0.3 +
        breakdown.requirement * 0.2 +
        breakdown.technology * 0.15 +
        breakdown.budget * 0.1 +
        breakdown.experience * 0.08 +
        breakdown.location * 0.07 +
        breakdown.projectType * 0.05 +
        breakdown.freshness * 0.05,
    );

    const topSkills = (opp.skills.length ? opp.skills : required).slice(0, 3).join(", ");
    const matchReason = `${matchScore}% Match — Your ${topSkills || query} skills ${
      comboBonus > 0.66 ? "closely match" : "partially match"
    } this requirement.`;

    return {
      ...opp,
      matchScore,
      matchReason,
      matchedTerms: [...new Set([...skillHit.matched, ...reqHit.matched])].slice(0, 8),
      qualification: qualify(opp, matchScore, breakdown),
      breakdown,
    };
  });

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}

export function applyFilters(items: RankedOpportunity[], filters: SearchFilters) {
  const now = Date.now();
  return items
    .filter((o) => (filters.includeDemo ? true : !o.isDemo))
    .filter((o) => {
      const loc = o.location.toLowerCase();
      if (filters.region === "remote") return o.remote || /remote|worldwide|anywhere/.test(loc);
      if (filters.region === "india") return /india|bengaluru|bangalore|mumbai|delhi|pune|hyderabad|chennai|kerala|remote/.test(loc);
      return true;
    })
    .filter((o) => (filters.budget ? Boolean(o.budgetMin || o.budgetMax) : true))
    .filter((o) => (filters.projectType === "any" ? true : o.projectType === filters.projectType))
    .filter((o) => {
      if (filters.recency === "any") return true;
      const ageH = (now - new Date(o.postedAt).getTime()) / 36e5;
      if (filters.recency === "today") return ageH <= 24;
      if (filters.recency === "3d") return ageH <= 72;
      return ageH <= 168;
    })
    .sort((a, b) => {
      if (filters.sort === "newest") return +new Date(b.postedAt) - +new Date(a.postedAt);
      if (filters.sort === "budget") return (b.budgetMax || b.budgetMin || 0) - (a.budgetMax || a.budgetMin || 0);
      if (filters.sort === "competition") {
        const rank = { Low: 0, Medium: 1, High: 2 };
        return rank[a.qualification.competition] - rank[b.qualification.competition];
      }
      return b.matchScore - a.matchScore;
    });
}
