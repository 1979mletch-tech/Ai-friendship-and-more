"use client";

import { FormEvent, useMemo, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { getConversations, getProfile, saveConversations } from "@/lib/storage";
import type { ChatMessage, Conversation } from "@/lib/types";

const suggestions = ["How can I reset my day?", "Tell me a light joke", "Help me think through a decision", "Let’s do a calm wind down"]; 

const DEFAULT_CONVERSATION_TITLE = "New conversation";

function createConversation(id = crypto.randomUUID()) {
  return {
    id,
    title: DEFAULT_CONVERSATION_TITLE,
    updatedAt: new Date().toISOString(),
    messages: [],
  } satisfies Conversation;
}

export default function ChatClient({ conversationId, topic }: { conversationId: string | null; topic: string | null }) {
  const initialConversations = useMemo(() => getConversations(), []);
  const [, setAllConversations] = useState<Conversation[]>(initialConversations);
  const [conversation, setConversation] = useState<Conversation>(() => {
    if (conversationId) {
      return initialConversations.find((item) => item.id === conversationId) ?? createConversation(conversationId);
    }
    return createConversation();
  });
  const [input, setInput] = useState(topic ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const profile = useMemo(() => getProfile(), []);

  function persist(nextConversation: Conversation) {
    setAllConversations((currentConversations) => {
      const withoutCurrent = currentConversations.filter((item) => item.id !== nextConversation.id);
      const firstUserMessage = nextConversation.messages.find((m) => m.role === "user")?.text.slice(0, 48);
      const title =
        nextConversation.title === DEFAULT_CONVERSATION_TITLE
          ? firstUserMessage || DEFAULT_CONVERSATION_TITLE
          : nextConversation.title;

      const updated = [
        { ...nextConversation, title, updatedAt: new Date().toISOString() },
        ...withoutCurrent,
      ].slice(0, 50);
      saveConversations(updated);
      return updated;
    });
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversation || !input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: input.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextConversation = { ...conversation, messages: [...conversation.messages, userMessage] };
    setConversation(nextConversation);
    persist(nextConversation);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextConversation.messages, profile }),
      });

      if (!response.ok) {
        throw new Error("Unable to reach companion service right now.");
      }

      const data = (await response.json()) as { reply: string; mode: "demo" | "live"; safetyFlag?: boolean };
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.reply,
        createdAt: new Date().toISOString(),
        mode: data.mode,
        safetyFlag: data.safetyFlag,
      };

      const completedConversation = {
        ...nextConversation,
        messages: [...nextConversation.messages, assistantMessage],
      };
      setConversation(completedConversation);
      persist(completedConversation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMessage);
      const failedAssistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `I couldn’t respond right now (${errorMessage}). Please try again.`,
        createdAt: new Date().toISOString(),
        mode: "demo",
      };
      const failedConversation = {
        ...nextConversation,
        messages: [...nextConversation.messages, failedAssistantMessage],
      };
      setConversation(failedConversation);
      persist(failedConversation);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Talk to ${profile.name}`}
        description={`${profile.name} is AI, not human. Tone: ${profile.personality}.`}
      >
        <div className="space-y-4">
          <div className="max-h-[52vh] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/80 p-4">
            {conversation.messages.length === 0 ? (
              <p className="text-sm text-slate-300">
                Start your conversation. Suggested prompts are below for quick ideas.
              </p>
            ) : (
              conversation.messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    message.role === "user" ? "ml-8 bg-sky-500/20" : "mr-8 bg-white/10"
                  }`}
                >
                  <p className="font-medium text-sky-100">{message.role === "user" ? "You" : `${profile.name} (AI)`}</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-100">{message.text}</p>
                  {message.mode === "demo" && <p className="mt-1 text-xs text-amber-200">Demo response (no live model key configured)</p>}
                  {message.safetyFlag && (
                    <p className="mt-1 text-xs text-amber-100">Safety escalation language shown. Requires professional review before production launch.</p>
                  )}
                </article>
              ))
            )}
            {loading && <p className="text-sm text-slate-300">{profile.name} is typing…</p>}
          </div>

          <form onSubmit={send} className="space-y-3">
            <label htmlFor="chat-input" className="sr-only">
              Chat input
            </label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what’s on your mind..."
              className="min-h-24 w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2"
              required
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-sky-300 px-5 py-2 font-medium text-slate-950 hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </form>
        </div>
      </SectionCard>

      <SectionCard title="Suggested prompts" description="Tap one to fill the composer.">
        <div className="grid gap-2 sm:grid-cols-2">
          {suggestions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-left text-sm text-slate-100 hover:border-sky-300/50"
              onClick={() => setInput(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
