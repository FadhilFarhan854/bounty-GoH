"use client";
import { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { BossCard } from "./BossCard";
import { Boss } from "../types/boss";

interface StackedCardsProps {
  bosses: Boss[];
  isSelected: boolean;
}

export function StackedCards({ bosses, isSelected }: StackedCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (info.offset.x < -swipeThreshold || info.offset.y < -swipeThreshold) {
      // Swipe left or up - move to next card
      if (currentIndex < bosses.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {bosses.map((boss, index) => {
        const offset = index - currentIndex;
        const isVisible = offset >= 0 && offset < 3;
        
        return (
          <motion.div
            key={boss.id}
            className="absolute"
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              y: 50,
              rotateY: 180 
            }}
            animate={{
              opacity: isVisible ? 1 : 0,
              scale: isVisible ? 1 - offset * 0.05 : 0.8,
              y: offset * 15,
              x: offset * 5,
              rotateY: 0,
              zIndex: bosses.length - offset,
              rotate: offset * 2,
            }}
            transition={{
              delay: index * 0.15,
              duration: 0.5,
              opacity: { duration: 0.3 }
            }}
            drag={offset === 0 ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{
              cursor: offset === 0 ? 'grab' : 'default',
              pointerEvents: offset === 0 ? 'auto' : 'none',
            }}
            whileDrag={{ 
              scale: 1.05,
              cursor: 'grabbing',
              rotate: 0
            }}
          >
            <BossCard
              boss={boss}
              isSelected={isSelected}
              isRevealed={true}
            />
            
            {/* Swipe Hint - Only on first card */}
            {offset === 0 && currentIndex === 0 && (
              <motion.div
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 2,
                  repeat: 3,
                  delay: 1
                }}
              >
                <p className="text-xs text-primary/70">↑ Swipe up to reveal next</p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
      
      {/* Progress Indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {bosses.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentIndex ? 'bg-primary' : 'bg-primary/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
