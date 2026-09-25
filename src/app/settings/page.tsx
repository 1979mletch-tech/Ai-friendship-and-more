"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { getProfile, saveProfile } from "@/lib/storage";
import { getSupabaseClient } from "@/lib/supabase";
import type { CompanionProfile, PersonalityStyle } from "@/lib/types";

const personalities: PersonalityStyle[] = ["Warm & upbeat", "Thoughtful & calm", "Playful & fun"];

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanionProfile>(() => getProfile());
  const [status, setStatus] = useState("");
  const supabase = useMemo(() => getSupabaseClient(), []);

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveProfile(profile);
    setStatus("Profile settings saved locally.");
  }

  async function onSignOut() {
    if (!supabase) {
      setStatus("Supabase is not configured yet. Configure env vars to manage live sessions.");
      return;
    }

    await supabase.auth.signOut();
    setStatus("Signed out.");
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Friend profile" description="Control the companion voice and style.">
        <form onSubmit={onSave} className="space-y-4">
          <input
            value={profile.name}
            onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            aria-label="Companion name"
          />
          <select
            value={profile.personality}
            onChange={(e) => setProfile((prev) => ({ ...prev, personality: e.target.value as PersonalityStyle }))}
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            aria-label="Personality"
          >
            {personalities.map((personality) => (
              <option key={personality} value={personality}>
                {personality}
              </option>
            ))}
          </select>
          <textarea
            value={profile.preferences}
            onChange={(e) => setProfile((prev) => ({ ...prev, preferences: e.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            aria-label="Conversation preferences"
          />
          <button type="submit" className="rounded-full bg-sky-300 px-5 py-2 font-medium text-slate-950 hover:bg-sky-200">
            Save profile
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Account session" description="Connected to Supabase Auth when configured.">
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
        >
          Sign out
        </button>
        <p className="mt-3 text-sm text-slate-300">{status || "Session controls stay honest about missing credentials."}</p>
        <Link href="/account" className="mt-3 inline-block text-sm text-sky-200 underline">
          Go to account sign-in
        </Link>
      </SectionCard>
    </div>
  );
}
