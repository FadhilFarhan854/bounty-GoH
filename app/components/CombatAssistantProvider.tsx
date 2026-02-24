"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { CombatAssistantState, CombatMessage, CombatProfile } from "../types/combat";
import {
  CombatPhase,
  matchQuickPattern,
  detectBossFromText,
  detectWeaponFromText,
  PRE_BATTLE_CHECKLIST,
  IDENTIFICATION_PROMPTS,
} from "../data/combatRules";
import { bosses } from "../data/bosses";

// ─── Initial State ────────────────────────────────────────────
const initialProfile: CombatProfile = {
  currentBoss: null,
  currentBossName: null,
  weapon: null,
  skills: [],
  notes: "",
};

const initialState: CombatAssistantState = {
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  isEnabled: false,
  transcript: "",
  lastResponse: "",
  phase: "idle",
  profile: initialProfile,
  messages: [],
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────
type Action =
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
  | { type: "ADD_USER_MESSAGE"; payload: string }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: { content: string; isQuickResponse?: boolean } }
  | { type: "ADD_SYSTEM_MESSAGE"; payload: string }
  | { type: "RESET" };

function reducer(state: CombatAssistantState, action: Action): CombatAssistantState {
  switch (action.type) {
    case "START_LISTENING":
      return { ...state, isListening: true, error: null };
    case "STOP_LISTENING":
      return { ...state, isListening: false };
    case "SET_TRANSCRIPT":
      return { ...state, transcript: action.payload };
    case "START_PROCESSING":
      return { ...state, isProcessing: true, error: null };
    case "SET_RESPONSE":
      return { ...state, isProcessing: false, lastResponse: action.payload };
    case "START_SPEAKING":
      return { ...state, isSpeaking: true };
    case "STOP_SPEAKING":
      return { ...state, isSpeaking: false };
    case "SET_ERROR":
      return { ...state, isProcessing: false, isSpeaking: false, error: action.payload };
    case "TOGGLE_ENABLED":
      return { ...state, isEnabled: !state.isEnabled };
    case "SET_PHASE":
      return { ...state, phase: action.payload };
    case "SET_BOSS":
      return {
        ...state,
        profile: {
          ...state.profile,
          currentBoss: action.payload.id,
          currentBossName: action.payload.name,
        },
      };
    case "SET_WEAPON":
      return { ...state, profile: { ...state.profile, weapon: action.payload } };
    case "ADD_SKILL":
      return {
        ...state,
        profile: { ...state.profile, skills: [...state.profile.skills, action.payload] },
      };
    case "SET_NOTES":
      return { ...state, profile: { ...state.profile, notes: action.payload } };
    case "RESET_PROFILE":
      return { ...state, profile: initialProfile, phase: "idle" };
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "user", content: action.payload, timestamp: Date.now() },
        ],
      };
    case "ADD_ASSISTANT_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            role: "assistant",
            content: action.payload.content,
            timestamp: Date.now(),
            isQuickResponse: action.payload.isQuickResponse,
          },
        ],
      };
    case "ADD_SYSTEM_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          { role: "system", content: action.payload, timestamp: Date.now() },
        ],
      };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────
interface CombatContextType {
  state: CombatAssistantState;
  toggleAssistant: () => void;
  startBattle: () => void;
  resetProfile: () => void;
}

const CombatContext = createContext<CombatContextType>({
  state: initialState,
  toggleAssistant: () => {},
  startBattle: () => {},
  resetProfile: () => {},
});

export const useCombatAssistant = () => useContext(CombatContext);

