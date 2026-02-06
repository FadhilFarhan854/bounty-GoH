import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";

export function BountyLore() {
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="scroll-card p-8 aged-frame">
        <div className="flex items-center justify-center gap-3 mb-6">
          <ScrollText className="w-6 h-6 text-primary" />
          <h3 className="font-cinzel text-2xl md:text-3xl text-parchment tracking-wider text-center">
            The Bounty System
          </h3>
          <ScrollText className="w-6 h-6 text-primary" />
        </div>
        
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p className="text-center italic text-lg">
            &quot;In the realm of Toram, where beasts and demons roam freely, the Guild of Hunters stands as beacon of hope...&quot;
          </p>
          
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-6" />
          
          <p>
            <span className="text-primary font-semibold">The Ancient Scrolls</span> hold the names of the most fearsome creatures that plague our lands. 
            Each week, fate chooses one beast to become our guild&apos;s sworn target—<span className="text-primary">the Active Bounty</span>.
          </p>
          
          <p>
            When the scrolls reveal their chosen, all guild members unite in a single purpose: 
            <span className="text-parchment font-semibold"> Hunt. Strike. Triumph.</span>
          </p>
          
          <p>
            Those who answer the call and slay the bounty shall earn not only glory and renown, 
            but also the gratitude of the realm and <span className="bounty-text">handsome rewards</span> befitting true heroes.
          </p>

          <div className="bg-muted/20 border border-primary/20 rounded p-4 mt-6">
            <p className="text-center text-sm text-parchment">
              <span className="text-primary">⚔</span> The hunt begins when fate speaks. May fortune guide your blade. <span className="text-primary">⚔</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
