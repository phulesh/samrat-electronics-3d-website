import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.API_PORT || 3001);
const CACHE_MS = 8 * 60 * 1000;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const VERIFY_TIMEOUT_MS = 7000;
const MAX_VERIFIED_RESULTS = 60;
const cache = new Map();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERIFICATION_DB_PATH = path.join(__dirname, "verification-db.json");
let verificationDb = {};
let verificationDbLoaded = false;
let verificationDbWrite = Promise.resolve();

const SOURCES = [
  {
    id: "remoteok",
    name: "RemoteOK",
    url: "https://remoteok.com/api",
    homepage: "https://remoteok.com",
    allowedHosts: ["remoteok.com", "www.remoteok.com"],
  },
  {
    id: "remotive",
    name: "Remotive",
    url: "https://remotive.com/api/remote-jobs",
    homepage: "https://remotive.com",
    allowedHosts: ["remotive.com", "www.remotive.com"],
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/api/job-board-api",
    homepage: "https://www.arbeitnow.com",
    allowedHosts: ["arbeitnow.com", "www.arbeitnow.com"],
  },
  {
    id: "jobicy",
    name: "Jobicy",
    url: "https://jobicy.com/api/v2/remote-jobs",
    homepage: "https://jobicy.com",
    allowedHosts: ["jobicy.com", "www.jobicy.com"],
  },
  {
    id: "himalayas",
    name: "Himalayas",
    url: "https://himalayas.app/jobs/api?limit=80",
    homepage: "https://himalayas.app",
    allowedHosts: ["himalayas.app", "www.himalayas.app"],
  },
  {
    id: "hn",
    name: "Hacker News (Algolia)",
    url: "https://hn.algolia.com/api/v1/search_by_date",
    homepage: "https://news.ycombinator.com",
    allowedHosts: ["news.ycombinator.com", "www.news.ycombinator.com"],
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

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

function samePlatformHost(url, source) {
  const parsed = isHttpUrl(url);
  if (!parsed || !source) return false;
  return source.allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
}

function sourceForOpportunity(opp = {}) {
  return SOURCES.find((s) => s.id === opp.sourceId || s.name === opp.sourceName || s.name.replace(/ \(.+\)/, "") === opp.sourceName);
}

function verificationFields(status = "UNVERIFIED", verifiedUrl = "", verifiedAt = "") {
  return {
    verifiedUrl,
    isVerified: status === "VERIFIED",
    verifiedAt,
    verificationStatus: status,
  };
}

async function loadVerificationDb() {
  if (verificationDbLoaded) return verificationDb;
  try {
    const raw = await fs.readFile(VERIFICATION_DB_PATH, "utf8");
    verificationDb = JSON.parse(raw);
  } catch {
    verificationDb = {};
  }
  verificationDbLoaded = true;
  return verificationDb;
}

async function saveVerificationDb() {
  await fs.mkdir(path.dirname(VERIFICATION_DB_PATH), { recursive: true });
  verificationDbWrite = verificationDbWrite.then(() =>
    fs.writeFile(VERIFICATION_DB_PATH, JSON.stringify(verificationDb, null, 2), "utf8"),
  );
  return verificationDbWrite;
}

function dbKey(opp) {
  return `${opp.sourceName || "unknown"}:${opp.id || opp.projectUrl || opp.applicationUrl || opp.sourceUrl}`;
}

function meaningfulTokens(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !["remote", "jobs", "developer", "engineer", "with", "from", "that"].includes(t))
    .slice(0, 10);
}

function confirmsOpportunity(pageText, url, opp) {
  const clean = stripHtml(pageText).toLowerCase();
  const titleTokens = meaningfulTokens(opp.title);
  const companyTokens = meaningfulTokens(opp.company);
  const urlText = String(url || "").toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const titleHits = titleTokens.filter((t) => clean.includes(t)).length;
  const companyHit = companyTokens.some((t) => clean.includes(t));
  const urlTitleHits = titleTokens.filter((t) => urlText.includes(t)).length;

  if (titleTokens.length === 0) return clean.length > 0;
  if (titleHits >= Math.min(2, titleTokens.length)) return true;
  if (titleHits >= 1 && companyHit) return true;
  if (urlTitleHits >= Math.min(2, titleTokens.length) && clean.length > 100) return true;
  return false;
}

async function fetchTextForVerification(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), VERIFY_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "User-Agent": "ClientFinderAI-LinkVerifier/1.0 (verified original link checker)",
      },
    });
    if (!res.ok) return { ok: false, status: `HTTP ${res.status}` };
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    return { ok: true, status: "Reachable", text: text.slice(0, 180000), contentType, finalUrl: res.url };
  } catch (err) {
    return { ok: false, status: err?.name === "AbortError" ? "Timed out" : err?.message || "Unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

async function verifyOpportunityLink(opp, options = {}) {
  await loadVerificationDb();
  const source = sourceForOpportunity(opp);
  const key = dbKey(opp);
  const existing = verificationDb[key];
  if (!options.force && existing?.verifiedAt && Date.now() - new Date(existing.verifiedAt).getTime() < VERIFICATION_TTL_MS) {
    return { ...opp, ...existing };
  }

  const now = new Date().toISOString();
  const base = {
    sourceName: opp.sourceName || source?.name || "Unknown Source",
    sourceUrl: opp.sourceUrl || source?.homepage || "",
    projectUrl: opp.projectUrl || "",
    applicationUrl: opp.applicationUrl || "",
    verifiedAt: now,
  };

  if (opp.isDemo) {
    const record = {
      ...base,
      verifiedUrl: "",
      isVerified: false,
      verificationStatus: "UNAVAILABLE",
      verificationMessage: "Demo data is not a real client opportunity.",
    };
    verificationDb[key] = record;
    await saveVerificationDb();
    return { ...opp, ...record };
  }

  if (!source) {
    const record = { ...base, ...verificationFields("UNVERIFIED", "", now), verificationMessage: "Unknown original source platform." };
    verificationDb[key] = record;
    await saveVerificationDb();
    return { ...opp, ...record };
  }

  const candidates = [
    ["applicationUrl", opp.applicationUrl],
    ["projectUrl", opp.projectUrl],
    ["sourceUrl", opp.sourceUrl],
  ].filter(([, value]) => value);

  for (const [field, candidate] of candidates) {
    const parsed = isHttpUrl(candidate);
    if (!parsed) continue;
    if (!samePlatformHost(parsed.href, source)) continue;
    const fetched = await fetchTextForVerification(parsed.href);
    if (!fetched.ok) continue;
    const finalUrl = fetched.finalUrl || parsed.href;
    if (!samePlatformHost(finalUrl, source)) continue;
    if (!confirmsOpportunity(fetched.text || "", finalUrl, opp)) continue;

    const verifiedUrl = candidate;
    const record = {
      ...base,
      verifiedUrl,
      isVerified: true,
      verifiedAt: now,
      verificationStatus: "VERIFIED",
      verificationMessage: `Verified via ${field} on ${source.name}.`,
    };
    verificationDb[key] = record;
    await saveVerificationDb();
    return { ...opp, ...record };
  }

  const hasAnyHttpUrl = candidates.some(([, value]) => isHttpUrl(value));
  const expiredPreviouslyVerified = Boolean(existing?.isVerified);
  const record = {
    ...base,
    verifiedUrl: "",
    isVerified: false,
    verifiedAt: now,
    verificationStatus: expiredPreviouslyVerified ? "EXPIRED" : hasAnyHttpUrl ? "UNVERIFIED" : "UNAVAILABLE",
    verificationMessage: expiredPreviouslyVerified
      ? "Previously verified link expired and could not be re-verified."
      : hasAnyHttpUrl
        ? "Source link could not be verified on the original platform."
        : "No real HTTP/HTTPS source URL was supplied by the connected source.",
  };
  verificationDb[key] = record;
  await saveVerificationDb();
  return { ...opp, ...record };
}

async function mapLimit(items, limit, mapper) {
  const out = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      out[current] = await mapper(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function sourceFields(source, projectUrl, applicationUrl = "") {
  return {
    sourceId: source.id,
    sourceName: source.name.replace(/ \(.+\)/, ""),
    sourceUrl: source.homepage,
    projectUrl: projectUrl || "",
    applicationUrl: applicationUrl || "",
    ...verificationFields("UNVERIFIED"),
  };
}

function normalizeRemoteOK(data) {
  const source = SOURCES.find((s) => s.id === "remoteok");
  if (!Array.isArray(data) || !source) return [];
  return data
    .filter((row) => row && row.position && row.id && !row.legal)
    .slice(0, 80)
    .map((row) => {
      const budget = parseBudget(
        row.salary || (row.salary_min && row.salary_max ? `${row.salary_min}-${row.salary_max}` : ""),
      );
      const desc = stripHtml(row.description || "");
      const projectUrl = row.url || "";
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
        ...sourceFields(source, projectUrl, row.apply_url && samePlatformHost(row.apply_url, source) ? row.apply_url : ""),
        company: row.company,
        isDemo: false,
        tags: uniqueSkills(row.tags || []),
      };
    });
}

function normalizeRemotive(data) {
  const source = SOURCES.find((s) => s.id === "remotive");
  const jobs = data?.jobs || [];
  if (!source) return [];
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
      ...sourceFields(source, row.url),
      company: row.company_name,
      isDemo: false,
      tags: uniqueSkills(row.tags || []),
    };
  });
}

