"use client"
import { motion } from "framer-motion";
import { Shield, Scroll } from "lucide-react";

export function GuildHeader() {
  return (
    <motion.header
      className="w-full py-8 px-4"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Top decorative line */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-primary/40" />
          <Shield className="w-6 h-6 text-primary/60" />
          <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        {/* Guild Name */}
        <div className="text-center">
          <motion.div
            className="flex items-center justify-center gap-3 mb-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Scroll className="w-5 h-5 text-primary/50" />
            <span className="text-muted-foreground text-sm tracking-[0.4em] uppercase font-cinzel">
              Toram Online
            </span>
            <Scroll className="w-5 h-5 text-primary/50 transform scale-x-[-1]" />
          </motion.div>

          <h1 className="font-cinzel text-5xl md:text-6xl lg:text-7xl tracking-wider">
            <span className="gold-shimmer">Guild Archives</span>
          </h1>

          <p className="mt-4 text-muted-foreground text-lg italic max-w-md mx-auto">
            "Where hunters gather and legends are forged"
          </p>
        </div>

        {/* Bottom decorative line */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-primary/40 text-sm">✦ ◆ ✦</span>
          <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </div>
    </motion.header>
  );
}
