import { EXAMPLE_SEARCHES } from "@/data/skillGraph";
import { Button } from "@/components/ui/Button";
import { Sparkles, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SearchBox({
  initial = "",
  large = false,
  onSearch,
}: {
  initial?: string;
  large?: boolean;
  onSearch?: (q: string, smart: boolean) => void;
}) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  const go = (smart: boolean, value = q) => {
    const query = value.trim();
    if (!query) return;
    if (onSearch) onSearch(query, smart);
    else navigate(`/search?q=${encodeURIComponent(query)}&smart=${smart ? "1" : "0"}`);
  };

  return (
    <div className="w-full">
      <div className={`glass glow-ring rounded-2xl p-2 ${large ? "md:p-3" : ""}`}>
        <label className="sr-only" htmlFor="skill-search">
          What skill or service do you offer?
        </label>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
            <Search className="h-5 w-5 shrink-0 text-mint-400" />
            <input
              id="skill-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(true)}
              placeholder='What skill or service do you offer?  e.g. "n8n automation"'
              className={`w-full bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--muted)] ${large ? "py-3 text-base md:text-lg" : "py-2 text-sm"}`}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 md:flex-none" onClick={() => go(false)}>
              Find Clients
            </Button>
            <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => go(true)}>
              <Sparkles className="h-4 w-4 text-gold-400" />
              AI Smart Search
            </Button>
          </div>
        </div>
      </div>
      {large && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLE_SEARCHES.slice(0, 10).map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQ(ex);
                go(true, ex);
              }}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)] transition hover:border-mint-500/40 hover:text-[var(--text)]"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
