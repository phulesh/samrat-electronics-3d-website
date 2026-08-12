import { useAppStore } from "@/store/useAppStore";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const theme = useAppStore((s) => s.settings.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] hover:bg-white/5"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
