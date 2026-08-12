import { AppShell } from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import SearchPage from "@/pages/Search";
import Leads from "@/pages/Leads";
import CRM from "@/pages/CRM";
import Proposals from "@/pages/Proposals";
import Alerts from "@/pages/Alerts";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import { Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
