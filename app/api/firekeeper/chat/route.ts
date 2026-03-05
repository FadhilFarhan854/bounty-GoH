/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { bosses } from "@/app/data/bosses";
import promptsData from "@/app/data/firekeeperPrompts.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getRandomBoss() {
  return bosses[Math.floor(Math.random() * bosses.length)];
}

// ─── Context Detection ──────────────────────────────────────────────
// Analyze the latest user message + quest state to determine which context prompt to use

interface ContextMatch {
  id: string;
  prompt: string;
  score: number;
}

function detectContext(
  userMessage: string,
  questStatus: string | null,
  messageCount: number
): ContextMatch {
  const msg = userMessage.toLowerCase().trim();
  const contexts = promptsData.contexts;

  // Priority 1: If no messages yet, it's a greeting
  if (messageCount === 0 || !userMessage) {
    const ctx = contexts.find(c => c.id === "greeting")!;
    return { id: ctx.id, prompt: ctx.prompt, score: 100 };
  }

  // Priority 2: If quest is completed (video uploaded)
  if (questStatus === "completed") {
    const ctx = contexts.find(c => c.id === "quest_complete")!;
    return { id: ctx.id, prompt: ctx.prompt, score: 100 };
  }

  // Priority 3: If quest is offered, check for accept/reject
  if (questStatus === "offered") {
    const ctx = contexts.find(c => c.id === "quest_response")!;
    // Check if message contains accept/reject keywords
    const responseKeywords = ctx.keywords.map(k => k.toLowerCase());
    const hasMatch = responseKeywords.some(kw => msg.includes(kw));
    if (hasMatch) {
      return { id: ctx.id, prompt: ctx.prompt, score: 100 };
    }
    // Even if no exact keyword match, if quest is offered and user replies, treat as quest response
    return { id: ctx.id, prompt: ctx.prompt, score: 80 };
  }

  // Priority 4: Score all keyword-based contexts
  const scored: ContextMatch[] = contexts
    .filter(c => c.keywords && c.keywords.length > 0 && c.id !== "quest_response")
    .map(ctx => {
      let score = 0;
      for (const keyword of ctx.keywords) {
        if (msg.includes(keyword.toLowerCase())) {
          // Longer keyword matches = higher score
          score += keyword.length;
        }
      }
      return { id: ctx.id, prompt: ctx.prompt, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored[0];
  }

  // Fallback: general conversation
  const fallback = contexts.find(c => c.id === "general")!;
  return { id: fallback.id, prompt: fallback.prompt, score: 0 };
}

// ─── Build System Prompt ────────────────────────────────────────────

function buildSystemPrompt(contextPrompt: string, contextId: string): string {
  const base = promptsData.base;
  const rules = base.rules.map(r => `- ${r}`).join("\n");

  let prompt = `${base.personality}\n\nATURAN:\n${rules}\n\n`;

  // Add lore fragments as reference (not to be copy-pasted, but as guidance)
  if (contextId === "fate_maiden_lore") {
    prompt += `REFERENSI LORE (variasikan, jangan copy persis):\n`;
    for (const frag of promptsData.lore.fateMaiden.fragments) {
      prompt += `- Level ${frag.depth} (${frag.hint}): "${frag.text}"\n`;
    }
    prompt += `\n`;
  }

  if (contextId === "guild_lore") {
    prompt += `REFERENSI LORE GUILD (variasikan, jangan copy persis):\n`;
    for (const frag of promptsData.lore.guild.fragments) {
      prompt += `- Level ${frag.depth} (${frag.hint}): "${frag.text}"\n`;
    }
    prompt += `\n`;
  }

  prompt += `KONTEKS SAAT INI:\n${contextPrompt}\n\n`;

  prompt += `FORMAT TAG (taruh di paling akhir pesan, HANYA jika relevan):
- QUEST_OFFERED
- QUEST_ACCEPTED
- QUEST_REJECTED
- QUEST_COMPLETED`;

  return prompt;
}

// ─── POST Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages, currentQuest, selectedBossId } = await request.json();

    // Determine boss (locked per conversation)
    let selectedBoss = null;

    if (currentQuest) {
      selectedBoss = bosses.find(b => b.id === currentQuest.bossId) || null;
    } else if (selectedBossId) {
      selectedBoss = bosses.find(b => b.id === selectedBossId) || getRandomBoss();
    } else {
      selectedBoss = getRandomBoss();
    }

    // Get latest user message for context analysis
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const userText = lastUserMsg?.content || "";
    const questStatus = currentQuest?.status || null;

    // Detect context
    const context = detectContext(userText, questStatus, messages.length);

    // Build system prompt with detected context
    let systemMessage = buildSystemPrompt(context.prompt, context.id);

    // Inject boss info for quest-related contexts
    const questContexts = ["boss_quest", "quest_response", "quest_complete", "general", "greeting"];
    if (selectedBoss) {
      if (currentQuest) {
        systemMessage += `\n\nQuest aktif — Boss target: ${currentQuest.bossName} (ID: ${currentQuest.bossId}), Status: ${currentQuest.status}`;
        systemMessage += `\nHANYA bicarakan boss ini saat membahas quest, jangan sebut boss lain.`;
      } else if (questContexts.includes(context.id)) {
        systemMessage += `\n\nBoss yang disiapkan untuk quest: ${selectedBoss.name} (ID: ${selectedBoss.id})\nDeskripsi: ${selectedBoss.description}\nBounty: ${selectedBoss.bounty}`;
        systemMessage += `\nHANYA bicarakan boss ini saat membahas quest, jangan sebut boss lain.`;
        systemMessage += `\nJANGAN tawarkan quest jika user belum memperkenalkan diri.`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
      temperature: 0.85,
      max_tokens: 300,
    });

    const raw = completion.choices[0].message.content || "";

    // Parse tags
    let quest: any = null;
    let questOffered = false;
    let questAccepted = false;
    let questRejected = false;
    let questCompleted = false;

    if (raw.includes("QUEST_OFFERED")) {
      const boss = selectedBoss;
      if (boss) {
        questOffered = true;
        quest = { bossId: boss.id, bossName: boss.name, bounty: boss.bounty, description: boss.description, status: "offered" };
      }
    }

    if (raw.includes("QUEST_ACCEPTED")) {
      const boss = currentQuest
        ? bosses.find(b => b.id === currentQuest.bossId)
        : selectedBoss;
      if (boss) {
        questAccepted = true;
        quest = { bossId: boss.id, bossName: boss.name, bounty: boss.bounty, description: boss.description, status: "accepted" };
      }
    }

    if (raw.includes("QUEST_REJECTED")) questRejected = true;
    if (raw.includes("QUEST_COMPLETED")) questCompleted = true;

    // Clean tags from message
    const message = raw
      .replace(/\[?QUEST_OFFERED:?\s*\[?[\w-]*\]?\]?/g, "")
      .replace(/\[?QUEST_ACCEPTED:?\s*\[?[\w-]*\]?\]?/g, "")
      .replace(/\[?QUEST_REJECTED\]?/g, "")
      .replace(/\[?QUEST_COMPLETED\]?/g, "")
      .replace(/\[\s*\]/g, "")
      .trim();

    return NextResponse.json({
      message,
      quest,
      questOffered,
      questAccepted,
      questRejected,
      questCompleted,
      selectedBossId: selectedBoss?.id || currentQuest?.bossId || null,
      detectedContext: context.id,
    });
  } catch (error) {
    console.error("Firekeeper chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
