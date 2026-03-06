import knowledgeData from "@/app/data/knowledge.json";
import type { UserMemory } from "./memory";

// ─── Types ──────────────────────────────────────────────────────────

export interface LoreFragment {
  depth: number;
  hint: string;
  text: string;
}

export interface Topic {
  id: string;
  label: string;
  keywords: string[];
  instruction: string;
  lore: LoreFragment[];
}

export interface Knowledge {
  base: {
    personality: string;
    rules: string[];
  };
  topics: Topic[];
}

// ─── Knowledge Access ───────────────────────────────────────────────

export function getKnowledge(): Knowledge {
  return knowledgeData as Knowledge;
}

export function getTopicById(id: string): Topic | undefined {
  return getKnowledge().topics.find((t) => t.id === id);
}

// ─── Context Classification (keyword matching) ─────────────────────

interface ClassifyResult {
  topic: Topic;
  score: number;
}

/**
 * Determine which topic the user's message maps to.
 *
 * Priority:
 *   1. messageCount === 0 → greeting
 *   2. questStatus === "completed" → quest_complete
 *   3. questStatus === "offered" → quest_response
 *   4. Highest keyword score among remaining topics
 *   5. Fallback → general
 */
export function classifyContext(
  userMessage: string,
  questStatus: string | null,
  messageCount: number
): ClassifyResult {
  const knowledge = getKnowledge();
  const topics = knowledge.topics;
  const msg = userMessage.toLowerCase().trim();

  // Priority 1: first message = greeting
  if (messageCount === 0 || !userMessage) {
    const topic = topics.find((t) => t.id === "greeting")!;
    return { topic, score: 100 };
  }

  // Priority 2: quest completed (video uploaded)
  if (questStatus === "completed") {
    const topic = topics.find((t) => t.id === "quest_complete")!;
    return { topic, score: 100 };
  }

  // Priority 3: quest offered → check for accept / reject
  if (questStatus === "offered") {
    const topic = topics.find((t) => t.id === "quest_response")!;
    return { topic, score: 90 };
  }

  // Priority 4: keyword scoring across all topics (except quest_response)
  const scored = topics
    .filter((t) => t.keywords.length > 0 && t.id !== "quest_response")
    .map((topic) => {
      let score = 0;
      for (const kw of topic.keywords) {
        if (msg.includes(kw.toLowerCase())) {
          score += kw.length; // longer match = higher weight
        }
      }
      return { topic, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored[0];
  }

  // Priority 5: fallback → general
  const fallback = topics.find((t) => t.id === "general")!;
  return { topic: fallback, score: 0 };
}

// ─── Lore Retrieval at Depth ────────────────────────────────────────

export interface RetrievedContext {
  topic: Topic;
  currentDepth: number;
  maxDepth: number;
  /** Lore that was already shared in previous conversations */
  previousLore: LoreFragment[];
  /** Lore that may be revealed NOW */
  currentLore: LoreFragment[];
}

/**
 * Retrieve the relevant lore fragments for a topic at the user's current depth.
 */
export function retrieveLore(
  topic: Topic,
  userMemory: UserMemory | null
): RetrievedContext {
  if (topic.lore.length === 0) {
    return {
      topic,
      currentDepth: 0,
      maxDepth: 0,
      previousLore: [],
      currentLore: [],
    };
  }

  const maxDepth = Math.max(...topic.lore.map((l) => l.depth));
  const currentDepth = Math.min(
    userMemory?.depths[topic.id] ?? 0,
    maxDepth
  );

  const previousLore = topic.lore.filter((l) => l.depth < currentDepth);
  const currentLore = topic.lore.filter((l) => l.depth === currentDepth);

  return { topic, currentDepth, maxDepth, previousLore, currentLore };
}
