// ════════════════════════════════════════════════════════════════
//  COMBAT RULES & QUICK RESPONSE ENGINE
//  File ini adalah PUSAT ATURAN untuk Combat Assistant.
//  Edit file ini untuk menambah/modifikasi behavior AI.
// ════════════════════════════════════════════════════════════════

// ─── QUICK RESPONSE PATTERNS ──────────────────────────────────
// Pattern matching untuk respon INSTAN tanpa perlu panggil AI.
// Ini bikin respon super cepat (< 100ms) untuk situasi umum.
//
// Cara kerja:
//   1. User bicara → STT convert ke text
//   2. Text di-match dengan patterns di bawah
//   3. Kalau match → langsung jawab (skip AI) → TTS
//   4. Kalau gak match → kirim ke AI seperti biasa
//
// FORMAT:
//   keywords: kata kunci yang harus ADA dalam kalimat user (lowercase)
//   excludeKeywords: kata yang kalau ADA, pattern ini di-skip (optional)
//   response: jawaban instan dalam Bahasa Indonesia
//   priority: makin tinggi = makin diprioritaskan kalau multiple match (1-10)

export interface QuickPattern {
  id: string;
  keywords: string[];
  excludeKeywords?: string[];
  response: string;
  priority: number;
}

export const QUICK_PATTERNS: QuickPattern[] = [
  // ══════════════════════════════════════
  //  AoE & AREA ATTACK SITUATIONS
  // ══════════════════════════════════════
  {
    id: "aoe-besar",
    keywords: ["aoe", "besar"],
    response: "Pakai skill immune sekarang! Atau dodge ke belakang boss buat keluar dari area!",
    priority: 9,
  },
  {
    id: "aoe-dodge",
    keywords: ["aoe", "dodge"],
    response: "Timing dodge-nya pas animasi boss mulai! Kalau gak bisa, pakai iframe skill aja!",
    priority: 8,
  },
  {
    id: "aoe-general",
    keywords: ["aoe"],
    response: "Jaga jarak dari pusat AoE! Pakai skill iframe atau dodge ke sisi boss!",
    priority: 5,
  },
  {
    id: "serangan-area",
    keywords: ["serangan", "area"],
    response: "Serangan area itu counter-nya iframe atau reposisi! Gerak ke belakang boss!",
    priority: 7,
  },

  // ══════════════════════════════════════
  //  DAMAGE ISSUES
  // ══════════════════════════════════════
  {
    id: "damage-berkurang",
    keywords: ["damage", "berkurang"],
    response: "Cek prorate dan buff kamu! Pastikan buff attack masih aktif dan skill belum prorate!",
    priority: 9,
  },
  {
    id: "damage-kecil",
    keywords: ["damage", "kecil"],
    response: "Prorate kali! Ganti rotasi skill, pakai yang belum prorate. Cek buff juga!",
    priority: 9,
  },
  {
    id: "damage-turun",
    keywords: ["damage", "turun"],
    response: "Kemungkinan prorate. Ganti skill ke rotasi kedua! Jangan lupa refresh buff!",
    priority: 9,
  },
  {
    id: "damage-rendah",
    keywords: ["damage", "rendah"],
    response: "Cek equipment dan buff! Kalau prorate, ganti rotasi skill. Pastikan debuff boss aktif!",
    priority: 8,
  },
  {
    id: "gak-ngefek",
    keywords: ["gak", "ngefek"],
    response: "Boss mungkin lagi fase immune atau resist. Tunggu fase-nya berubah, atau cek elemen serangan kamu!",
    priority: 8,
  },

  // ══════════════════════════════════════
  //  HP & SURVIVAL
  // ══════════════════════════════════════
  {
    id: "hp-dikit",
    keywords: ["hp", "dikit"],
    response: "Mundur sekarang! Pakai potion atau skill heal! Jangan greedy, survive dulu!",
    priority: 10,
  },
  {
    id: "hp-tipis",
    keywords: ["hp", "tipis"],
    response: "Jangan nekat! Heal dulu atau pakai consumable! Mending hidup daripada mati!",
    priority: 10,
  },
  {
    id: "mau-mati",
    keywords: ["mau", "mati"],
    response: "Pakai skill immune atau dodge jauh sekarang! Heal segera, jangan serang dulu!",
    priority: 10,
  },
  {
    id: "sekarat",
    keywords: ["sekarat"],
    response: "Mundur dan heal! Pakai consumable HP sekarang! Safety first!",
    priority: 10,
  },
  {
    id: "mati-terus",
    keywords: ["mati", "terus"],
    response: "Kayaknya equipment kurang kuat atau timing dodge belum pas. Coba upgrade armor atau tambah HP consumable!",
    priority: 8,
  },

  // ══════════════════════════════════════
  //  BOSS MECHANICS
  // ══════════════════════════════════════
  {
    id: "boss-shield",
    keywords: ["shield"],
    response: "Boss lagi fase shield! Fokus hancurin weak point atau crystal-nya dulu baru DPS!",
    priority: 9,
  },
  {
    id: "boss-hp-gak-berkurang",
    keywords: ["hp", "gak", "berkurang"],
    response: "Boss mungkin lagi fase immune atau shield! Cari weak point-nya, jangan asal serang!",
    priority: 9,
  },
  {
    id: "boss-rage",
    keywords: ["rage"],
    response: "Boss lagi rage mode! Fokus dodge dan survive, jangan greedy DPS! Tunggu rage habis!",
    priority: 9,
  },
  {
    id: "boss-enrage",
    keywords: ["enrage"],
    response: "Enrage timer! Burst DPS sekarang semaksimal mungkin! All-out attack!",
    priority: 10,
  },

  // ══════════════════════════════════════
  //  BUFF / DEBUFF
  // ══════════════════════════════════════
  {
    id: "buff-habis",
    keywords: ["buff", "habis"],
    response: "Refresh buff sekarang! Jangan serang tanpa buff, damage bakal drop parah!",
    priority: 8,
  },
  {
    id: "debuff-kena",
    keywords: ["debuff"],
    response: "Kena debuff! Pakai cleanse atau consumable anti-debuff kalau punya!",
    priority: 8,
  },
  {
    id: "slow-kena",
    keywords: ["slow"],
    excludeKeywords: ["boss"],
    response: "Kena slow! Pakai cleanse skill atau tunggu durasi habis, jangan maksa dodge!",
    priority: 7,
  },
  {
    id: "stun-kena",
    keywords: ["stun"],
    response: "Watch out buat stun! Pakai skill anti-stun sebelum serangan boss yang ada stun-nya!",
    priority: 8,
  },

  // ══════════════════════════════════════
  //  PRORATE (GAME-SPECIFIC MECHANIC)
  // ══════════════════════════════════════
  {
    id: "prorate",
    keywords: ["prorate"],
    response: "Skill udah prorate! Ganti ke rotasi skill berikutnya, jangan spam skill yang sama!",
    priority: 9,
  },
  {
    id: "rotasi",
    keywords: ["rotasi"],
    response: "Waktunya rotasi! Ganti ke set skill kedua biar damage optimal dan hindari prorate!",
    priority: 7,
  },

  // ══════════════════════════════════════
  //  COMBO & SKILL USAGE
  // ══════════════════════════════════════
  {
    id: "combo-gagal",
    keywords: ["combo", "gagal"],
    response: "Tenang, reset combo dan mulai dari awal! Pastikan timing antar skill pas!",
    priority: 7,
  },
  {
    id: "skill-cooldown",
    keywords: ["cooldown"],
    response: "Skill lagi cooldown! Pakai basic attack atau skill cadangan sambil nunggu!",
    priority: 7,
  },
  {
    id: "mp-habis",
    keywords: ["mp", "habis"],
    response: "MP habis! Pakai MP consumable sekarang, atau switch ke basic attack dulu!",
    priority: 8,
  },
  {
    id: "sp-habis",
    keywords: ["sp", "habis"],
    response: "SP abis! Pakai SP consumable atau kurangi pemakaian skill berat!",
    priority: 8,
  },
];

