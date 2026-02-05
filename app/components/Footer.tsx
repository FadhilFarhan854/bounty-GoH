"use client"
import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      className="w-full py-8 mt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px flex-1 max-w-48 bg-gradient-to-r from-transparent to-primary/20" />
          <span className="text-primary/30 text-xs">◆</span>
          <div className="h-px flex-1 max-w-48 bg-gradient-to-l from-transparent to-primary/20" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-muted-foreground/60 text-sm font-cinzel tracking-wider">
            Est. MMXXIV • The Guild Archives
          </p>
          <p className="text-muted-foreground/40 text-xs italic">
            "May your hunts be glorious and your rewards plentiful"
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
