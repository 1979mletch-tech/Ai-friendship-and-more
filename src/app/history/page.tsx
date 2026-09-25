"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionCard } from "@/components/section-card";
import { getConversations, saveConversations } from "@/lib/storage";
import type { Conversation } from "@/lib/types";

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getConversations());

  function persist(next: Conversation[]) {
    setConversations(next);
    saveConversations(next);
  }

  return (
    <SectionCard title="Conversation history" description="Continue previous chats or clear old conversations.">
      <ul className="space-y-3">
        {conversations.length === 0 && <li className="text-sm text-slate-300">No conversation history yet.</li>}
        {conversations.map((conversation) => (
          <li key={conversation.id} className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
            <p className="font-medium text-white">{conversation.title}</p>
            <p className="mt-1 text-xs text-slate-300">
              Updated {new Date(conversation.updatedAt).toLocaleString()} • {conversation.messages.length} messages
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/chat?conversation=${conversation.id}`}
                className="rounded-full bg-sky-300 px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-200"
              >
                Continue
              </Link>
              <button
                type="button"
                className="rounded-full border border-rose-300/50 px-4 py-1.5 text-sm text-rose-100 hover:bg-rose-500/20"
                onClick={() => persist(conversations.filter((item) => item.id !== conversation.id))}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 rounded-full border border-rose-300/50 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/20"
        onClick={() => persist([])}
      >
        Clear all history
      </button>
    </SectionCard>
  );
}
