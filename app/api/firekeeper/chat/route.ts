/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { bosses } from "@/app/data/bosses";
import {
  getKnowledge,
  classifyContext,
  retrieveLore,
  type RetrievedContext,
  type Topic,
} from "@/lib/knowledge";
import {
  getUserMemory,
  upsertUserMemory,
  findMentionedUser,
  capSummary,
  type UserMemory,
} from "@/lib/memory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getRandomBoss() {
  return bosses[Math.floor(Math.random() * bosses.length)];
}

// ─── Build System Prompt (RAG-enhanced) ─────────────────────────────

function buildSystemPrompt(opts: {
  retrieved: RetrievedContext;
  userMemory: UserMemory | null;
  mentionedUser: UserMemory | null;
  boss: (typeof bosses)[number] | null;
  currentQuest: any;
}): string {
  const { retrieved, userMemory, mentionedUser, boss, currentQuest } = opts;
  const knowledge = getKnowledge();
  const { topic, currentDepth, previousLore, currentLore } = retrieved;

  // ── Base personality + rules
  let prompt = `${knowledge.base.personality}\n\nATURAN:\n`;
  prompt += knowledge.base.rules.map((r) => `- ${r}`).join("\n");
  prompt += "\n\n";

  // ── Inject user memory (so AI "remembers" the speaker)
  if (userMemory) {
    prompt += `INGATAN TENTANG PENGEMBARA INI (${userMemory.name}):\n`;
    if (userMemory.summary) {
      prompt += `${userMemory.summary}\n`;
    }
    if (userMemory.questCompletedCount > 0) {
      prompt += `Telah menyelesaikan ${userMemory.questCompletedCount} quest.`;
      if (userMemory.lastDefeatedBoss) {
        prompt += ` Terakhir mengalahkan: ${userMemory.lastDefeatedBoss}.`;
      }
      prompt += `\n`;
    }
    if (userMemory.trait) {
      prompt += `Karakter pengembara ini: ${userMemory.trait}. Sesuaikan nada bicaramu dengan kepribadian mereka.\n`;
    }
    // Visit intensity
    const v = userMemory.visitCount;
    const visitLabel = v <= 1 ? "baru pertama kali" : v <= 3 ? "beberapa kali" : v <= 10 ? "cukup sering" : "sangat sering";
    prompt += `Pengembara ini ${visitLabel} mengunjungimu (${v} kunjungan). Sesuaikan keakrabanmu.\n`;
    prompt += `\n`;
  }

  // ── Inject mentioned user memory (cross-user knowledge)
  if (mentionedUser) {
    prompt += `INGATAN TENTANG PENGEMBARA BERNAMA "${mentionedUser.name}":\n`;
    if (mentionedUser.summary) {
      prompt += `${mentionedUser.summary}\n`;
    }
    if (mentionedUser.questCompletedCount > 0) {
      prompt += `Telah menyelesaikan ${mentionedUser.questCompletedCount} quest.`;
      if (mentionedUser.lastDefeatedBoss) {
        prompt += ` Terakhir mengalahkan: ${mentionedUser.lastDefeatedBoss}.`;
      }
      prompt += `\n`;
    }
    if (mentionedUser.trait) {
      prompt += `Karakter: ${mentionedUser.trait}.\n`;
    }
    prompt += `Ceritakan tentang pengembara ini berdasarkan ingatanmu. Jangan mengarang hal yang tidak ada.\n\n`;
  }

  // ── Topic instruction
  prompt += `KONTEKS PERCAKAPAN: ${topic.label}\n`;
  prompt += `${topic.instruction}\n\n`;

  // ── Depth-aware lore injection
  if (previousLore.length > 0) {
    prompt += `LORE YANG SUDAH DICERITAKAN SEBELUMNYA (untuk konteks saja, JANGAN ulangi):\n`;
    previousLore.forEach((l) => {
      prompt += `- [Depth ${l.depth}] ${l.text}\n`;
    });
    prompt += "\n";
  }

  if (currentLore.length > 0) {
    prompt += `LORE YANG BOLEH DICERITAKAN SEKARANG (variasikan dengan gayamu, jangan copy persis):\n`;
    currentLore.forEach((l) => {
      prompt += `- [Depth ${l.depth}] ${l.hint}: "${l.text}"\n`;
    });
    prompt += `\nJANGAN ceritakan lore di atas depth ${currentDepth}. Buat user penasaran.\n\n`;
  }

  // ── Boss info
  if (boss && currentQuest) {
    prompt += `Quest aktif — Boss: ${currentQuest.bossName}, Status: ${currentQuest.status}\n`;
    prompt += `HANYA bicarakan boss ini saat membahas quest.\n\n`;
  } else if (
    boss &&
    ["boss_quest", "greeting", "general"].includes(topic.id)
  ) {
    prompt += `Boss yang disiapkan: ${boss.name} — ${boss.description}\nBounty: ${boss.bounty}\n`;
    prompt += `HANYA bicarakan boss ini saat membahas quest. JANGAN tawarkan quest jika user belum memperkenalkan diri.\n\n`;
  }

  // ── Emotional awareness
  prompt += `EMPATI & KEPEKAAN:
- Perhatikan kondisi emosional pengembara dari cara bicaranya.
- Jika pengembara terdengar sedih, hibur dengan kalimat lembut dan penuh pengertian.
- Jika pengembara ragu-ragu, beri dorongan halus tanpa memaksa.
- Jika pengembara marah atau frustrasi, tanggapi dengan tenang dan bijaksana.
- Jika pengembara ceria, balas dengan hangat.
- JANGAN akhiri percakapan secara tiba-tiba. Percakapan HANYA berakhir jika pengembara secara jelas ingin pergi (contoh: "aku pergi dulu", "sampai jumpa", "selamat tinggal").
- Setelah quest selesai atau ditolak, TETAP bisa diajak bicara — jangan langsung tutup dialog.\n\n`;

  // ── Quest tags format
  prompt += `FORMAT TAG (taruh di paling akhir, HANYA jika relevan):\n`;
  prompt += `- QUEST_OFFERED\n- QUEST_ACCEPTED\n- QUEST_REJECTED\n- QUEST_COMPLETED\n`;
  prompt += `- FAREWELL (HANYA jika pengembara secara eksplisit pamit/ingin pergi)\n\n`;

  // ── Memory update instruction (parsed server-side, hidden from user)
  prompt += `PENTING — WAJIB tambahkan blok berikut di akhir SETIAP respons (tidak ditampilkan ke user):
|||MEMORY|||{"summary":"ringkasan 1 kalimat singkat tentang interaksi ini dalam bahasa Indonesia","detected_name":"nama pengembara jika terdeteksi dalam pesan user, atau null","trait":"sifat/karakter pengembara yang terdeteksi dari cara bicaranya (pilih 1-2 kata: ceria, kasar, lucu, tegas, serius, pendiam, ramah, pemarah, bijak, penakut, pemberani, dll) atau null jika belum terdeteksi"}|||END_MEMORY|||
Contoh: |||MEMORY|||{"summary":"Frentzie bertanya tentang guild dengan antusias.","detected_name":"Frentzie","trait":"ceria"}|||END_MEMORY|||
SELALU sertakan blok ini.`;

  return prompt;
}

