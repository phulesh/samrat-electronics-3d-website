import express from "express";
import cors from "cors";

const PORT = Number(process.env.API_PORT || 3001);
const CACHE_MS = 8 * 60 * 1000;
const cache = new Map();

const SOURCES = [
  {
    id: "remoteok",
    name: "RemoteOK",
    url: "https://remoteok.com/api",
    homepage: "https://remoteok.com",
  },
  {
    id: "remotive",
    name: "Remotive",
    url: "https://remotive.com/api/remote-jobs",
    homepage: "https://remotive.com",
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/api/job-board-api",
    homepage: "https://www.arbeitnow.com",
  },
  {
    id: "jobicy",
    name: "Jobicy",
    url: "https://jobicy.com/api/v2/remote-jobs",
    homepage: "https://jobicy.com",
  },
  {
    id: "himalayas",
    name: "Himalayas",
    url: "https://himalayas.app/jobs/api?limit=80",
    homepage: "https://himalayas.app",
  },
  {
    id: "hn",
    name: "Hacker News (Algolia)",
    url: "https://hn.algolia.com/api/v1/search_by_date",
    homepage: "https://news.ycombinator.com",
  },
];

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function stripHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(text, n = 280) {
  if (!text) return "";
  return text.length > n ? `${text.slice(0, n).trim()}…` : text;
}

function inferProjectType(raw = "") {
  const t = raw.toLowerCase();
  if (t.includes("hour")) return "hourly";
  if (t.includes("full") || t.includes("contract") || t.includes("fixed") || t.includes("project")) {
    return t.includes("hour") ? "hourly" : "fixed";
  }
  return "unknown";
}

function parseBudget(raw) {
  if (!raw) return { min: undefined, max: undefined, currency: "USD", label: "Not disclosed" };
  const text = String(raw);
  const currency = text.includes("€") || /eur/i.test(text) ? "EUR" : text.includes("£") || /gbp/i.test(text) ? "GBP" : text.includes("₹") || /inr|rs\.?/i.test(text) ? "INR" : "USD";
  const nums = [...text.replace(/,/g, "").matchAll(/(\d+(\.\d+)?)\s*(k)?/gi)].map((m) => {
    const n = Number(m[1]);
    return m[3] ? n * 1000 : n;
  });
  if (!nums.length) return { min: undefined, max: undefined, currency, label: text.slice(0, 40) };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const symbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return {
    min,
    max,
    currency,
    label: min === max ? `${symbol}${Math.round(min).toLocaleString()}` : `${symbol}${Math.round(min).toLocaleString()} – ${symbol}${Math.round(max).toLocaleString()}`,
  };
}

