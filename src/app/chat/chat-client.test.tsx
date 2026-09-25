/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatClient from "./chat-client";

const HISTORY_KEY = "ai-friendship-history";
const PROFILE_KEY = "ai-friendship-profile";

describe("ChatClient", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        name: "Nova",
        personality: "Warm & upbeat",
        preferences: "Keep it concise",
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("loads an existing conversation by id", () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        {
          id: "conv-1",
          title: "Existing",
          updatedAt: "2026-01-01T00:00:00.000Z",
          messages: [
            { id: "m1", role: "user", text: "Hi", createdAt: "2026-01-01T00:00:00.000Z" },
            { id: "m2", role: "assistant", text: "Hello!", createdAt: "2026-01-01T00:00:10.000Z", mode: "demo" },
          ],
        },
      ]),
    );

    render(<ChatClient conversationId="conv-1" topic={null} />);

    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("shows an error when /api/chat fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    render(<ChatClient conversationId={null} topic={null} />);

    fireEvent.change(screen.getByLabelText("Chat input"), { target: { value: "Can you help me?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Unable to reach companion service right now.")).toBeInTheDocument();
    });

    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Array<{ messages: Array<{ text: string }> }>;
    expect(stored[0]?.messages.some((message) => message.text === "Can you help me?")).toBe(true);
    expect(stored[0]?.messages.some((message) => message.text === "Demo mode reply")).toBe(false);
  });

  it("sends a message and stores updated conversation history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reply: "Demo mode reply", mode: "demo" }),
      }),
    );

    render(<ChatClient conversationId={null} topic={"Just chat"} />);

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Demo mode reply")).toBeInTheDocument();
    });

    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Array<{ messages: Array<{ text: string }> }>;
    expect(stored[0]?.messages.some((message) => message.text === "Just chat")).toBe(true);
    expect(stored[0]?.messages.some((message) => message.text === "Demo mode reply")).toBe(true);
  });
});