// ─── IDENTIFICATION QUESTIONS ─────────────────────────────────
// Pertanyaan yang diajukan AI saat user belum setup profil combat.
// AI akan tanya ini sebelum mulai memberi saran.

export const IDENTIFICATION_PROMPTS = {
  askBoss: "Mau lawan boss apa nih? Sebutin nama boss-nya biar aku bisa kasih strategi yang tepat!",
  askWeapon: "Senjata apa yang kamu pakai? Misalnya sword, bow, staff, dll.",
  askSkills: "Skill apa aja yang kamu punya? Terutama yang punya iframe atau immune.",
  askReady: "Oke siap! Sebelum mulai, pastikan udah:",
};



export const PRE_BATTLE_CHECKLIST = [
  "✅ Setup combo skill — pastikan rotasi DPS sudah optimal",
  "✅ Pakai consumable — buff makanan, potion, dan scroll",
  "✅ Skill immune/iframe — taruh di slot yang gampang dijangkau",
  "✅ Cek equipment — pastikan gear sudah enhance maksimal",
  "✅ Stok potion — bawa HP & MP potion yang cukup",
  "✅ Party buff — koordinasi buff sama party member",
];

// ─── COMBAT PHASE DEFINITIONS ─────────────────────────────────
// Phase combat yang menentukan behavior AI.

