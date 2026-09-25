"use client";

import { FormEvent, useMemo, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { getSupabaseClient } from "@/lib/supabase";

export default function AccountPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setStatus(
        "Supabase credentials are not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign-in.",
      );
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(`Sign-in failed: ${error.message}`);
      } else {
        setStatus("Signed in successfully.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? `Sign-in failed: ${error.message}` : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Account"
      description="AI Friendship is an AI companion. This account area prepares secure sign-in with Supabase Auth."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-sky-300 px-5 py-2 font-medium text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-300">
        {status ||
          "No fake account states: if auth is not configured, the form remains usable and shows a clear setup message."}
      </p>
    </SectionCard>
  );
}
