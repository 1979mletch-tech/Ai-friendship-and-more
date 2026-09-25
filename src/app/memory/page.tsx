"use client";

import { FormEvent, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { getMemoryItems, saveMemoryItems } from "@/lib/storage";
import type { MemoryItem } from "@/lib/types";

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>(() => getMemoryItems());
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function persist(next: MemoryItem[]) {
    setItems(next);
    saveMemoryItems(next);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;

    if (editingId) {
      persist(
        items.map((item) =>
          item.id === editingId ? { ...item, text: draft.trim(), updatedAt: new Date().toISOString() } : item,
        ),
      );
      setEditingId(null);
    } else {
      persist([
        { id: crypto.randomUUID(), text: draft.trim(), updatedAt: new Date().toISOString() },
        ...items,
      ]);
    }

    setDraft("");
  }

  return (
    <SectionCard
      title="Remember me"
      description="Store non-sensitive preferences and interests to keep chats consistent. Avoid health, financial, legal, or other sensitive details."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded-lg border border-white/20 bg-slate-900 px-3 py-2"
          placeholder="Example: I like evening check-ins and short replies"
          maxLength={180}
        />
        <button className="rounded-full bg-sky-300 px-5 py-2 font-medium text-slate-950 hover:bg-sky-200" type="submit">
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {items.length === 0 && <li className="text-sm text-slate-300">No memory items yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
            <p className="text-sm text-slate-100">{item.text}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDraft(item.text);
                  setEditingId(item.id);
                }}
                className="rounded border border-white/20 px-2 py-1 text-slate-200 hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => persist(items.filter((memory) => memory.id !== item.id))}
                className="rounded border border-rose-300/30 px-2 py-1 text-rose-200 hover:bg-rose-500/20"
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
        Clear memory
      </button>
    </SectionCard>
  );
}
