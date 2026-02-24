import { CombatPhase } from "../data/combatRules";

export interface CombatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isQuickResponse?: boolean; // True jika dari pattern matching (bukan AI)
}

// ─── COMBAT PROFILE ───────────────────────────────────────────
// Profil pemain yang disimpan selama sesi combat.
// AI akan tanya ini kalau belum diisi.

export interface CombatProfile {
  currentBoss: string | null;     // ID boss yang dilawan
  currentBossName: string | null; // Nama boss (display)
  weapon: string | null;          // Jenis senjata
  skills: string[];               // Skill yang dipunyai
  notes: string;                  // Catatan tambahan dari user
}

// ─── MAIN STATE ───────────────────────────────────────────────

export interface CombatAssistantState {
  // Pipeline status
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isEnabled: boolean;
  transcript: string;
  lastResponse: string;

  // Combat state
  phase: CombatPhase;
  profile: CombatProfile;

  // Chat
  messages: CombatMessage[];
  error: string | null;
}

export type CombatAssistantAction =
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "START_PROCESSING" }
  | { type: "SET_RESPONSE"; payload: string }
  | { type: "START_SPEAKING" }
  | { type: "STOP_SPEAKING" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "TOGGLE_ENABLED" }
  | { type: "SET_PHASE"; payload: CombatPhase }
  | { type: "SET_BOSS"; payload: { id: string; name: string } }
  | { type: "SET_WEAPON"; payload: string }
  | { type: "ADD_SKILL"; payload: string }
  | { type: "SET_NOTES"; payload: string }
  | { type: "RESET_PROFILE" }
  | { type: "RESET" };
