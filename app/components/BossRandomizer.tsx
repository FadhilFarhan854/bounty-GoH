"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import { BossCard } from "./BossCard";
import { CardBack } from "./CardBack";
import { Button } from "@/components/ui/button";
import { Boss } from "../types/boss";
import { bosses } from "../data/bosses";

type Phase = "idle" | "shuffling" | "revealing" | "selected";

interface BossRandomizerProps {
  onBountySelected?: (boss: Boss) => void;
}

export function BossRandomizer({ onBountySelected }: BossRandomizerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  
  // Display only first 5 bosses as preview cards
  const displayBosses = bosses.slice(0, 5);

  const invokeFate = useCallback(() => {
    setPhase("shuffling");
    setSelectedBoss(null);

    // Shuffle animation duration
    setTimeout(() => {
      setPhase("revealing");

      // Random selection from ALL bosses data
      const randomIndex = Math.floor(Math.random() * bosses.length);
      const chosen = bosses[randomIndex];

      // Reveal delay
      setTimeout(() => {
        setSelectedBoss(chosen);
        setPhase("selected");
        // Notify parent component about the selected bounty
        if (onBountySelected) {
          onBountySelected(chosen);
        }
      }, 800);
    }, 1500);
  }, [onBountySelected]);

  const reset = useCallback(() => {
    setPhase("idle");
    setSelectedBoss(null);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="font-cinzel text-4xl md:text-5xl text-parchment mb-4 tracking-wider">
          The <span className="gold-shimmer">Hunting Ledger</span>
        </h2>
        <p className="text-muted-foreground text-lg italic max-w-xl mx-auto">
          "Let fate guide thy blade. Draw from the ancient scrolls and discover what beast awaits..."
        </p>
      </motion.div>

      {/* Cards Display */}
      <div className="flex justify-center items-center min-h-[450px] mb-12">
        <AnimatePresence mode="wait">
          {/* Idle State - Show only 5 card backs */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              className="hidden md:flex justify-center items-center gap-4 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              {displayBosses.map((_, index) => (
                <div key={index} className="transform hover:scale-105 transition-transform">
                  <CardBack delay={index * 0.1} />
                </div>
              ))}
            </motion.div>
          )}

          {/* Idle State - Mobile Stacked Cards */}
          {phase === "idle" && (
            <motion.div
              key="idle-mobile"
              className="md:hidden relative w-[200px] h-[320px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              {displayBosses.map((_, index) => (
                <motion.div
                  key={index}
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    rotate: (index - 2) * 5,
                    x: (index - 2) * 8,
                    scale: 0.7
                  }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.5 
                  }}
                  style={{
                    zIndex: index
                  }}
                >
                  <CardBack delay={0} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Shuffling State */}
          {phase === "shuffling" && (
            <motion.div
              key="shuffling"
              className="relative flex justify-center items-center"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {displayBosses.map((_, index) => (
                <motion.div
                  key={index}
                  className="absolute"
                  initial={{
                    x: (index - 2) * 100,
                    rotate: 0,
                    scale: 1
                  }}
                  animate={{
                    x: [
                      (index - 2) * 100,
                      Math.random() * 200 - 100,
                      Math.random() * 200 - 100,
                      0
                    ],
                    y: [
                      0,
                      Math.random() * 50 - 25,
                      Math.random() * 50 - 25,
                      0
                    ],
                    rotate: [
                      0,
                      Math.random() * 30 - 15,
                      Math.random() * 30 - 15,
                      0
                    ],
                    scale: [1, 0.95, 0.95, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeInOut",
                    times: [0, 0.33, 0.66, 1],
                  }}
                >
                  <CardBack isShuffling />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Revealing / Selected State */}
          {(phase === "revealing" || phase === "selected") && selectedBoss && (
            <motion.div
              key="selected"
              className="flex justify-center items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <BossCard
                boss={selectedBoss}
                isSelected={phase === "selected"}
                isRevealed={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      <motion.div
        className="flex justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {phase === "idle" && (
          <Button
            onClick={invokeFate}
            size="lg"
            className="
              btn-medieval px-10 py-7 text-xl
              font-cinzel tracking-wider
              text-parchment
              rune-glow hover:rune-glow-active
              transition-all duration-300
              group
            "
          >
            <Sparkles className="w-5 h-5 mr-3 text-primary group-hover:animate-pulse" />
            Invoke Fate
          </Button>
        )}

        {phase === "shuffling" && (
          <div className="flex items-center gap-3 text-primary font-cinzel text-xl animate-pulse">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              ✦
            </motion.span>
            <span>The fates are deciding...</span>
            <motion.span
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              ✦
            </motion.span>
          </div>
        )}

        {phase === "selected" && (
          <Button
            onClick={reset}
            variant="outline"
            size="lg"
            className="
              btn-medieval px-8 py-6 text-lg
              font-cinzel tracking-wider
              text-parchment
              border-primary/40 hover:border-primary/60
              transition-all duration-300
            "
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Draw Again
          </Button>
        )}
      </motion.div>

      {/* Selected Boss Announcement */}
      <AnimatePresence>
        {phase === "selected" && selectedBoss && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-muted-foreground text-lg italic">
              "The scrolls have spoken. Thy hunt begins for..."
            </p>
            <h3 className="font-cinzel text-3xl text-parchment mt-2 gold-shimmer">
              {selectedBoss.name}
            </h3>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
