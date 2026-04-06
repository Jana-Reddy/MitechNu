import type { PropsWithChildren } from "react";

export function SectionShell({ children }: PropsWithChildren) {
  return <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</section>;
}

export function Pill({ children }: PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
      {children}
    </span>
  );
}