export type CombatPhase =
  | "idle"          
  | "identifying"   
  | "pre-battle"    // Sudah identify, kasih checklist
  | "in-battle"     // Dalam pertarungan, mode quick response
  | "post-battle";  // Setelah battle selesai

// ─── MATCH ENGINE ─────────────────────────────────────────────
// Fungsi untuk matching text user dengan quick patterns.
// Dipanggil SEBELUM kirim ke AI untuk respons instan.

export function matchQuickPattern(text: string): QuickPattern | null {
  const lower = text.toLowerCase();

  const matches = QUICK_PATTERNS.filter((pattern) => {
    // Semua keywords harus ada
    const allKeywordsMatch = pattern.keywords.every((kw) => lower.includes(kw));
    if (!allKeywordsMatch) return false;

    // Exclude keywords check
    if (pattern.excludeKeywords) {
      const hasExcluded = pattern.excludeKeywords.some((kw) => lower.includes(kw));
      if (hasExcluded) return false;
    }

    return true;
  });

  if (matches.length === 0) return null;

  // Return highest priority match
  return matches.sort((a, b) => b.priority - a.priority)[0];
}

// ─── BOSS DETECTION ───────────────────────────────────────────
// Deteksi nama boss dari text user. Dipakai saat fase identifying.

import { bosses } from "./bosses";

export function detectBossFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const boss of bosses) {
    if (lower.includes(boss.name.toLowerCase())) {
      return boss.id;
    }
    if (lower.includes(boss.id.toLowerCase())) {
      return boss.id;
    }
  }
  return null;
}

// ─── WEAPON DETECTION ─────────────────────────────────────────
// Deteksi jenis senjata dari text user.

const KNOWN_WEAPONS = [
  "sword", "pedang",
  "bow", "busur", "panah",
  "staff", "tongkat",
  "knuckle", "tinju",
  "halberd", "tombak",
  "katana",
  "dual sword", "dual pedang",
  "magic device", "magic",
  "bowgun", "senapan",
  "shield", "perisai", "tank",
];

export function detectWeaponFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const weapon of KNOWN_WEAPONS) {
    if (lower.includes(weapon)) {
      return weapon;
    }
  }
  return null;
}
