import { MORE_NAV, NAV, MOBILE_NAV } from "./nav";
import { ThemeToggle } from "./ThemeToggle";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/cn";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function AppShell() {
  const location = useLocation();
  const hydrate = useAppStore((s) => s.hydrate);
  const ready = useAppStore((s) => s.ready);
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2600);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  const isHome = location.pathname === "/";
  const [more, setMore] = useState(false);
  const moreActive = MORE_NAV.some((n) => location.pathname.startsWith(n.to));

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-sm text-[var(--muted)]">Loading ClientFinder AI…</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--line)] bg-black/20 p-4", !isHome && "lg:flex")}>
        <NavLink to="/" className="mb-8 flex items-center gap-3 px-2">
          <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
          <div>
            <div className="font-display text-base font-bold leading-none">ClientFinder AI</div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">Find clients who need you</div>
          </div>
        </NavLink>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]",
                  isActive && "bg-mint-500/10 text-mint-400",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.to === "/alerts" && unread > 0 && (
                <span className="ml-auto rounded-full bg-mint-500 px-1.5 text-[10px] font-bold text-ink-950">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-[var(--line)] p-3 text-xs text-[var(--muted)]">
          Public sources only. Every opportunity keeps its original link.
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-display text-sm font-bold">ClientFinder AI</span>
        </NavLink>
        <ThemeToggle />
      </header>

      <div className={cn("pb-24 lg:pb-0", !isHome && "lg:pl-64")}>
        <div className={cn("hidden items-center justify-end gap-3 px-8 py-4", !isHome && "lg:flex")}>
          <ThemeToggle />
        </div>
        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--bg)]/92 px-1 py-2 backdrop-blur-xl lg:hidden">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMore(false)}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold text-[var(--muted)]",
                isActive && "text-mint-400",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label.split(" ")[0]}
          </NavLink>
        ))}
        <button
          onClick={() => setMore((v) => !v)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px] font-semibold text-[var(--muted)]",
            (more || moreActive) && "text-mint-400",
          )}
        >
          {more ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          More
        </button>
      </nav>

      {more && (
        <div className="fixed inset-x-2 bottom-20 z-40 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-2 shadow-glass lg:hidden">
          {MORE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMore(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--muted)]",
                  isActive && "bg-mint-500/10 text-mint-400",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.to === "/alerts" && unread > 0 && (
                <span className="ml-auto rounded-full bg-mint-500 px-1.5 text-[10px] font-bold text-ink-950">{unread}</span>
              )}
            </NavLink>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-sm text-white shadow-glass lg:bottom-8">
          {toast.message}
        </div>
      )}
    </div>
  );
}