// ─── Parse LLM Response ─────────────────────────────────────────────

interface MemoryUpdate {
  summary: string;
  detected_name: string | null;
  trait: string | null;
}

function parseResponse(raw: string) {
  // 1. Extract |||MEMORY||| block
  let memoryUpdate: MemoryUpdate | null = null;
  const memMatch = raw.match(
    /\|\|\|MEMORY\|\|\|([\s\S]*?)\|\|\|END_MEMORY\|\|\|/
  );
  if (memMatch) {
    try {
      memoryUpdate = JSON.parse(memMatch[1].trim());
    } catch {
      memoryUpdate = { summary: "Percakapan berlangsung.", detected_name: null, trait: null };
    }
  }

  // 2. Strip memory block from visible message
  let cleaned = raw.replace(
    /\|\|\|MEMORY\|\|\|[\s\S]*?\|\|\|END_MEMORY\|\|\|/g,
    ""
  );

  // 3. Detect quest tags + farewell
  const questOffered = cleaned.includes("QUEST_OFFERED");
  const questAccepted = cleaned.includes("QUEST_ACCEPTED");
  const questRejected = cleaned.includes("QUEST_REJECTED");
  const questCompleted = cleaned.includes("QUEST_COMPLETED");
  const farewell = cleaned.includes("FAREWELL");

  // 4. Clean tags from visible message
  cleaned = cleaned
    .replace(/\[?QUEST_OFFERED:?\s*\[?[\w-]*\]?\]?/g, "")
    .replace(/\[?QUEST_ACCEPTED:?\s*\[?[\w-]*\]?\]?/g, "")
    .replace(/\[?QUEST_REJECTED\]?/g, "")
    .replace(/\[?QUEST_COMPLETED\]?/g, "")
    .replace(/\[?FAREWELL\]?/g, "")
    .replace(/\[\s*\]/g, "")
    .trim();

  return {
    message: cleaned,
    memoryUpdate,
    questOffered,
    questAccepted,
    questRejected,
    questCompleted,
    farewell,
  };
}

