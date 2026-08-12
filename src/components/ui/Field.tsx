import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{children}</label>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-black/20 px-3.5 py-2.5 text-sm text-[var(--text)] outline-none ring-mint-500/0 transition placeholder:text-[var(--muted)] focus:border-mint-500/40 focus:ring-4 focus:ring-mint-500/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-black/20 px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-mint-500/40 focus:ring-4 focus:ring-mint-500/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-black/20 px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-mint-500/40",
        className,
      )}
      {...props}
    />
  );
}
