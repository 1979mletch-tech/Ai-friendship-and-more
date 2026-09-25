import { Suspense } from "react";
import ChatClient from "./chat-client";

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="text-slate-200">Loading chat…</p>}>
      <ChatClient />
    </Suspense>
  );
}
