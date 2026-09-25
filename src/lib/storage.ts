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
  if (typeof window === "undefined") return false;
  try {
    return typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function safeGetItem(key: string) {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage may be blocked by browser policy
  }
}

function safeRemoveItem(key: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // storage may be blocked by browser policy
  }
}

export function getProfile() {
  if (!canUseStorage()) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...safeParse<Partial<CompanionProfile>>(safeGetItem(PROFILE_KEY), {}) };
}

export function saveProfile(profile: CompanionProfile) {
  safeSetItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getMemoryItems() {
  if (!canUseStorage()) return [] as MemoryItem[];
  return safeParse<MemoryItem[]>(safeGetItem(MEMORY_KEY), []);
}

export function saveMemoryItems(items: MemoryItem[]) {
  safeSetItem(MEMORY_KEY, JSON.stringify(items));
}

export function getConversations() {
  if (!canUseStorage()) return [] as Conversation[];
  return safeParse<Conversation[]>(safeGetItem(HISTORY_KEY), []);
}

export function saveConversations(conversations: Conversation[]) {
  safeSetItem(HISTORY_KEY, JSON.stringify(conversations));
}

export function clearMemory() {
  safeRemoveItem(MEMORY_KEY);
}

export function clearHistory() {
  safeRemoveItem(HISTORY_KEY);
}

export function clearLocalData() {
  safeRemoveItem(PROFILE_KEY);
  clearMemory();
  clearHistory();
}

export { DEFAULT_PROFILE };
