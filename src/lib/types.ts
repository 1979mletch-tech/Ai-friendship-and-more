export type PersonalityStyle = "Warm & upbeat" | "Thoughtful & calm" | "Playful & fun";

export type CompanionProfile = {
  name: string;
  personality: PersonalityStyle;
  preferences: string;
};

export type MemoryItem = {
  id: string;
  text: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  mode?: "demo" | "live";
  safetyFlag?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
};
