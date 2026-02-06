"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroScreenProps {
  onComplete: () => void;
}

const introTexts = [
  {
    text: "Selamat datang, Petualang",
    duration: 3000,
  },
  {
    text: "Kamu pasti lelah setelah perjalanan panjangmu",
    duration: 3600,
  },
{
    text: "Beristirahatlah sejenak di sini",
    duration: 3600,
  },
  {
    text: "Tempat takdir merajut alur kehidupan",
    duration: 3600,
  },
  {
    text: "Di mana kegelapan menanti untuk ditaklukkan",
    duration: 3600,
  },

  {
    text: "As the stars rise with the moon",
    duration: 3600,
  },
  {
    text: "may fortune stand eternal at your side.",
    duration: 3600,
  },
  {
    text: "Wanderer",
    duration: 3800,
  },
];


export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (currentTextIndex < introTexts.length && !isSkipped) {
      const timer = setTimeout(() => {
        setCurrentTextIndex(currentTextIndex + 1);
      }, introTexts[currentTextIndex].duration);

      return () => clearTimeout(timer);
    } else if (currentTextIndex >= introTexts.length) {
      // All texts shown, complete intro
      setTimeout(onComplete, 1000);
    }
  }, [currentTextIndex, onComplete, isSkipped]);

  const handleDoubleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      setIsSkipped(true);
      onComplete();
    }
    
    lastTapRef.current = now;
  };

  if (isSkipped || currentTextIndex >= introTexts.length) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center bg-background cursor-pointer"
      onClick={handleDoubleTap}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 3 }}
    >
      {/* Background gradient effect */}
      <div 
        className="fixed inset-0"
        style={{
          background: 'radial-gradient(circle at center, hsl(38 35% 15%) 0%, hsl(25 20% 8%) 50%, hsl(20 15% 4%) 100%)'
        }}
      />

      {/* Vignette */}
      <div className="fixed inset-0 shadow-[inset_0_0_300px_rgba(0,0,0,0.9)]" />

      {/* Golden glow effect */}
      <div 
        className="fixed inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, hsl(38 60% 30% / 0.4) 0%, transparent 60%)'
        }}
      />

      {/* Animated text */}
      <div className="relative z-10 text-center px-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {currentTextIndex < introTexts.length && (
            <motion.div
              key={currentTextIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
            >
              <h1 className="font-cinzel text-3xl md:text-5xl lg:text-6xl text-parchment tracking-wider leading-relaxed">
                {introTexts[currentTextIndex].text.split(" ").map((word, index) => (
                  <motion.span
                    key={index}
                    className="inline-block mr-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative elements */}
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <span className="text-primary/30 text-6xl">✦</span>
        </motion.div>

        <motion.div
          className="absolute -bottom-16 left-1/2 -translate-x-1/2"
          animate={{ 
            rotate: -360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }}
        >
          <span className="text-primary/30 text-6xl">✦</span>
        </motion.div>
      </div>

      {/* Skip hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-muted-foreground text-sm md:text-base italic">
          double tap to skip intro
        </p>
        <motion.div
          className="mt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-primary/50 text-2xl">↓</span>
        </motion.div>
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {introTexts.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index <= currentTextIndex ? 'bg-primary' : 'bg-primary/20'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
