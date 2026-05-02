import type { ReactNode } from "react";

interface SectionTitleProps {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function SectionTitle({ label, title, description, actions }: SectionTitleProps) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
      <div className="flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between border-b-2 border-[#E0E0D8]">
        <div className="max-w-3xl space-y-3">
          <p className="section-tag">
            <span className="h-1.5 w-1.5 bg-[#E63946] inline-block rounded-full" />
            {label}
          </p>
          <h2 className="text-4xl lg:text-5xl font-700 tracking-tight text-[#080808]">{title}</h2>
          <p className="text-base leading-relaxed text-[#6B6B65]">{description}</p>
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}
