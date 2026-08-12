import {
  Bell,
  Bookmark,
  Home,
  KanbanSquare,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Find Clients", icon: Search },
  { to: "/leads", label: "Saved Leads", icon: Bookmark },
  { to: "/crm", label: "CRM", icon: KanbanSquare },
  { to: "/proposals", label: "Proposals", icon: Sparkles },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const MOBILE_NAV = [NAV[0], NAV[1], NAV[2], NAV[3]];

export const MORE_NAV = [NAV[4], NAV[5], NAV[6], NAV[7], NAV[8]];
