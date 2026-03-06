// ─── Types ──────────────────────────────────────────────────────────

export interface UserMemory {
  name: string;
  firstSeen: string;
  lastSeen: string;
  /** Depth per topic: e.g. { "fate_maiden_lore": 2, "guild_lore": 1 } */
  depths: Record<string, number>;
  /** Name of the last boss defeated */
  lastDefeatedBoss: string | null;
  /** Total number of quests completed */
  questCompletedCount: number;
  /** User personality trait: e.g. "ceria", "serius", "kasar", "lucu", "tegas" */
  trait: string | null;
  /** Total number of conversation sessions (visits) */
  visitCount: number;
  /** Cumulative summary of all interactions (AI-generated, capped) */
  summary: string;
  /** Last context topic that was discussed */
  recentContext: string;
}

interface MemoriesStore {
  users: Record<string, UserMemory>;
}

// ─── Npoint Configuration ───────────────────────────────────────────

const MEMORIES_JSON_URL = process.env.MEMORIES_JSON_URL;

// ─── Read / Write (async, npoint-based) ─────────────────────────────

export async function loadMemories(): Promise<MemoriesStore> {
  try {
    if (!MEMORIES_JSON_URL) {
      console.warn("MEMORIES_JSON_URL not set, returning empty store");
      return { users: {} };
    }

    const response = await fetch(MEMORIES_JSON_URL, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Npoint fetch failed:", response.status, response.statusText);
      return { users: {} };
    }

    const data = await response.json();
    // Handle both formats: { users: {...} } or direct {...}
    if (data && typeof data === "object") {
      if (data.users && typeof data.users === "object") {
        return data as MemoriesStore;
      }
      // If stored as flat object, wrap it
      return { users: data };
    }
    return { users: {} };
  } catch (err) {
    console.error("Error loading memories from npoint:", err);
    return { users: {} };
  }
}

export async function saveMemories(store: MemoriesStore): Promise<boolean> {
  try {
    if (!MEMORIES_JSON_URL) {
      console.warn("MEMORIES_JSON_URL not set, cannot save memories");
      return false;
    }

    const response = await fetch(MEMORIES_JSON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });

    if (!response.ok) {
      console.error("Npoint save failed:", response.status, response.statusText);
      return false;
    }

    console.log("Memories saved to npoint successfully");
    return true;
  } catch (err) {
    console.error("Error saving memories to npoint:", err);
    return false;
  }
}

// ─── Query Helpers ──────────────────────────────────────────────────

/**
 * Get a user's memory by name (case-insensitive key).
 */
export async function getUserMemory(name: string): Promise<UserMemory | null> {
  const store = await loadMemories();
  const key = name.toLowerCase().trim();
  return store.users[key] ?? null;
}

/**
 * Create or update a user's memory.  
 * Merges `updates` into the existing record (or creates a new one).
 * Returns the saved UserMemory.
 */
export async function upsertUserMemory(
  name: string,
  updates: Partial<Omit<UserMemory, "name">>
): Promise<UserMemory> {
  const store = await loadMemories();
  const key = name.toLowerCase().trim();
  const now = new Date().toISOString();

  const existing: UserMemory = store.users[key] ?? {
    name,
    firstSeen: now,
    lastSeen: now,
    depths: {},
    lastDefeatedBoss: null,
    questCompletedCount: 0,
    trait: null,
    visitCount: 0,
    summary: "",
    recentContext: "",
  };

  const merged: UserMemory = {
    ...existing,
    ...updates,
    name: existing.name, // keep original casing
    firstSeen: existing.firstSeen, // never overwrite
    lastSeen: now,
  };

  store.users[key] = merged;
  await saveMemories(store);
  return merged;
}

// ─── Summary Capping ────────────────────────────────────────────────

const MAX_SUMMARY_CHARS = 300;

/**
 * Merge a new summary sentence into the existing summary.
 * If the result exceeds MAX_SUMMARY_CHARS, the OLDEST sentences are
 * trimmed so only the most recent context survives.
 * This keeps token cost predictable (≈ 80-100 tokens max).
 */
export function capSummary(existing: string, addition: string): string {
  if (!addition) return existing;

  const merged = existing ? `${existing} ${addition}` : addition;

  if (merged.length <= MAX_SUMMARY_CHARS) return merged;

  // Split into sentences, drop from the front until it fits
  const sentences = merged.split(/(?<=[.!?])\s+/);
  while (
    sentences.length > 1 &&
    sentences.join(" ").length > MAX_SUMMARY_CHARS
  ) {
    sentences.shift(); // remove oldest sentence
  }

  let result = sentences.join(" ");

  // Hard-cap just in case a single sentence exceeds limit
  if (result.length > MAX_SUMMARY_CHARS) {
    result = result.slice(result.length - MAX_SUMMARY_CHARS);
  }

  return result;
}

/**
 * Search all known users for a name mentioned in the message.
 * Optionally exclude the current speaker (so "Frentzie" asking about herself doesn't trigger).
 */
export async function findMentionedUser(
  message: string,
  excludeName?: string
): Promise<UserMemory | null> {
  const store = await loadMemories();
  const msg = message.toLowerCase();
  const exclude = excludeName?.toLowerCase().trim();

  for (const [key, user] of Object.entries(store.users)) {
    // Skip the speaker themselves
    if (exclude && key === exclude) continue;

    // Check if any known user name appears in the message
    if (msg.includes(key) || msg.includes(user.name.toLowerCase())) {
      return user;
    }
  }

  return null;
}

/**
 * Get a list of all known adventurer names (for prompt context).
 */
export async function getAllUserNames(): Promise<string[]> {
  const store = await loadMemories();
  return Object.values(store.users).map((u) => u.name);
}
