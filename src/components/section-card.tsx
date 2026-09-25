import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {description && <p className="mt-2 text-sm text-slate-300">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
