"use client";

import { useState } from "react";
import { SectionCard } from "@/components/section-card";
import { clearHistory, clearLocalData, clearMemory } from "@/lib/storage";

export default function PrivacyPage() {
  const [status, setStatus] = useState("");

  return (
    <div className="space-y-6">
      <SectionCard
        title="Privacy Centre"
        description="Control what this local demo stores. By default, profile, memory, and history are kept in your browser local storage on this device."
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
          <li>Stored locally: companion profile, non-sensitive memory notes, and conversation history.</li>
          <li>Not stored by default: payment details, legal/medical records, and hidden background analytics.</li>
          <li>When using a live OpenAI key, messages are sent to the configured API route for responses.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Delete local data" description="These controls work immediately on this device.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              clearMemory();
              setStatus("Memory cleared from local storage.");
            }}
            className="rounded-full border border-rose-300/50 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/20"
          >
            Delete memory
          </button>
          <button
            type="button"
            onClick={() => {
              clearHistory();
              setStatus("Conversation history cleared from local storage.");
            }}
            className="rounded-full border border-rose-300/50 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/20"
          >
            Delete history
          </button>
          <button
            type="button"
            onClick={() => {
              clearLocalData();
              setStatus("All local AI Friendship data cleared from this device.");
            }}
            className="rounded-full bg-rose-400 px-4 py-2 text-sm font-medium text-rose-950 hover:bg-rose-300"
          >
            Delete all local data
          </button>
        </div>
        {status && <p className="mt-3 text-sm text-emerald-300">{status}</p>}
      </SectionCard>
    </div>
  );
}
