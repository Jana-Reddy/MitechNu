import type { ReactNode } from "react";
import { Pill, SectionShell } from "@academy/ui";

interface SectionTitleProps {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function SectionTitle({ label, title, description, actions }: SectionTitleProps) {
  return (
    <SectionShell>
      <div className="flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-4">
          <Pill>{label}</Pill>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
            <p className="text-base leading-7 text-slate-600">{description}</p>
          </div>
        </div>
        {actions}
      </div>
    </SectionShell>
  );
}

