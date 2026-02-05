import { motion } from "framer-motion";

interface CardBackProps {
  delay?: number;
  isShuffling?: boolean;
}

export function CardBack({ delay = 0, isShuffling }: CardBackProps) {
  return (
    <motion.div
      className="w-64 h-96 fate-card rounded-lg overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: isShuffling ? [0, -20, 20, -10, 0] : 0,
        rotateY: isShuffling ? [0, -15, 15, -10, 0] : 0,
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        y: { duration: 0.5, delay },
        x: { duration: 0.6, ease: "easeInOut" },
        rotateY: { duration: 0.6, ease: "easeInOut" },
      }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {/* Inner frame */}
      <div className="absolute inset-2 border border-primary/30 rounded pointer-events-none" />
      
      {/* Corner ornaments */}
      <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
      <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-primary/50" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-primary/50" />

      {/* Decorative pattern */}
      <div className="h-full flex flex-col items-center justify-center p-6">
        {/* Top decoration */}
        <div className="flex items-center gap-2 text-primary/40">
          <span>✦</span>
          <span>◆</span>
          <span>✦</span>
        </div>
        
        {/* Central design */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Outer ring */}
            <div className="absolute inset-0 border-2 border-primary/30 rounded-full" />
            {/* Middle ring */}
            <div className="absolute inset-3 border border-primary/40 rounded-full" />
            {/* Inner ring */}
            <div className="absolute inset-6 border border-primary/50 rounded-full" />
            
            {/* Center symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-cinzel text-3xl text-primary gold-shimmer">
                ⚔
              </span>
            </div>
            
            {/* Cardinal points */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-primary/50 text-xs">◆</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-primary/50 text-xs">◆</div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-primary/50 text-xs">◆</div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-primary/50 text-xs">◆</div>
          </div>
        </div>

        {/* Guild text */}
        <p className="font-cinzel text-sm text-primary/60 tracking-[0.3em] uppercase">
          Bounty
        </p>
        
        {/* Bottom decoration */}
        <div className="flex items-center gap-2 text-primary/40 mt-2">
          <span>✦</span>
          <span>◆</span>
          <span>✦</span>
        </div>
      </div>
    </motion.div>
  );
}