// ─── POST Handler (RAG Pipeline) ────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages, currentQuest, selectedBossId, playerName } =
      await request.json();

    // ── 1. Determine boss (locked per conversation)
    let selectedBoss: (typeof bosses)[number] | null = null;
    if (currentQuest) {
      selectedBoss =
        bosses.find((b) => b.id === currentQuest.bossId) || null;
    } else if (selectedBossId) {
      selectedBoss =
        bosses.find((b) => b.id === selectedBossId) || getRandomBoss();
    } else {
      selectedBoss = getRandomBoss();
    }

    // ── 2. Load user memory (if we know the speaker)
    const isKnown =
      playerName && playerName !== "Pengembara" && playerName.trim() !== "";
    const userMemory: UserMemory | null = isKnown
      ? await getUserMemory(playerName)
      : null;

    // ── 3. Get latest user message + quest status
    const lastUserMsg = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");
    const userText: string = lastUserMsg?.content || "";
    const questStatus: string | null = currentQuest?.status || null;

    // ── 4. CLASSIFY — which topic does this message belong to?
    const { topic } = classifyContext(userText, questStatus, messages.length);

    // ── 5. RETRIEVE — get lore at the right depth
    const retrieved: RetrievedContext = retrieveLore(topic, userMemory);

    // ── 6. Check for cross-user mention ("kau kenal Frentzie?")
    const mentionedUser = await findMentionedUser(userText, playerName);

    // ── 7. Build enhanced system prompt
    const systemPrompt = buildSystemPrompt({
      retrieved,
      userMemory,
      mentionedUser,
      boss: selectedBoss,
      currentQuest,
    });

    // ── 8. Call LLM
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.85,
      max_tokens: 400,
    });

    const raw = completion.choices[0].message.content || "";

    // ── 9. Parse response (extract memory block + quest tags)
    const {
      message,
      memoryUpdate,
      questOffered,
      questAccepted,
      questRejected,
      questCompleted,
      farewell,
    } = parseResponse(raw);

    // ── 10. Determine effective user name (LLM may detect from message)
    let effectiveName = isKnown ? playerName : null;
    if (memoryUpdate?.detected_name) {
      effectiveName = memoryUpdate.detected_name;
    }

    const shouldSave =
      effectiveName &&
      effectiveName !== "Pengembara" &&
      effectiveName.trim() !== "";

    // ── 11. UPDATE MEMORY — persist user knowledge
    if (shouldSave) {
      const existing = (await getUserMemory(effectiveName!)) ?? {
        name: effectiveName!,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        depths: {},
        lastDefeatedBoss: null,
        questCompletedCount: 0,
        trait: null,
        visitCount: 0,
        summary: "",
        recentContext: "",
      };

      // Depth increment for lore-bearing topics
      const depths = { ...existing.depths };
      if (topic.lore.length > 0) {
        const maxDepth = Math.max(...topic.lore.map((l) => l.depth));
        const cur = depths[topic.id] ?? 0;
        depths[topic.id] = Math.min(cur + 1, maxDepth);
      }

      // Quest tracking — only store last boss + increment counter
      let lastDefeatedBoss = existing.lastDefeatedBoss;
      let questCompletedCount = existing.questCompletedCount;
      if (questCompleted && currentQuest) {
        lastDefeatedBoss = currentQuest.bossName;
        questCompletedCount += 1;
      }

      // Trait — update if AI detected a new one (latest wins)
      const trait = memoryUpdate?.trait ?? existing.trait;

      // Visit count — increment only on first message of a session
      const visitCount =
        messages.length <= 1
          ? existing.visitCount + 1
          : existing.visitCount;

      // Append summary (capped — trims oldest sentences to stay under token limit)
      const summary = capSummary(
        existing.summary,
        memoryUpdate?.summary ?? ""
      );

      // Single save (async to npoint)
      await upsertUserMemory(effectiveName!, {
        depths,
        lastDefeatedBoss,
        questCompletedCount,
        trait,
        visitCount,
        summary,
        recentContext: topic.id,
      });
    }

    // ── 12. Build quest object for frontend
    let quest: any = null;
    if (questOffered && selectedBoss) {
      quest = {
        bossId: selectedBoss.id,
        bossName: selectedBoss.name,
        bounty: selectedBoss.bounty,
        description: selectedBoss.description,
        status: "offered",
      };
    } else if (questAccepted) {
      const boss = currentQuest
        ? bosses.find((b) => b.id === currentQuest.bossId)
        : selectedBoss;
      if (boss) {
        quest = {
          bossId: boss.id,
          bossName: boss.name,
          bounty: boss.bounty,
          description: boss.description,
          status: "accepted",
        };
      }
    }

    // ── 13. Return response
    return NextResponse.json({
      message,
      quest,
      questOffered,
      questAccepted,
      questRejected,
      questCompleted,
      farewell,
      selectedBossId: selectedBoss?.id || currentQuest?.bossId || null,
      detectedContext: topic.id,
      detectedName: memoryUpdate?.detected_name || null,
    });
  } catch (error) {
    console.error("Firekeeper chat error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
