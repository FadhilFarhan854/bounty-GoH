"use client";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface BackgroundMusicRef {
  play: () => Promise<void>;
  pause: () => void;
}

export const BackgroundMusic = forwardRef<BackgroundMusicRef>((props, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    play: async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsLoaded(true);
        } catch (error) {
          console.log("Failed to play audio:", error);
        }
      }
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set volume
    audio.volume = 0.3; // 30% volume agar tidak terlalu keras

    return () => {
      audio.pause();
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      {/* Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/assets/campfire.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Mute/Unmute Button */}
      <AnimatePresence>
        {isLoaded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleMute}
            className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-card/80 backdrop-blur-sm border-2 border-primary/40 hover:border-primary/60 transition-all duration-300 hover:scale-110 group"
            title={isMuted ? "Unmute Music" : "Mute Music"}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            ) : (
              <Volume2 className="w-6 h-6 text-primary group-hover:text-gold-glow transition-colors" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
});

BackgroundMusic.displayName = "BackgroundMusic";
