"use client";

import { FormEvent, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { getProfile, saveProfile } from "@/lib/storage";
import type { CompanionProfile, PersonalityStyle } from "@/lib/types";

const personalityOptions: PersonalityStyle[] = ["Warm & upbeat", "Thoughtful & calm", "Playful & fun"];

export default function SetupPage() {
  const [profile, setProfile] = useState<CompanionProfile>(() => getProfile());
  const [status, setStatus] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveProfile(profile);
    setStatus("Companion setup saved on this device. Supabase profile sync can be added without changing this form.");
  }

  return (
    <SectionCard
      title="Companion setup"
      description="Pick your companion name, tone, and conversation preferences."
    >
      <form className="space-y-4" onSubmit={save}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-200">
            Companion name
          </label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            required
            maxLength={32}
          />
        </div>

        <div>
          <label htmlFor="personality" className="block text-sm font-medium text-slate-200">
            Personality style
          </label>
          <select
            id="personality"
            value={profile.personality}
            onChange={(e) => setProfile((prev) => ({ ...prev, personality: e.target.value as PersonalityStyle }))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
          >
            {personalityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="preferences" className="block text-sm font-medium text-slate-200">
            Conversation preferences
          </label>
          <textarea
            id="preferences"
            value={profile.preferences}
            onChange={(e) => setProfile((prev) => ({ ...prev, preferences: e.target.value }))}
            className="mt-1 min-h-24 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
            maxLength={300}
          />
        </div>

        <button className="rounded-full bg-sky-300 px-5 py-2 font-medium text-slate-950 hover:bg-sky-200" type="submit">
          Save setup
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-emerald-300">{status}</p>}
    </SectionCard>
  );
}
