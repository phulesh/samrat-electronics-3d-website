import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-mint-500 text-ink-950 shadow-glow hover:bg-mint-400",
        variant === "secondary" &&
          "glass text-[var(--text)] hover:border-mint-500/40",
        variant === "ghost" && "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]",
        variant === "danger" && "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
        variant === "gold" && "bg-gold-500 text-ink-950 hover:bg-gold-400",
        className,
      )}
      {...props}
    />
  );
}
