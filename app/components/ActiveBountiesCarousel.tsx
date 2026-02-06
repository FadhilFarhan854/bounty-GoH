"use client";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Target, Swords, Trophy } from "lucide-react";
import { Boss } from "../types/boss";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ActiveBountiesCarouselProps {
  bosses: Boss[];
}

export function ActiveBountiesCarousel({ bosses }: ActiveBountiesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (bosses.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % bosses.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [bosses.length, currentIndex]);

  if (!bosses || bosses.length === 0) {
    return null;
  }

  const currentBoss = bosses[currentIndex];

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % bosses.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + bosses.length) % bosses.length);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold) {
      goToPrev();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-12"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="fate-card p-8 parchment-texture">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center gap-2 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Target className="w-8 h-8 text-primary animate-pulse" />
            <h2 className="font-cinzel text-3xl md:text-4xl text-parchment tracking-wider">
              ACTIVE BOUNTIES
            </h2>
            <Target className="w-8 h-8 text-primary animate-pulse" />
          </motion.div>
          <p className="text-primary/80 italic">
            {currentIndex + 1} of {bosses.length} Weekly Targets
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons - Hidden on mobile */}
          {bosses.length > 1 && (
            <>
              <Button
                onClick={goToPrev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 rounded-full w-12 h-12 p-0 bg-card/80 backdrop-blur-sm border-2 border-primary/40 hover:border-primary/60"
                variant="ghost"
              >
                <ChevronLeft className="w-6 h-6 text-primary" />
              </Button>

              <Button
                onClick={goToNext}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 rounded-full w-12 h-12 p-0 bg-card/80 backdrop-blur-sm border-2 border-primary/40 hover:border-primary/60"
                variant="ghost"
              >
                <ChevronRight className="w-6 h-6 text-primary" />
              </Button>
            </>
          )}

          {/* Carousel Content - Swipeable */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="grid md:grid-cols-2 gap-8 items-center cursor-grab active:cursor-grabbing"
            >
              {/* Boss Image */}
              <div className="relative">
                <motion.div
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border-4 border-primary/40 shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={currentBoss.image}
                    alt={currentBoss.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                </motion.div>

                {/* Wanted Banner */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-destructive px-6 py-2 rounded rotate-2 shadow-lg border-2 border-background">
                  <span className="font-cinzel text-xl font-bold text-white tracking-wider">
                    WANTED
                  </span>
                </div>
              </div>

              {/* Boss Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-cinzel text-4xl text-parchment mb-2 gold-shimmer">
                    {currentBoss.name}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentBoss.description}
                  </p>
                </div>

                {/* Bounty Reward */}
                <div className="bg-muted/30 border-2 border-primary/30 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bounty Reward</p>
                      <p className="font-cinzel text-2xl bounty-text">{currentBoss.bounty}</p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-parchment">
                      <span className="text-primary">⚔</span>
                      <span>
                        Hunt Status: <span className="text-primary font-semibold">ACTIVE</span>
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-parchment">
                      <span className="text-primary">👥</span>
                      <span>Open to all guild members</span>
                    </p>
                    <p className="flex items-center gap-2 text-parchment">
                      <span className="text-primary">🎯</span>
                      <span>First kill earns bonus rewards</span>
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-primary/10 border border-primary/20 rounded p-4 text-center">
                  <Swords className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-parchment font-semibold">
                    Rally your party and bring glory to the guild!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Report your victory in the guild Discord
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        {bosses.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {bosses.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-primary/20 hover:bg-primary/40"
                }`}
                aria-label={`Go to bounty ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Swipe Hint - Mobile Only */}
        {bosses.length > 1 && (
          <div className="md:hidden flex justify-center mt-4">
            <p className="text-xs text-muted-foreground italic">
              ← Swipe to navigate • Auto-slides every 5s →
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-primary/20 text-center">
          <p className="text-sm text-muted-foreground italic">
            &quot;May your blade strike true and your spirit remain unbroken, brave hunter.&quot;
          </p>
        </div>
      </div>
    </motion.div>
  );
}
