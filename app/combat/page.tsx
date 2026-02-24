"use client";

import { useRef, useEffect } from "react";
import { useCombatAssistant } from "../components/CombatAssistantProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Mic, MicOff, RotateCcw, Play, Loader2 } from "lucide-react";

export default function CombatPage() {
  const { state, toggleAssistant, startBattle, resetProfile } = useCombatAssistant();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isProcessing,
    isSpeaking,
    isEnabled,
    transcript,
    messages,
    error,
    phase,
    profile,
  } = state;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const getPhaseInfo = () => {
    switch (phase) {
      case "idle": return { label: "Menunggu", color: "text-gray-400", bg: "bg-gray-900/50" };
      case "identifying": return { label: "🔍 Identifikasi", color: "text-amber-400", bg: "bg-amber-900/20" };
      case "pre-battle": return { label: "📋 Persiapan", color: "text-yellow-400", bg: "bg-yellow-900/20" };
      case "in-battle": return { label: "⚔️ Dalam Pertarungan", color: "text-red-400", bg: "bg-red-900/20" };
      case "post-battle": return { label: "🏆 Selesai", color: "text-green-400", bg: "bg-green-900/20" };
      default: return { label: "—", color: "text-gray-400", bg: "bg-gray-900/50" };
    }
  };

  const getStatusInfo = () => {
    if (!isEnabled) return { color: "bg-gray-500", text: "Mati", ringColor: "ring-gray-500" };
    if (isSpeaking) return { color: "bg-blue-500", text: "Berbicara...", ringColor: "ring-blue-500" };
    if (isProcessing) return { color: "bg-yellow-500", text: "Mikir...", ringColor: "ring-yellow-500" };
    if (isListening) return { color: "bg-green-500", text: "Dengerin...", ringColor: "ring-green-500" };
    return { color: "bg-emerald-600", text: "Siap Tempur", ringColor: "ring-emerald-500" };
  };

  const status = getStatusInfo();
  const phaseInfo = getPhaseInfo();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(circle at center, hsl(38 45% 25%) 0%, hsl(30 25% 15%) 35%, hsl(25 20% 10%) 60%, hsl(20 15% 6%) 100%)"
      }} />
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_250px_rgba(0,0,0,0.9)]" />

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-screen">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Swords className="w-6 h-6 text-primary" />
            <h1 className="font-cinzel text-2xl md:text-3xl tracking-wider gold-shimmer">
              Spirit Companion
            </h1>
            <Swords className="w-6 h-6 text-primary" />
          </div>
          <p className="font-crimson text-muted-foreground text-sm italic">
            Voice-powered combat assistant — bicara dan dapatkan saran taktis instan
          </p>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border border-primary/20 p-4 mb-4 ${phaseInfo.bg}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: Status */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status.color} ${isEnabled ? "animate-pulse" : ""}`} />
              <span className="font-cinzel text-sm text-amber-200 tracking-wide">{status.text}</span>
              <span className="text-xs text-primary/30">|</span>
              <span className={`font-cinzel text-xs ${phaseInfo.color}`}>{phaseInfo.label}</span>
            </div>

            {/* Right: Profile info */}
            <div className="flex items-center gap-4 text-xs">
              {profile.currentBossName && (
                <span className="text-red-400 flex items-center gap-1">
                  👹 <span className="font-crimson">{profile.currentBossName}</span>
                </span>
              )}
              {profile.weapon && (
                <span className="text-blue-400 flex items-center gap-1">
                  🗡️ <span className="font-crimson">{profile.weapon}</span>
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 rounded-xl border border-primary/20 bg-stone-950/60 backdrop-blur-sm overflow-hidden flex flex-col"
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-[300px] max-h-[50vh]">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🛡️</div>
                  <p className="text-amber-400/50 font-crimson italic text-lg">
                    {isEnabled
                      ? "Lagi dengerin... Sebutin boss dan senjata kamu!"
                      : "Aktifkan asisten untuk mulai"}
                  </p>
                  <p className="text-amber-400/30 font-crimson text-sm mt-2">
                    Contoh: &quot;Mau lawan Merzehal pakai sword&quot;
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : msg.role === "system"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                {msg.role === "system" ? (
                  <div className="bg-amber-900/20 border border-amber-800/20 px-4 py-2 rounded-full">
                    <span className="text-xs text-amber-400/70 font-crimson">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl font-crimson text-sm ${
                      msg.role === "user"
                        ? "bg-amber-900/40 text-amber-200 rounded-br-sm"
                        : msg.isQuickResponse
                        ? "bg-emerald-900/40 text-emerald-100 rounded-bl-sm border border-emerald-700/30"
                        : "bg-stone-800/80 text-amber-100 rounded-bl-sm border border-amber-900/20"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] opacity-50 font-cinzel tracking-wider">
                        {msg.role === "user"
                          ? "🎤 KAMU"
                          : msg.isQuickResponse
                          ? "⚡ QUICK"
                          : "⚔️ ASISTEN"}
                      </span>
                    </div>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Processing dots */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-stone-800/80 border border-amber-900/20 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Transcript bar */}
          <AnimatePresence>
            {isListening && transcript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-amber-900/20 bg-stone-900/60 px-4 py-2"
              >
                <p className="text-sm text-amber-300/60 font-crimson italic truncate">
                  🎤 {transcript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error bar */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-red-900/30 bg-red-950/30 px-4 py-2"
              >
                <p className="text-sm text-red-400 font-crimson">⚠️ {error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 space-y-3"
        >
          {/* Main mic button */}
          <div className="flex items-center justify-center gap-4">
            {/* Reset button */}
            {isEnabled && profile.currentBoss && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={resetProfile}
                className="w-12 h-12 rounded-full bg-stone-800/80 border border-amber-900/30 flex items-center justify-center text-amber-400/60 hover:text-amber-400 hover:bg-stone-700/80 transition-all"
                title="Ganti Boss / Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            )}

            {/* Big mic toggle */}
            <motion.button
              onClick={toggleAssistant}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-lg ${
                isEnabled
                  ? isSpeaking
                    ? "bg-blue-900/80 border-blue-500/50 shadow-blue-900/30"
                    : isProcessing
                    ? "bg-yellow-900/80 border-yellow-500/50 shadow-yellow-900/30"
                    : "bg-emerald-900/80 border-emerald-500/50 shadow-emerald-900/30"
                  : "bg-stone-800/80 border-stone-600/50 hover:border-amber-600/50 shadow-black/30"
              }`}
            >
              {/* Pulsing ring */}
              {isEnabled && (
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 ${
                    isSpeaking ? "border-blue-400" : isProcessing ? "border-yellow-400" : "border-emerald-400"
                  }`}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <span className="relative z-10">
                {isEnabled ? (
                  isSpeaking ? (
                    <Loader2 className="w-8 h-8 text-blue-300 animate-spin" />
                  ) : (
                    <Mic className="w-8 h-8 text-emerald-300" />
                  )
                ) : (
                  <MicOff className="w-8 h-8 text-stone-400" />
                )}
              </span>
            </motion.button>

            {/* Start battle button */}
            {isEnabled && profile.currentBoss && phase === "pre-battle" && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={startBattle}
                className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-600/50 flex items-center justify-center text-emerald-300 hover:bg-emerald-800/80 transition-all"
                title="Mulai Battle"
              >
                <Play className="w-5 h-5 ml-0.5" />
              </motion.button>
            )}

            {/* Stop indicator during battle */}
            {isEnabled && phase === "in-battle" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-full bg-red-900/40 border border-red-600/30 flex items-center justify-center"
              >
                <Swords className="w-5 h-5 text-red-400 animate-pulse" />
              </motion.div>
            )}
          </div>

          {/* Label */}
          <p className="text-center text-xs text-muted-foreground font-crimson">
            {isEnabled
              ? isSpeaking
                ? "Asisten sedang berbicara..."
                : isProcessing
                ? "Memproses ucapan kamu..."
                : "Mikrofon aktif — ngomong aja!"
              : "Tekan tombol untuk mengaktifkan asisten"
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
