import { motion } from "framer-motion";
import Image from "next/image";

import { Skull, Coins } from "lucide-react";
import { Boss } from "../types/boss";

interface BossCardProps {
  boss: Boss;
  isSelected?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function BossCard({ boss, isSelected, isRevealed, onClick, delay = 0 }: BossCardProps) {
  return (
    <motion.div
      className={`
        relative cursor-pointer w-64 h-auto min-h-96
        ${isSelected ? 'fate-card-selected' : 'fate-card'}
        rounded-lg overflow-hidden
        transition-all duration-500
      `}
      initial={{ opacity: 0, rotateY: 180, scale: 0.8 }}
      animate={{
        opacity: isRevealed ? 1 : 0,
        rotateY: isRevealed ? 0 : 180,
        scale: isSelected ? 1.05 : 1,
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      onClick={onClick}
      whileHover={!isSelected ? { scale: 1.02, y: -5 } : {}}
    >
      {/* Card inner frame decoration */}
      <div className="absolute inset-2 border border-primary/20 rounded pointer-events-none z-10" />

      {/* Corner ornaments */}
      <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-primary/40 z-10" />
      <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-primary/40 z-10" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-primary/40 z-10" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-primary/40 z-10" />


      {/* Boss Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={boss.image}
          alt={boss.name}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent z-10" />

        {/* Vignette effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] z-10" />
      </div>

      {/* Content */}
      <div className="relative p-4 pt-2 space-y-3">
        {/* Boss Name */}
        <div className="flex items-center gap-2 justify-center">
          <Skull className="w-4 h-4 text-primary/60" />
          <h3 className="font-cinzel text-lg text-parchment text-center tracking-wide">
            {boss.name}
          </h3>
        </div>

        {/* Divider */}
        <div className="divider-ornament py-1">
          <span className="text-primary text-xs">✦</span>
        </div>

        {/* Bounty */}
        <div className="flex items-center justify-center gap-2 bounty-text text-base">
          <Coins className="w-4 h-4" />
          <span className="font-cinzel">{boss.bounty}</span>
        </div>

        {/* Description */}
        {boss.description && (
          <p className="text-muted-foreground text-sm text-center italic leading-relaxed line-clamp-2">
            "{boss.description}"
          </p>
        )}
      </div>

      {/* Selected glow effect */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-radial-gold animate-fate-glow" />
        </motion.div>
      )}
    </motion.div>
  );
}
