import { NextResponse } from "next/server";
import { env, hasOpenAiConfig } from "@/lib/env";
import { detectSafetyRisk, SAFETY_MESSAGE } from "@/lib/safety";
import type { ChatMessage } from "@/lib/types";

const SYSTEM_PROMPT =
  "You are AI Friendship, a warm AI companion. You are always transparent that you are AI. Be conversational, kind, and grounded. Use humor lightly when appropriate. Be respectful and calm when topics are serious. Never claim to be a human or therapist.";

function demoReply(latestUserMessage: string, companionName?: string) {
  const name = companionName?.trim() || process.env.NEXT_PUBLIC_COMPANION_NAME || "your AI friend";
  return `Demo mode: I’m ${name}. I can still chat while API keys are not configured. You said: “${latestUserMessage}”. If you add OPENAI_API_KEY, I can provide live model responses.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { messages?: ChatMessage[]; profile?: { name?: string; preferences?: string } };
  const messages = body.messages ?? [];

  if (messages.length > 200) {
    return NextResponse.json({ reply: "Message history is too large for one request.", mode: "demo" }, { status: 400 });
  }

  const recentMessages = messages.slice(-24);
  const latestUserMessage = [...recentMessages].reverse().find((message) => message.role === "user")?.text;
  const recentConversationMessages = recentMessages
    .filter((message): message is ChatMessage => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: String(message.text).slice(0, 2000),
    }));

  if (!latestUserMessage) {
    return NextResponse.json({ reply: "Please send a message to begin.", mode: "demo" }, { status: 400 });
  }

  if (detectSafetyRisk(latestUserMessage)) {
    return NextResponse.json({ reply: SAFETY_MESSAGE, mode: hasOpenAiConfig ? "live" : "demo", safetyFlag: true });
  }

  if (!hasOpenAiConfig) {
    return NextResponse.json({ reply: demoReply(latestUserMessage, body.profile?.name), mode: "demo" });
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.openAiKey,
      },
      body: JSON.stringify({
        model: env.openAiModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `Companion name: ${body.profile?.name ?? "Nova"}. Preferences: ${body.profile?.preferences ?? "n/a"}.`,
          },
          ...recentConversationMessages,
        ],
        temperature: 0.8,
      }),
    });
  } catch (error) {
    console.error("OpenAI chat request failed", error);
    return NextResponse.json(
      {
        reply: "The live AI service could not respond right now. Please try again in a moment.",
        mode: "live",
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    await response.text();
    console.error("OpenAI chat completion failed", {
      status: response.status,
      statusText: response.statusText,
    });

    return NextResponse.json(
      {
        reply: "The live AI service could not respond right now. Please try again in a moment.",
        mode: "live",
      },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const reply = data.choices?.[0]?.message?.content?.trim();

  return NextResponse.json({
    reply: reply || "I’m here with you. I had trouble formatting that response, but we can keep talking.",
    mode: "live",
  });
}
