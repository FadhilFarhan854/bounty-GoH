import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Prompt hint membantu Whisper mengenali kosa kata yang sering dipakai.
    // Tanpa ini, kata pendek seperti "tes" bisa salah dengar jadi "stasi".
    const prompt = [
      "tes, tes tes, halo, hai,",
      "AoE, iframe, dodge, DPS, buff, debuff, prorate, cooldown, burst, combo,",
      "damage, skill, heal, potion, HP, MP, SP, shield, stun, slow,",
      "boss, musuh, lawan, serang, mundur, maju, kiri, kanan,",
      "sword, bow, staff, katana, halberd, knuckle, dual sword, bowgun, magic device,",
      "mulai, siap, gas, hajar, selesai, menang, kalah,",
      "ganti boss, rotasi, equipment, senjata, armor,",
      "damagenya kecil, HP dikit, buff habis, mati terus, shield kebal, enrage, prorate, cooldown, stun",
    ].join(" ");

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "id",
      prompt,
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("STT Error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