// ─── Provider ─────────────────────────────────────────────────
export function CombatAssistantProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isEnabledRef = useRef(false);
  const phaseRef = useRef<CombatPhase>("idle");
  const profileRef = useRef<CombatProfile>(initialProfile);

  // Keep refs in sync
  useEffect(() => {
    isEnabledRef.current = state.isEnabled;
  }, [state.isEnabled]);
  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);
  useEffect(() => {
    profileRef.current = state.profile;
  }, [state.profile]);

  // ── Pipeline: Whisper STT ──
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    const res = await fetch("/api/combat/stt", { method: "POST", body: formData });
    if (!res.ok) throw new Error("STT failed");
    const data = await res.json();
    return data.text;
  }, []);

  // ── Pipeline: GPT Chat (with combat context) ──
  const getAIResponse = useCallback(
    async (text: string, history: CombatMessage[], profile: CombatProfile, phase: CombatPhase): Promise<string> => {
      try {
        const res = await fetch("/api/combat/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: history.slice(-4),
            profile,
            phase,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Chat API error:", errData);
          return "Maaf, ada gangguan. Coba ngomong lagi!";
        }
        const data = await res.json();
        return data.reply || "Coba ulangi ya!";
      } catch (err) {
        console.error("Chat fetch error:", err);
        return "Koneksi bermasalah. Coba lagi!";
      }
    },
    []
  );

  // ── Pipeline: OpenAI TTS ──
  const speakResponse = useCallback(async (text: string): Promise<void> => {
    dispatch({ type: "START_SPEAKING" });
    try {
      const res = await fetch("/api/combat/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.volume = 0.9;
        audio.onended = () => {
          dispatch({ type: "STOP_SPEAKING" });
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          dispatch({ type: "STOP_SPEAKING" });
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch(() => {
          dispatch({ type: "STOP_SPEAKING" });
          URL.revokeObjectURL(audioUrl);
          resolve();
        });
      });
    } catch {
      dispatch({ type: "STOP_SPEAKING" });
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  IDENTIFICATION PHASE — detect boss & weapon from speech
  // ═══════════════════════════════════════════════════════════
  const handleIdentification = useCallback(
    (transcript: string): { handled: boolean; response?: string } => {
      const profile = profileRef.current;

      // Try detecting boss name
      if (!profile.currentBoss) {
        const bossId = detectBossFromText(transcript);
        if (bossId) {
          const boss = bosses.find((b) => b.id === bossId);
          if (boss) {
            dispatch({ type: "SET_BOSS", payload: { id: boss.id, name: boss.name } });

            // If we also don't have weapon, ask for it
            if (!profile.weapon) {
              return {
                handled: true,
                response: `Oke, lawan ${boss.name} ya! ${boss.description} — ${IDENTIFICATION_PROMPTS.askWeapon}`,
              };
            }

            // Boss found + weapon already known → move to pre-battle
            dispatch({ type: "SET_PHASE", payload: "pre-battle" });
            const checklist = PRE_BATTLE_CHECKLIST.join("\n");
            return {
              handled: true,
              response: `Siap lawan ${boss.name}! Sebelum mulai, cek dulu:\n${checklist}`,
            };
          }
        }
      }

      // Try detecting weapon
      if (!profile.weapon) {
        const weapon = detectWeaponFromText(transcript);
        if (weapon) {
          dispatch({ type: "SET_WEAPON", payload: weapon });

          if (!profile.currentBoss) {
            return {
              handled: true,
              response: `Oke, pakai ${weapon} ya! Sekarang, mau lawan boss apa? Sebutin nama boss-nya!`,
            };
          }

          // Weapon found + boss already known → move to pre-battle
          dispatch({ type: "SET_PHASE", payload: "pre-battle" });
          const checklist = PRE_BATTLE_CHECKLIST.join("\n");
          return {
            handled: true,
            response: `Pakai ${weapon} lawan ${profile.currentBossName}! Sebelum mulai:\n${checklist}`,
          };
        }
      }

      // Detect "mulai" / "siap" / "start" / "gas" to enter battle
      const lower = transcript.toLowerCase();
      if (
        (lower.includes("mulai") || lower.includes("siap") || lower.includes("start") || lower.includes("gas") || lower.includes("hajar")) &&
        profile.currentBoss
      ) {
        dispatch({ type: "SET_PHASE", payload: "in-battle" });
        return {
          handled: true,
          response: `Oke gas! Lawan ${profile.currentBossName} sekarang! Aku siap bantu kapan aja. Semangat!`,
        };
      }

      // Detect "selesai" / "done" / "menang" / "kalah" to end battle
      if (
        lower.includes("selesai") || lower.includes("done") || lower.includes("menang") || lower.includes("kalah") || lower.includes("udahan")
      ) {
        dispatch({ type: "SET_PHASE", payload: "post-battle" });
        return {
          handled: true,
          response: "Battle selesai! Mau lawan boss lain? Atau mau evaluasi tadi?",
        };
      }

      // Detect "ganti boss" / "boss lain"
      if (lower.includes("ganti boss") || lower.includes("boss lain") || lower.includes("ganti musuh")) {
        dispatch({ type: "RESET_PROFILE" });
        dispatch({ type: "SET_PHASE", payload: "identifying" });
        return {
          handled: true,
          response: "Oke ganti boss! Mau lawan siapa sekarang?",
        };
      }

      return { handled: false };
    },
    []
  );

  // ═══════════════════════════════════════════════════════════
  //  MAIN PIPELINE: STT → Identify/QuickMatch/AI → TTS
  // ═══════════════════════════════════════════════════════════
  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      dispatch({ type: "START_PROCESSING" });

      try {
        // 1. Speech to Text
        const transcript = await transcribeAudio(audioBlob);
        if (!transcript || transcript.trim().length < 2) {
          isProcessingRef.current = false;
          dispatch({ type: "SET_RESPONSE", payload: "" });
          return;
        }

        dispatch({ type: "SET_TRANSCRIPT", payload: transcript });
        dispatch({ type: "ADD_USER_MESSAGE", payload: transcript });

        let reply: string;
        let isQuickResponse = false;

        // 2A. IDENTIFICATION PHASE — check if we need boss/weapon info
        const phase = phaseRef.current;
        if (phase === "idle" || phase === "identifying" || phase === "pre-battle" || phase === "post-battle") {
          const idResult = handleIdentification(transcript);
          if (idResult.handled && idResult.response) {
            reply = idResult.response;
            isQuickResponse = true;
            dispatch({ type: "SET_RESPONSE", payload: reply });
            dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: { content: reply, isQuickResponse } });
            await speakResponse(reply);
            isProcessingRef.current = false;
            return;
          }

          // If in idle and nothing detected, prompt for boss
          if (phase === "idle") {
            dispatch({ type: "SET_PHASE", payload: "identifying" });
            reply = IDENTIFICATION_PROMPTS.askBoss;
            // Still let AI process the message in case it's a general question
            // but also send identification context
          }
        }

        // 2B. QUICK PATTERN MATCH — instant response for combat situations
        if (phase === "in-battle") {
          const quickMatch = matchQuickPattern(transcript);
          if (quickMatch) {
            reply = quickMatch.response;
            isQuickResponse = true;
            dispatch({ type: "SET_RESPONSE", payload: reply });
            dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: { content: reply, isQuickResponse } });
            await speakResponse(reply);
            isProcessingRef.current = false;
            return;
          }
        }

        // 2C. FULL AI RESPONSE — no quick match found, kirim ke AI
        reply = await getAIResponse(
          transcript,
          state.messages,
          profileRef.current,
          phaseRef.current
        );

        if (reply) {
          dispatch({ type: "SET_RESPONSE", payload: reply });
          dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: { content: reply, isQuickResponse: false } });

          // 3. Text to Speech
          await speakResponse(reply);
        }
      } catch (error) {
        console.error("Combat pipeline error:", error);
        dispatch({ type: "SET_ERROR", payload: "Ada error, coba lagi ya..." });
      } finally {
        isProcessingRef.current = false;
      }
    },
    [transcribeAudio, getAIResponse, speakResponse, handleIdentification, state.messages]
  );

  // ── Always-Listening with VAD ──
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let isRecording = false;
      let mediaRecorder: MediaRecorder | null = null;
      const SILENCE_THRESHOLD = 25;
      const SILENCE_DURATION = 1500;
      const MIN_RECORDING_DURATION = 500;
      let recordingStartTime = 0;

      const checkAudioLevel = () => {
        if (!isEnabledRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (average > SILENCE_THRESHOLD && !isRecording && !isProcessingRef.current) {
          isRecording = true;
          recordingStartTime = Date.now();
          audioChunksRef.current = [];
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
              ? "audio/webm;codecs=opus"
              : "audio/webm",
          });
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorder.onstop = () => {
            const duration = Date.now() - recordingStartTime;
            if (audioChunksRef.current.length > 0 && duration >= MIN_RECORDING_DURATION) {
              const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
              processAudio(blob);
            }
          };
          mediaRecorder.start(100);
          mediaRecorderRef.current = mediaRecorder;
          dispatch({ type: "START_LISTENING" });
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        } else if (average > SILENCE_THRESHOLD && isRecording) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (average <= SILENCE_THRESHOLD && isRecording) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                isRecording = false;
                dispatch({ type: "STOP_LISTENING" });
                silenceTimerRef.current = null;
              }
            }, SILENCE_DURATION);
          }
        }
        requestAnimationFrame(checkAudioLevel);
      };

      requestAnimationFrame(checkAudioLevel);
      dispatch({ type: "START_LISTENING" });
    } catch (error) {
      console.error("Microphone access error:", error);
      dispatch({ type: "SET_ERROR", payload: "Gak bisa akses mikrofon. Cek izin browser dulu ya!" });
    }
  }, [processAudio]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    dispatch({ type: "STOP_LISTENING" });
    dispatch({ type: "STOP_SPEAKING" });
  }, []);

  // ── Toggle assistant ──
  const toggleAssistant = useCallback(() => {
    dispatch({ type: "TOGGLE_ENABLED" });
    if (!state.isEnabled) {
      dispatch({ type: "SET_PHASE", payload: "identifying" });
      dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: "🟢 Asisten Tempur aktif! Sebutin boss yang mau dilawan dan senjata yang kamu pakai." });
      startListening();
    } else {
      stopListening();
      dispatch({ type: "SET_PHASE", payload: "idle" });
    }
  }, [state.isEnabled, startListening, stopListening]);

  // ── Manual start battle ──
  const startBattle = useCallback(() => {
    dispatch({ type: "SET_PHASE", payload: "in-battle" });
    dispatch({
      type: "ADD_SYSTEM_MESSAGE",
      payload: `⚔️ Battle dimulai lawan ${profileRef.current.currentBossName || "boss"}! Mode quick-response aktif!`,
    });
  }, []);

  // ── Reset profile ──
  const resetProfile = useCallback(() => {
    dispatch({ type: "RESET_PROFILE" });
    dispatch({ type: "SET_PHASE", payload: "identifying" });
    dispatch({ type: "ADD_SYSTEM_MESSAGE", payload: "🔄 Profil di-reset. Mau lawan boss apa sekarang?" });
  }, []);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <CombatContext.Provider value={{ state, toggleAssistant, startBattle, resetProfile }}>
      {children}
    </CombatContext.Provider>
  );
}
