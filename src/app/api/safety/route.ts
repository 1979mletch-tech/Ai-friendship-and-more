import { NextResponse } from "next/server";
import { detectSafetyRisk } from "@/lib/safety";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string };
  return NextResponse.json({
    risk: detectSafetyRisk(body.text ?? ""),
  });
}
