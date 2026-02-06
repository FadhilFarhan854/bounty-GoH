import { motion } from "framer-motion";
import { Target, Swords, Trophy } from "lucide-react";
import { Boss } from "../types/boss";
import Image from "next/image";

interface ActiveBountyProps {
  boss: Boss;
}

export function ActiveBounty({ boss }: ActiveBountyProps) {
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-12"
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
              ACTIVE BOUNTY
            </h2>
            <Target className="w-8 h-8 text-primary animate-pulse" />
          </motion.div>
          <p className="text-primary/80 italic">The Chosen Prey of the Week</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Boss Image */}
          <div className="relative">
            <motion.div
              className="relative aspect-[3/4] rounded-lg overflow-hidden border-4 border-primary/40 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={boss.image}
                alt={boss.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </motion.div>
            
            {/* Wanted Banner */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-destructive px-6 py-2 rounded rotate-2 shadow-lg border-2 border-background">
              <span className="font-cinzel text-xl font-bold text-white tracking-wider">WANTED</span>
            </div>
          </div>

          {/* Boss Details */}
          <div className="space-y-6">
            <div>
              <h3 className="font-cinzel text-4xl text-parchment mb-2 gold-shimmer">
                {boss.name}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {boss.description}
              </p>
            </div>

            {/* Bounty Reward */}
            <div className="bg-muted/30 border-2 border-primary/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bounty Reward</p>
                  <p className="font-cinzel text-2xl bounty-text">{boss.bounty}</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-parchment">
                  <span className="text-primary">⚔</span>
                  <span>Hunt Status: <span className="text-primary font-semibold">ACTIVE</span></span>
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
        </div>

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