function normalizeArbeitnow(data) {
  const source = SOURCES.find((s) => s.id === "arbeitnow");
  const jobs = data?.data || [];
  if (!source) return [];
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
      ...sourceFields(source, row.url),
      company: row.company_name,
      isDemo: false,
      tags: uniqueSkills(row.tags || []),
    };
  });
}

function normalizeJobicy(data) {
  const source = SOURCES.find((s) => s.id === "jobicy");
  const jobs = data?.jobs || [];
  if (!source) return [];
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
      ...sourceFields(source, row.url),
      company: row.companyName,
      isDemo: false,
      tags: uniqueSkills([row.jobType, row.jobLevel].filter(Boolean)),
    };
  });
}

function normalizeHimalayas(data) {
  const source = SOURCES.find((s) => s.id === "himalayas");
  const jobs = data?.jobs || data?.data || (Array.isArray(data) ? data : []);
  if (!source) return [];
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
      ...sourceFields(source, samePlatformHost(row.url || row.guid, source) ? row.url || row.guid : "", row.applicationLink && samePlatformHost(row.applicationLink, source) ? row.applicationLink : ""),
      company: row.companyName,
      isDemo: false,
      tags: uniqueSkills(row.categories || []),
    };
  });
}

function normalizeHN(data) {
  const source = SOURCES.find((s) => s.id === "hn");
  const hits = data?.hits || [];
  if (!source) return [];
  return hits
    .filter((h) => h.title || h.story_title || h.comment_text)
    .slice(0, 40)
    .map((h) => {
      const title = h.title || h.story_title || "HN freelance thread";
      const desc = stripHtml(h.comment_text || h.story_text || title);
      const projectUrl = samePlatformHost(h.url, source) ? h.url : "";
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
        ...sourceFields(source, projectUrl),
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
    const urlKey = item.projectUrl || item.applicationUrl || item.sourceUrl;
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
  const unverifiedResults = dedupe(settled.flatMap((s) => s.items)).slice(0, MAX_VERIFIED_RESULTS);
  const results = await mapLimit(unverifiedResults, 8, (item) => verifyOpportunityLink(item));
  const sources = settled.map((s) => ({
    id: s.source.id,
    name: s.source.name,
    ok: s.ok,
    count: s.items.length,
    verifiedCount: results.filter((item) => item.sourceId === s.source.id && item.isVerified).length,
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
      ? "Real opportunities are marked only after their original platform link is verified. Unverified items cannot be applied to."
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

app.post("/api/opportunities/verify", async (req, res) => {
  try {
    const opportunity = req.body?.opportunity;
    if (!opportunity?.id) {
      res.status(400).json({ error: "Opportunity payload is required." });
      return;
    }
    const verified = await verifyOpportunityLink(opportunity, { force: true });
    for (const [key, value] of cache.entries()) {
      cache.set(key, {
        ...value,
        payload: {
          ...value.payload,
          results: value.payload.results.map((item) => (item.id === verified.id ? { ...item, ...verified } : item)),
        },
      });
    }
    res.json({ opportunity: verified });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Verification failed" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[clientfinder-api] listening on ${PORT}`);
});
