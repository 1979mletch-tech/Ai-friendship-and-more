import ChatClient from "./chat-client";

type ChatPageProps = {
  searchParams: Promise<{
    conversation?: string;
    topic?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;

  return (
    <ChatClient
      key={params.conversation ?? "new-conversation"}
      conversationId={params.conversation ?? null}
      topic={params.topic ?? null}
    />
  );
}
