import { describe, expect, it } from "vitest";
import { POST } from "./route";

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  it("returns 400 when no user message is provided", async () => {
    const response = await POST(buildRequest({ messages: [] }));
    const data = (await response.json()) as { reply: string; mode: string };

    expect(response.status).toBe(400);
    expect(data.reply).toContain("Please send a message");
    expect(data.mode).toBe("demo");
  });

  it("returns 400 when message history is too large", async () => {
    const messages = Array.from({ length: 201 }).map((_, index) => ({
      id: `${index}`,
      role: "user" as const,
      text: `message ${index}`,
      createdAt: "2026-01-01T00:00:00.000Z",
    }));

    const response = await POST(buildRequest({ messages }));
    const data = (await response.json()) as { reply: string; mode: string };

    expect(response.status).toBe(400);
    expect(data.reply).toContain("too large");
    expect(data.mode).toBe("demo");
  });
});
