import { create } from "zustand";
import { DEMO_OPPORTUNITIES } from "@/data/demoOpportunities";
import { applyFilters, rankOpportunities } from "@/lib/matching";
import { generateProposal } from "@/lib/proposal";
import { searchLive } from "@/lib/api";
import { loadJson, saveJson } from "@/lib/storage";
import { uid } from "@/lib/format";
import { expandQuery } from "@/data/skillGraph";
import type {
  AlertFrequency,
  AppSettings,
  FreelancerProfile,
  GeneratedProposal,
  Lead,
  LeadStatus,
  NotificationItem,
  Opportunity,
  ProposalTone,
  RankedOpportunity,
  SavedSearch,
  SearchFilters,
  SourceStatus,
} from "@/types";

const defaultFilters: SearchFilters = {
  region: "worldwide",
  budget: false,
  projectType: "any",
  recency: "any",
  sort: "best",
  includeDemo: true,
};

const defaultProfile: FreelancerProfile = {
  name: "",
  skills: ["n8n", "AI Automation", "WhatsApp Bot", "Google Sheets"],
  services: ["Workflow automation", "AI chatbots", "CRM integrations"],
  experienceYears: 4,
  minBudget: 10000,
  preferredBudget: 25000,
  location: "India",
  languages: ["English", "Hindi"],
  portfolio: "",
  github: "",
  website: "",
  description:
    "I design and ship automation systems that turn WhatsApp, CRMs, and spreadsheets into reliable client-acquisition machines.",
};

const defaultSettings: AppSettings = {
  theme: "dark",
  includeDemo: true,
  openaiKey: "",
  defaultCurrency: "INR",
};

interface AppState {
  ready: boolean;
  settings: AppSettings;
  profile: FreelancerProfile;
  filters: SearchFilters;
  query: string;
  smart: boolean;
  loading: boolean;
  liveConnected: boolean;
  notice?: string;
  sources: SourceStatus[];
  expandedTerms: string[];
  rawResults: Opportunity[];
  results: RankedOpportunity[];
  selected?: RankedOpportunity;
  leads: Lead[];
  savedSearches: SavedSearch[];
  notifications: NotificationItem[];
  proposals: GeneratedProposal[];
  toast?: { id: string; message: string };
  hydrate: () => void;
  setTheme: (theme: "dark" | "light") => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateProfile: (patch: Partial<FreelancerProfile>) => void;
  setFilters: (patch: Partial<SearchFilters>) => void;
  setQuery: (q: string) => void;
  runSearch: (q: string, smart?: boolean) => Promise<void>;
  selectOpportunity: (opp?: RankedOpportunity) => void;
  saveLead: (opp: RankedOpportunity) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  generateFor: (opp: RankedOpportunity, tone: ProposalTone, leadId?: string) => GeneratedProposal;
  saveSearch: (label?: string) => void;
  updateSavedSearch: (id: string, patch: Partial<SavedSearch>) => void;
  deleteSavedSearch: (id: string) => void;
  markNotificationsRead: () => void;
  pushToast: (message: string) => void;
  clearToast: () => void;
  checkAlerts: () => void;
}

