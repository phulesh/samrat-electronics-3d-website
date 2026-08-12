import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "mint" | "gold" | "iris" | "rose" | "demo";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "default" && "bg-white/8 text-[var(--muted)]",
        tone === "mint" && "bg-mint-500/15 text-mint-400",
        tone === "gold" && "bg-gold-500/15 text-gold-400",
        tone === "iris" && "bg-iris-500/15 text-iris-400",
        tone === "rose" && "bg-rose-500/15 text-rose-300",
        tone === "demo" && "bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30",
        className,
      )}
    >
      {children}
    </span>
  );
}
