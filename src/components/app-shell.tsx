import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["/", "Home"],
  ["/account", "Account"],
  ["/setup", "Setup"],
  ["/chat", "Chat"],
  ["/memory", "Memory"],
  ["/history", "History"],
  ["/settings", "Settings"],
  ["/privacy", "Privacy"],
  ["/safety", "Safety"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-wide text-sky-200">
            AI FRIENDSHIP
          </Link>
          <nav aria-label="Main" className="ml-auto flex flex-wrap gap-2 text-sm">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
