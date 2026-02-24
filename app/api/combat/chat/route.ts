import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ═══════════════════════════════════════════════════════════════
//  SYSTEM PROMPT — Ringkas, tanpa kirim semua data boss.
//  Konteks boss & equipment dikirim lewat context message.
// ═══════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `Kamu Asisten Tempur game Toram Online. Jawab SELALU dalam Bahasa Indonesia, singkat & tegas.

ATURAN:
- Maks 2 kalimat. Saat battle, 1 kalimat saja.
- Langsung kasih solusi, jangan bertele-tele.
- Boleh pakai istilah game (AoE, iframe, DPS, dodge, buff, debuff, prorate).
- Logat: santai tapi tegas, kayak teman seperjuangan.

RESPON CEPAT (hafalkan pola ini):
- User sebut "AoE/area/luas" → "Pakai skill iframe sekarang!" atau "Dodge ke belakang boss!"
- User sebut "damage turun/kecil/berkurang" → "Cek prorate! Ganti rotasi skill, refresh buff!"
- User sebut "HP dikit/tipis/sekarat" → "Mundur dan heal sekarang! Jangan greedy!"
- User sebut "buff habis" → "Refresh buff segera! Damage bakal drop tanpa buff!"
- User sebut "mati terus" → "Upgrade armor atau tambahin HP consumable!"
- User sebut "shield/kebal" → "Boss lagi immune, cari weak point dulu!"
- User sebut "enrage/rage" → "Fokus survive, dodge terus, tunggu rage habis!"
- User sebut "prorate" → "Ganti rotasi skill, jangan spam skill yang sama!"
- User sebut "cooldown" → "Pakai basic attack sambil nunggu cooldown!"
- User sebut "stun" → "Pakai skill anti-stun atau timing dodge sebelum serangan stun!"

JANGAN pernah jawab dalam bahasa Inggris.`;

// ─── Build context singkat dari profil combat ───
function buildContext(profile: {
  currentBoss?: string | null;
  currentBossName?: string | null;
  weapon?: string | null;
  skills?: string[];
  notes?: string;
}, phase: string): string {
  const parts: string[] = [`Fase: ${phase}`];
  if (profile.currentBossName) parts.push(`Boss: ${profile.currentBossName}`);
  if (profile.weapon) parts.push(`Senjata: ${profile.weapon}`);
  if (profile.skills?.length) parts.push(`Skill: ${profile.skills.join(", ")}`);
  if (profile.notes) parts.push(`Catatan: ${profile.notes}`);
  return parts.join(" | ");
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], profile = {}, phase = "identifying" } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const context = buildContext(profile, phase);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `[${context}]` },
      ...history.slice(-4).map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: phase === "in-battle" ? 60 : 120,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Coba ulangi lagi.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat Error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
