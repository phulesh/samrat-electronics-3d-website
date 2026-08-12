export type ProjectType = "fixed" | "hourly" | "unknown";
export type CompetitionLevel = "Low" | "Medium" | "High";
export type IntentLevel = "Very High" | "High" | "Medium" | "Low";
export type QualityLevel = "Excellent" | "Good" | "Average" | "Poor";
export type LeadStatus =
  | "New Lead"
  | "Qualified"
  | "Proposal Ready"
  | "Proposal Sent"
  | "Follow-up"
  | "Won"
  | "Lost";
export type AlertFrequency = "Instant" | "Daily" | "Weekly";
export type SortKey = "best" | "newest" | "budget" | "competition";
export type ProposalTone = "professional" | "short";

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  skills: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency: "INR" | "USD" | "EUR" | "GBP";
  budgetLabel: string;
  projectType: ProjectType;
  location: string;
  remote: boolean;
  postedAt: string;
  sourceName: string;
  sourceUrl: string;
  company?: string;
  isDemo: boolean;
  tags: string[];
}

export interface Qualification {
  intent: IntentLevel;
  quality: QualityLevel;
  competition: CompetitionLevel;
  winningProbability: number;
}

export interface MatchBreakdown {
  skill: number;
  requirement: number;
  technology: number;
  budget: number;
  experience: number;
  location: number;
  projectType: number;
  freshness: number;
}

export interface RankedOpportunity extends Opportunity {
  matchScore: number;
  matchReason: string;
  matchedTerms: string[];
  qualification: Qualification;
  breakdown: MatchBreakdown;
}

export interface SearchFilters {
  region: "worldwide" | "india" | "remote";
  budget: boolean;
  projectType: "any" | "fixed" | "hourly";
  recency: "any" | "today" | "3d" | "7d";
  sort: SortKey;
  includeDemo: boolean;
}

export interface FreelancerProfile {
  name: string;
  skills: string[];
  services: string[];
  experienceYears: number;
  minBudget: number;
  preferredBudget: number;
  location: string;
  languages: string[];
  portfolio: string;
  github: string;
  website: string;
  description: string;
}

export interface Lead {
  id: string;
  opportunity: RankedOpportunity;
  status: LeadStatus;
  notes: string;
  tags: string[];
  followUpAt?: string;
  createdAt: string;
  updatedAt: string;
  proposal?: string;
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: SearchFilters;
  label: string;
  alertEnabled: boolean;
  frequency: AlertFrequency;
  lastNotifiedAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
}

export interface GeneratedProposal {
  id: string;
  leadId?: string;
  opportunityId: string;
  opportunityTitle: string;
  tone: ProposalTone;
  content: string;
  createdAt: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  ok: boolean;
  count: number;
  message: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  expandedTerms: string[];
  liveConnected: boolean;
  sources: SourceStatus[];
  results: Opportunity[];
  fetchedAt: string;
  notice?: string;
}

export interface AppSettings {
  theme: "dark" | "light";
  includeDemo: boolean;
  openaiKey: string;
  defaultCurrency: "INR" | "USD";
}
