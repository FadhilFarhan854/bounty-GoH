"use client";

import { useState } from "react";
import { useCombatAssistant } from "./CombatAssistantProvider";
import { motion, AnimatePresence } from "framer-motion";

export function CombatAssistant() {
  const { state, toggleAssistant, startBattle, resetProfile } = useCombatAssistant();
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Phase display info
  const getPhaseInfo = () => {
    switch (phase) {
      case "idle": return { label: "Idle", color: "text-gray-400" };
      case "identifying": return { label: "🔍 Identifikasi", color: "text-amber-400" };
      case "pre-battle": return { label: "📋 Persiapan", color: "text-yellow-400" };
      case "in-battle": return { label: "⚔️ Dalam Pertarungan", color: "text-red-400" };
      case "post-battle": return { label: "🏆 Selesai", color: "text-green-400" };
      default: return { label: "—", color: "text-gray-400" };
    }
  };

  const getStatusInfo = () => {
    if (!isEnabled) return { color: "bg-gray-500", text: "Mati", pulse: false };
    if (isSpeaking) return { color: "bg-blue-500", text: "Berbicara...", pulse: true };
    if (isProcessing) return { color: "bg-yellow-500", text: "Mikir...", pulse: true };
    if (isListening) return { color: "bg-green-500", text: "Dengerin...", pulse: true };
    return { color: "bg-emerald-700", text: "Siap Tempur", pulse: false };
  };

  const status = getStatusInfo();
  const phaseInfo = getPhaseInfo();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-80 max-h-120 rounded-xl border border-amber-900/50 bg-linear-to-b from-stone-900/95 to-stone-950/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-amber-900/30 bg-amber-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-amber-400 text-lg">⚔️</div>
                  <h3 className="font-cinzel text-amber-200 text-sm font-semibold tracking-wide">
                    Spirit Companion
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${status.color} ${status.pulse ? "animate-pulse" : ""}`} />
                  <span className="text-xs text-amber-400/70">{status.text}</span>
                </div>
              </div>
            </div>

            {/* Combat Profile Bar */}
            {isEnabled && (profile.currentBossName || profile.weapon) && (
              <div className="px-4 py-2 border-b border-amber-900/20 bg-stone-900/60">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-3">
                    {profile.currentBossName && (
                      <span className="text-red-400">
                        👹 {profile.currentBossName}
                      </span>
                    )}
                    {profile.weapon && (
                      <span className="text-blue-400">
                        🗡️ {profile.weapon}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold ${phaseInfo.color}`}>
                    {phaseInfo.label}
                  </span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="px-4 py-3 max-h-52 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-amber-900/50">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🛡️</div>
                  <p className="text-amber-400/50 text-xs font-crimson italic">
                    {isEnabled
                      ? "Sebutin nama boss dan senjata yang kamu pakai!"
                      : "Aktifin dulu buat mulai dengerin"}
                  </p>
                </div>
              )}

              {messages.slice(-10).map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : msg.role === "system"
                      ? "justify-center"
                      : "justify-start"
                  }`}
                >
                  {msg.role === "system" ? (
                    <div className="bg-amber-900/20 border border-amber-800/20 px-3 py-1.5 rounded-full">
                      <span className="text-[10px] text-amber-400/70 font-crimson">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-xs font-crimson ${
                        msg.role === "user"
                          ? "bg-amber-900/30 text-amber-200 rounded-br-none"
                          : msg.isQuickResponse
                          ? "bg-emerald-900/40 text-emerald-100 rounded-bl-none border border-emerald-700/30"
                          : "bg-stone-800/80 text-amber-100 rounded-bl-none border border-amber-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] opacity-60">
                          {msg.role === "user"
                            ? "🎤 Kamu"
                            : msg.isQuickResponse
                            ? "⚡ Quick"
                            : "⚔️ Asisten"}
                        </span>
                      </div>
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-stone-800/80 border border-amber-900/20 px-3 py-2 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transcript */}
            {isListening && transcript && (
              <div className="px-4 py-2 border-t border-amber-900/20 bg-stone-900/50">
                <p className="text-xs text-amber-300/60 font-crimson italic truncate">
                  🎤 {transcript}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-2 border-t border-red-900/30 bg-red-950/30">
                <p className="text-xs text-red-400 font-crimson">⚠️ {error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-amber-900/30 bg-stone-950/50 space-y-2">
              {/* Start Battle / Reset buttons */}
              {isEnabled && profile.currentBoss && phase === "pre-battle" && (
                <button
                  onClick={startBattle}
                  className="w-full py-2 rounded-lg text-xs font-cinzel font-semibold tracking-wider bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-200 border border-emerald-700/50 transition-all"
                >
                  ⚔️ MULAI BATTLE
                </button>
              )}

              {isEnabled && profile.currentBoss && (
                <button
                  onClick={resetProfile}
                  className="w-full py-1.5 rounded-lg text-[10px] font-crimson text-amber-400/60 hover:text-amber-400 hover:bg-amber-900/20 transition-all"
                >
                  🔄 Ganti Boss / Reset
                </button>
              )}

              <button
                onClick={toggleAssistant}
                className={`w-full py-2 rounded-lg text-xs font-cinzel font-semibold tracking-wider transition-all duration-300 ${
                  isEnabled
                    ? "bg-red-900/50 hover:bg-red-900/70 text-red-200 border border-red-800/50"
                    : "bg-amber-900/50 hover:bg-amber-900/70 text-amber-200 border border-amber-700/50"
                }`}
              >
                {isEnabled ? "⏹ MATIKAN ASISTEN" : "▶ AKTIFKAN ASISTEN"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setIsExpanded((prev) => !prev)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`relative w-14 h-14 rounded-full shadow-lg shadow-black/50 flex items-center justify-center text-2xl transition-all duration-300 border-2 ${
          isEnabled
            ? phase === "in-battle"
              ? "bg-red-900/90 border-red-500/50"
              : isSpeaking
              ? "bg-blue-900/90 border-blue-500/50"
              : isProcessing
              ? "bg-yellow-900/90 border-yellow-500/50"
              : "bg-emerald-900/90 border-emerald-500/50"
            : "bg-stone-800/90 border-stone-600/50 hover:border-amber-600/50"
        }`}
      >
        {isEnabled && (
          <motion.div
            className={`absolute inset-0 rounded-full border-2 ${
              phase === "in-battle"
                ? "border-red-400"
                : isSpeaking
                ? "border-blue-400"
                : isProcessing
                ? "border-yellow-400"
                : "border-emerald-400"
            }`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <span className="relative z-10">
          {isEnabled
            ? phase === "in-battle"
              ? "⚔️"
              : isSpeaking
              ? "🗣️"
              : isProcessing
              ? "⚡"
              : "🎤"
            : "⚔️"}
        </span>
        <span
          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-stone-900 ${status.color} ${
            status.pulse ? "animate-pulse" : ""
          }`}
        />
      </motion.button>
    </div>
  );
}