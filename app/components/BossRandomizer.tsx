/* eslint-disable react-hooks/purity */
"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import { BossCard } from "./BossCard";
import { CardBack } from "./CardBack";
import { StackedCards } from "./StackedCards";
import { PasswordDialog } from "./PasswordDialog";
import { Button } from "@/components/ui/button";
import { Boss } from "../types/boss";
import { bosses } from "../data/bosses";
import { div } from "framer-motion/client";

type Phase = "idle" | "shuffling" | "revealing" | "selected";

interface BossRandomizerProps {
  onBountiesSelected?: (bosses: Boss[]) => void;
  activeBounties?: Boss[];
}

export function BossRandomizer({ onBountiesSelected, activeBounties = [] }: BossRandomizerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedBosses, setSelectedBosses] = useState<Boss[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Check if all active bounties are hunted (button should be locked if not all hunted)
  const allBountiesHunted = activeBounties.length === 0 || activeBounties.every(boss => boss.hunted);

  // Display only first 5 bosses as preview cards (idle state)
  const displayBosses = bosses.slice(0, 5);

  const handleInvokeFate = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordDialog(false);
    invokeFate();
  };

  const invokeFate = useCallback(async () => {
    setPhase("shuffling");
    setSelectedBosses([]);

    // Shuffle animation duration
    setTimeout(() => {
      setPhase("revealing");

      // Random selection of 10 UNIQUE bosses from ALL bosses data
      const shuffled = [...bosses].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, 10).map(boss => ({
        ...boss,
        hunted: false,
        huntedBy: undefined,
        huntedAt: undefined
      }));

      // Reveal delay
      setTimeout(async () => {
        setSelectedBosses(chosen);
        setPhase("selected");

        // Save to server
        try {
          console.log('Saving bounties to server...', chosen);
          const response = await fetch('/api/bounties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chosen)
          });
          const result = await response.json();
          console.log('Save result:', result);

          if (result.success) {
            console.log('Bounties saved successfully at:', result.timestamp);
          }
        } catch (error) {
          console.error('Failed to save bounties:', error);
        }

        // Notify parent component about the selected bounties
        if (onBountiesSelected) {
          onBountiesSelected(chosen);
        }
      }, 800);
    }, 1500);
  }, [onBountiesSelected]);

  const reset = useCallback(() => {
    setPhase("idle");
    setSelectedBosses([]);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Password Dialog */}
      <AnimatePresence>
        {showPasswordDialog && (
          <PasswordDialog
            onSuccess={handlePasswordSuccess}
            onCancel={() => setShowPasswordDialog(false)}
          />
        )}
      </AnimatePresence>

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
          &quot;Let fate guide thy blade. Draw from the ancient scrolls and discover what beast awaits...&quot;
        </p>
      </motion.div>

      {/* Cards Display */}
      <div className="flex justify-center items-center min-h-[450px] mb-12 relative">
        {/* Background for revealed cards */}
        {(phase === "revealing" || phase === "selected") && selectedBosses.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 -m-8 rounded-lg bg-gradient-to-b from-card/40 via-card/60 to-card/40 border border-primary/10"
            style={{
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)'
            }}
          />
        )}

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

          {/* Revealing / Selected State - Desktop: Show 5 cards in a row */}
          {(phase === "revealing" || phase === "selected") && selectedBosses.length > 0 && (
            <motion.div
              key="selected"
              className="hidden md:flex flex-wrap justify-center items-center gap-4 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {selectedBosses.map((boss, index) => (
                <motion.div
                  key={boss.id}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.6
                  }}
                >
                  <BossCard
                    boss={boss}
                    isSelected={phase === "selected"}
                    isRevealed={true}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Revealing / Selected State - Mobile: Stacked Cards */}
          {(phase === "revealing" || phase === "selected") && selectedBosses.length > 0 && (
            <div className="md:hidden relative z-10">
              <StackedCards
                bosses={selectedBosses}
                isSelected={phase === "selected"}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      <motion.div
        className="flex flex-col justify-center items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={handleInvokeFate}
              size="lg"
              disabled={!allBountiesHunted}
              className={`
                btn-medieval px-10 py-7 text-xl
                font-cinzel tracking-wider
                text-parchment
                transition-all duration-300
                group
                ${allBountiesHunted 
                  ? 'rune-glow hover:rune-glow-active' 
                  : 'opacity-50 cursor-not-allowed'}
              `}
            >
              <Sparkles className="w-5 h-5 mr-3 text-primary group-hover:animate-pulse" />
              Invoke Fate
            </Button>
            {!allBountiesHunted && (
              <p className="text-muted-foreground text-sm italic text-center">
                &quot;Complete all active bounties before invoking fate again...&quot;
              </p>
            )}
          </div>
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
          <div>
            <p>Slide to reveal another scroll</p>
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
          </div>
        )}
      </motion.div>

      {/* Selected Bosses Announcement */}
      <AnimatePresence>
        {phase === "selected" && selectedBosses.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-muted-foreground text-lg italic">
              &quot;The scrolls have spoken. Five hunters are chosen...&quot;
            </p>
            <h3 className="font-cinzel text-2xl md:text-3xl text-parchment mt-2 gold-shimmer">
              This Week&apos;s Bounty List
            </h3>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