function uniqueSkills(list = []) {
  const out = [];
  for (const item of list) {
    const s = String(item || "").trim();
    if (!s) continue;
    if (!out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  return out.slice(0, 8);
}

async function fetchJson(url, timeoutMs = 9000, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "ClientFinderAI/1.0 (public-source aggregator; +https://clientfinder.ai)",
        ...headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeRemoteOK(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((row) => row && row.position && row.id && !row.legal)
    .slice(0, 80)
    .map((row) => {
      const budget = parseBudget(
        row.salary || (row.salary_min && row.salary_max ? `${row.salary_min}-${row.salary_max}` : ""),
      );
      const desc = stripHtml(row.description || "");
      return {
        id: `remoteok-${row.id}`,
        title: row.position,
        description: desc,
        shortDescription: clip(desc),
        skills: uniqueSkills(row.tags || []),
        budgetMin: row.salary_min || budget.min,
        budgetMax: row.salary_max || budget.max,
        budgetCurrency: budget.currency,
        budgetLabel: budget.label,
        projectType: inferProjectType(row.salary || ""),
        location: row.location || "Remote",
        remote: true,
        postedAt: row.date || new Date((row.epoch || 0) * 1000).toISOString(),
        sourceName: "RemoteOK",
        sourceUrl: row.url || row.apply_url || `https://remoteok.com/remote-jobs/${row.id}`,
        company: row.company,
        isDemo: false,
        tags: uniqueSkills(row.tags || []),
      };
    });
}

function normalizeRemotive(data) {
  const jobs = data?.jobs || [];
  return jobs.slice(0, 80).map((row) => {
    const desc = stripHtml(row.description || "");
    const budget = parseBudget(row.salary);
    return {
      id: `remotive-${row.id}`,
      title: row.title,
      description: desc,
      shortDescription: clip(desc),
      skills: uniqueSkills(row.tags || [row.category]),
      budgetMin: budget.min,
      budgetMax: budget.max,
      budgetCurrency: budget.currency,
      budgetLabel: budget.label,
      projectType: inferProjectType(row.job_type || ""),
      location: row.candidate_required_location || "Remote",
      remote: true,
      postedAt: row.publication_date,
      sourceName: "Remotive",
      sourceUrl: row.url,
      company: row.company_name,
      isDemo: false,
      tags: uniqueSkills(row.tags || []),
    };
  });
}

function normalizeArbeitnow(data) {
  const jobs = data?.data || [];
  return jobs.slice(0, 80).map((row) => {
    const desc = stripHtml(row.description || "");
    return {
      id: `arbeitnow-${row.slug}`,
      title: row.title,
      description: desc,
      shortDescription: clip(desc),
      skills: uniqueSkills(row.tags || []),
      budgetMin: undefined,
      budgetMax: undefined,
      budgetCurrency: "EUR",
      budgetLabel: "Not disclosed",
      projectType: inferProjectType((row.job_types || []).join(" ")),
      location: row.location || (row.remote ? "Remote" : "Worldwide"),
      remote: Boolean(row.remote),
      postedAt: row.created_at,
      sourceName: "Arbeitnow",
      sourceUrl: row.url,
      company: row.company_name,
      isDemo: false,
      tags: uniqueSkills(row.tags || []),
    };
  });
}

function normalizeJobicy(data) {
  const jobs = data?.jobs || [];
  return jobs.slice(0, 80).map((row) => {
    const desc = stripHtml(row.jobDescription || row.jobExcerpt || "");
    const budget = parseBudget(
      row.salaryMin && row.salaryMax ? `${row.salaryCurrency || ""} ${row.salaryMin}-${row.salaryMax}` : "",
    );
    return {
      id: `jobicy-${row.id}`,
      title: row.jobTitle,
      description: desc,
      shortDescription: clip(stripHtml(row.jobExcerpt || desc)),
      skills: uniqueSkills([row.jobIndustry, row.jobLevel].filter(Boolean)),
      budgetMin: Number(row.salaryMin) || budget.min,
      budgetMax: Number(row.salaryMax) || budget.max,
      budgetCurrency: row.salaryCurrency || budget.currency,
      budgetLabel: row.salaryMin ? budget.label : "Not disclosed",
      projectType: inferProjectType(row.jobType || ""),
      location: row.jobGeo || "Remote",
      remote: /remote|anywhere|worldwide/i.test(row.jobGeo || "remote"),
      postedAt: row.pubDate,
      sourceName: "Jobicy",
      sourceUrl: row.url,
      company: row.companyName,
      isDemo: false,
      tags: uniqueSkills([row.jobType, row.jobLevel].filter(Boolean)),
    };
  });
}

function normalizeHimalayas(data) {
  const jobs = data?.jobs || data?.data || (Array.isArray(data) ? data : []);
  return jobs.slice(0, 80).map((row, i) => {
    const desc = stripHtml(row.description || row.excerpt || "");
    return {
      id: `himalayas-${row.guid || row.slug || row.title || i}`,
      title: row.title,
      description: desc,
      shortDescription: clip(desc),
      skills: uniqueSkills(row.categories || row.skills || []),
      budgetMin: row.minSalary || undefined,
      budgetMax: row.maxSalary || undefined,
      budgetCurrency: row.currency || "USD",
      budgetLabel: row.minSalary ? parseBudget(`${row.minSalary}-${row.maxSalary}`).label : "Not disclosed",
      projectType: inferProjectType(row.employmentType || ""),
      location: (row.locationRestrictions || []).join(", ") || "Remote",
      remote: true,
      postedAt: row.pubDate || row.publishedDate || new Date().toISOString(),
      sourceName: "Himalayas",
      sourceUrl: row.applicationLink || row.url || row.guid || "https://himalayas.app/jobs",
      company: row.companyName,
      isDemo: false,
      tags: uniqueSkills(row.categories || []),
    };
  });
}

function normalizeHN(data) {
  const hits = data?.hits || [];
  return hits
    .filter((h) => h.title || h.story_title || h.comment_text)
    .slice(0, 40)
    .map((h) => {
      const title = h.title || h.story_title || "HN freelance thread";
      const desc = stripHtml(h.comment_text || h.story_text || title);
      const url = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
      return {
        id: `hn-${h.objectID}`,
        title: title.replace(/^Ask HN:\s*/i, ""),
        description: desc,
        shortDescription: clip(desc),
        skills: uniqueSkills(
          (desc.match(/\b(n8n|python|react|next\.?js|wordpress|seo|chatbot|automation|node|typescript|figma|design)\b/gi) || []),
        ),
        budgetMin: undefined,
        budgetMax: undefined,
        budgetCurrency: "USD",
        budgetLabel: "Not disclosed",
        projectType: "unknown",
        location: "Remote · Worldwide",
        remote: true,
        postedAt: h.created_at,
        sourceName: "Hacker News",
        sourceUrl: url,
        company: h.author,
        isDemo: false,
        tags: ["hn", "public-thread"],
      };
    });
}

async function loadSource(source, query) {
  try {
    let data;
    if (source.id === "remotive") {
      data = await fetchJson(`${source.url}?search=${encodeURIComponent(query || "remote")}`);
      return { source, items: normalizeRemotive(data), ok: true, message: "Connected" };
    }
    if (source.id === "hn") {
      const q = query
        ? `${query} (freelancer OR freelance OR contract OR looking for OR seeking)`
        : "seeking freelancer";
      data = await fetchJson(`${source.url}?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=30`);
      return { source, items: normalizeHN(data), ok: true, message: "Connected" };
    }
    if (source.id === "jobicy" && query) {
      data = await fetchJson(`${source.url}?tag=${encodeURIComponent(query.split(" ")[0])}&count=50`);
      return { source, items: normalizeJobicy(data), ok: true, message: "Connected" };
    }
    data = await fetchJson(source.url);
    if (source.id === "remoteok") return { source, items: normalizeRemoteOK(data), ok: true, message: "Connected" };
    if (source.id === "arbeitnow") return { source, items: normalizeArbeitnow(data), ok: true, message: "Connected" };
    if (source.id === "jobicy") return { source, items: normalizeJobicy(data), ok: true, message: "Connected" };
    if (source.id === "himalayas") return { source, items: normalizeHimalayas(data), ok: true, message: "Connected" };
    return { source, items: [], ok: false, message: "Unknown source" };
  } catch (err) {
    return {
      source,
      items: [],
      ok: false,
      message: err?.name === "AbortError" ? "Timed out" : err?.message || "Unavailable",
    };
  }
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${(item.title || "").toLowerCase().slice(0, 80)}|${(item.company || "").toLowerCase()}|${item.sourceName}`;
    const urlKey = item.sourceUrl;
    if (seen.has(key) || seen.has(urlKey)) continue;
    seen.add(key);
    seen.add(urlKey);
    out.push(item);
  }
  return out;
}

async function searchOpportunities(query) {
  const cacheKey = `q:${(query || "").toLowerCase().trim()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.payload;

  const settled = await Promise.all(SOURCES.map((s) => loadSource(s, query)));
  const results = dedupe(settled.flatMap((s) => s.items));
  const sources = settled.map((s) => ({
    id: s.source.id,
    name: s.source.name,
    ok: s.ok,
    count: s.items.length,
    message: s.message,
    url: s.source.homepage,
  }));
  const liveConnected = sources.some((s) => s.ok);
  const payload = {
    query,
    liveConnected,
    sources,
    results,
    fetchedAt: new Date().toISOString(),
    notice: liveConnected
      ? undefined
      : "Live opportunity sources are not connected yet.",
  };
  cache.set(cacheKey, { at: Date.now(), payload });
  return payload;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "clientfinder-api", time: new Date().toISOString() });
});

app.get("/api/sources", async (_req, res) => {
  const payload = await searchOpportunities("");
  res.json({ sources: payload.sources, liveConnected: payload.liveConnected, fetchedAt: payload.fetchedAt });
});

app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").slice(0, 160);
    const payload = await searchOpportunities(query);
    res.json(payload);
  } catch (err) {
    res.status(500).json({
      query: req.query.q || "",
      liveConnected: false,
      sources: [],
      results: [],
      fetchedAt: new Date().toISOString(),
      notice: "Live opportunity sources are not connected yet.",
      error: err?.message || "Search failed",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[clientfinder-api] listening on ${PORT}`);
});
