import type { CompanionProfile, Conversation, MemoryItem } from "@/lib/types";

const PROFILE_KEY = "ai-friendship-profile";
const MEMORY_KEY = "ai-friendship-memory";
const HISTORY_KEY = "ai-friendship-history";

const DEFAULT_PROFILE: CompanionProfile = {
  name: "Nova",
  personality: "Warm & upbeat",
  preferences: "Light humour and practical encouragement.",
};

function safeParse<T>(value: string | null, fallback: T) {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getProfile() {
  if (!canUseStorage()) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...safeParse<Partial<CompanionProfile>>(localStorage.getItem(PROFILE_KEY), {}) };
}

export function saveProfile(profile: CompanionProfile) {
  if (!canUseStorage()) return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getMemoryItems() {
  if (!canUseStorage()) return [] as MemoryItem[];
  return safeParse<MemoryItem[]>(localStorage.getItem(MEMORY_KEY), []);
}

export function saveMemoryItems(items: MemoryItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(items));
}

export function getConversations() {
  if (!canUseStorage()) return [] as Conversation[];
  return safeParse<Conversation[]>(localStorage.getItem(HISTORY_KEY), []);
}

export function saveConversations(conversations: Conversation[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
}

export function clearMemory() {
  if (!canUseStorage()) return;
  localStorage.removeItem(MEMORY_KEY);
}

export function clearHistory() {
  if (!canUseStorage()) return;
  localStorage.removeItem(HISTORY_KEY);
}

export function clearLocalData() {
  if (!canUseStorage()) return;
  localStorage.removeItem(PROFILE_KEY);
  clearMemory();
  clearHistory();
}

export { DEFAULT_PROFILE };