function persist(partial: Partial<Pick<AppState, "settings" | "profile" | "leads" | "savedSearches" | "notifications" | "proposals" | "filters">>) {
  if (partial.settings) saveJson("settings", partial.settings);
  if (partial.profile) saveJson("profile", partial.profile);
  if (partial.leads) saveJson("leads", partial.leads);
  if (partial.savedSearches) saveJson("savedSearches", partial.savedSearches);
  if (partial.notifications) saveJson("notifications", partial.notifications);
  if (partial.proposals) saveJson("proposals", partial.proposals);
  if (partial.filters) saveJson("filters", partial.filters);
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  settings: defaultSettings,
  profile: defaultProfile,
  filters: defaultFilters,
  query: "",
  smart: true,
  loading: false,
  liveConnected: false,
  sources: [],
  expandedTerms: [],
  rawResults: [],
  results: [],
  leads: [],
  savedSearches: [],
  notifications: [],
  proposals: [],

  hydrate: () => {
    const settings = loadJson("settings", defaultSettings);
    const profile = loadJson("profile", defaultProfile);
    const leads = loadJson("leads", [] as Lead[]);
    const savedSearches = loadJson("savedSearches", [] as SavedSearch[]);
    const notifications = loadJson("notifications", [] as NotificationItem[]);
    const proposals = loadJson("proposals", [] as GeneratedProposal[]);
    const filters = { ...defaultFilters, ...loadJson("filters", defaultFilters), includeDemo: settings.includeDemo };
    document.documentElement.classList.toggle("dark", settings.theme !== "light");
    document.documentElement.classList.toggle("light", settings.theme === "light");
    set({ ready: true, settings, profile, leads, savedSearches, notifications, proposals, filters });
  },

  setTheme: (theme) => {
    const settings = { ...get().settings, theme };
    document.documentElement.classList.toggle("dark", theme !== "light");
    document.documentElement.classList.toggle("light", theme === "light");
    persist({ settings });
    set({ settings });
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    const filters = { ...get().filters, includeDemo: settings.includeDemo };
    persist({ settings, filters });
    set({ settings, filters });
    const { rawResults, query, profile } = get();
    if (rawResults.length) {
      set({ results: applyFilters(rankOpportunities(rawResults, query, filters, profile), filters) });
    }
  },

  updateProfile: (patch) => {
    const profile = { ...get().profile, ...patch };
    persist({ profile });
    set({ profile });
  },

  setFilters: (patch) => {
    const filters = { ...get().filters, ...patch };
    persist({ filters });
    const { rawResults, query, profile } = get();
    set({
      filters,
      results: applyFilters(rankOpportunities(rawResults, query, filters, profile), filters),
    });
  },

  setQuery: (query) => set({ query }),

  runSearch: async (q, smart = true) => {
    const query = q.trim();
    const { filters, profile, settings } = get();
    set({ loading: true, query, smart, notice: undefined });
    let live: Opportunity[] = [];
    let liveConnected = false;
    let sources: SourceStatus[] = [];
    let notice: string | undefined;
    try {
      const payload = await searchLive(query);
      live = payload.results || [];
      liveConnected = payload.liveConnected;
      sources = payload.sources || [];
      notice = payload.notice;
    } catch {
      liveConnected = false;
      notice = "Live opportunity sources are not connected yet.";
    }

    const merged: Opportunity[] = [...live];
    if (settings.includeDemo) {
      merged.push(...DEMO_OPPORTUNITIES);
    }
    const ranked = applyFilters(rankOpportunities(merged, query, { ...filters, includeDemo: settings.includeDemo }, profile), {
      ...filters,
      includeDemo: settings.includeDemo,
    });
    set({
      loading: false,
      liveConnected,
      sources,
      notice: liveConnected ? notice : "Live opportunity sources are not connected yet.",
      expandedTerms: expandQuery(query),
      rawResults: merged,
      results: ranked,
    });
    get().checkAlerts();
  },

  selectOpportunity: (selected) => set({ selected }),

  saveLead: (opp) => {
    const existing = get().leads.find((l) => l.opportunity.id === opp.id);
    if (existing) {
      get().pushToast("Already saved in CRM");
      return existing;
    }
    const now = new Date().toISOString();
    const lead: Lead = {
      id: uid("lead"),
      opportunity: opp,
      status: "New Lead",
      notes: "",
      tags: opp.skills.slice(0, 3),
      createdAt: now,
      updatedAt: now,
    };
    const leads = [lead, ...get().leads];
    persist({ leads });
    set({ leads });
    get().pushToast("Lead saved to CRM");
    return lead;
  },

  updateLead: (id, patch) => {
    const leads = get().leads.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l));
    persist({ leads });
    set({ leads });
  },

  deleteLead: (id) => {
    const leads = get().leads.filter((l) => l.id !== id);
    persist({ leads });
    set({ leads });
    get().pushToast("Lead deleted");
  },

  generateFor: (opp, tone, leadId) => {
    const content = generateProposal(opp, get().profile, tone);
    const proposal: GeneratedProposal = {
      id: uid("prop"),
      leadId,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      tone,
      content,
      createdAt: new Date().toISOString(),
    };
    const proposals = [proposal, ...get().proposals];
    persist({ proposals });
    if (leadId) {
      get().updateLead(leadId, { proposal: content, status: "Proposal Ready" });
    }
    set({ proposals });
    get().pushToast(tone === "short" ? "Short proposal ready" : "Professional proposal ready");
    return proposal;
  },

  saveSearch: (label) => {
    const { query, filters } = get();
    if (!query.trim()) return;
    const item: SavedSearch = {
      id: uid("ss"),
      query,
      filters,
      label: label || `${query}${filters.region !== "worldwide" ? ` · ${filters.region}` : ""}`,
      alertEnabled: false,
      frequency: "Daily",
      createdAt: new Date().toISOString(),
    };
    const savedSearches = [item, ...get().savedSearches];
    persist({ savedSearches });
    set({ savedSearches });
    get().pushToast("Search saved");
  },

  updateSavedSearch: (id, patch) => {
    const savedSearches = get().savedSearches.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persist({ savedSearches });
    set({ savedSearches });
  },

  deleteSavedSearch: (id) => {
    const savedSearches = get().savedSearches.filter((s) => s.id !== id);
    persist({ savedSearches });
    set({ savedSearches });
  },

  markNotificationsRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    persist({ notifications });
    set({ notifications });
  },

  pushToast: (message) => set({ toast: { id: uid("t"), message } }),
  clearToast: () => set({ toast: undefined }),

  checkAlerts: () => {
    const { savedSearches, results, notifications } = get();
    const now = Date.now();
    const extra: NotificationItem[] = [];
    const nextSearches = savedSearches.map((s) => {
      if (!s.alertEnabled) return s;
      const last = s.lastNotifiedAt ? +new Date(s.lastNotifiedAt) : 0;
      const gap = s.frequency === "Instant" ? 0 : s.frequency === "Daily" ? 20 * 60 * 60 * 1000 : 6 * 24 * 60 * 60 * 1000;
      if (now - last < gap) return s;
      const hits = results.filter((r) => r.title.toLowerCase().includes(s.query.split(" ")[0].toLowerCase()) || r.matchScore >= 70);
      if (!hits.length) return s;
      extra.push({
        id: uid("nt"),
        title: `New matches for “${s.label}”`,
        body: `${hits.length} opportunity${hits.length === 1 ? "" : "ies"} ready to review.`,
        href: `/search?q=${encodeURIComponent(s.query)}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      return { ...s, lastNotifiedAt: new Date().toISOString() };
    });
    if (!extra.length) return;
    const merged = [...extra, ...notifications].slice(0, 40);
    persist({ notifications: merged, savedSearches: nextSearches });
    set({ notifications: merged, savedSearches: nextSearches });
  },
}));

export const STATUS_FLOW: LeadStatus[] = [
  "New Lead",
  "Qualified",
  "Proposal Ready",
  "Proposal Sent",
  "Follow-up",
  "Won",
  "Lost",
];
