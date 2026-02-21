"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

interface MusicContextType {
  isMuted: boolean;
  isLoaded: boolean;
  toggleMute: () => void;
}

const MusicContext = createContext<MusicContextType>({
  isMuted: false,
  isLoaded: false,
  toggleMute: () => {},
});

export const useMusic = () => useContext(MusicContext);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set volume
    audio.volume = 0.3; // 30% volume

    // Auto play music
    const playAudio = async () => {
      try {
        await audio.play();
        setIsLoaded(true);
      } catch (error) {
        console.log("Autoplay blocked:", error);
        
        // Add click listener to start audio on first interaction
        const startAudio = async () => {
          try {
            await audio.play();
            setIsLoaded(true);
            document.removeEventListener("click", startAudio);
          } catch (e) {
            console.log("Failed to play audio:", e);
          }
        };
        document.addEventListener("click", startAudio);
      }
    };

    playAudio();

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
    <MusicContext.Provider value={{ isMuted, isLoaded, toggleMute }}>
      {/* Audio Element */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/assets/campfire.mp3" type="audio/mpeg" />
      </audio>

      {children}
    </MusicContext.Provider>
  );
}
