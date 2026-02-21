"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Images, 
  Menu,
  X,
  Scroll,
  Shield,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusic } from "./MusicProvider";

const navItems = [
  {
    label: "Bounty Board",
    href: "/",
    icon: Home,
  },
  {
    label: "Remembrance",
    href: "/gallery",
    icon: Images,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMuted, isLoaded, toggleMute } = useMusic();

  return (
    <>
      {/* Desktop Navigation - Fixed Top */}
      <motion.nav
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-md border-b border-primary/20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Shield className="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors" />
              <span className="font-cinzel text-lg tracking-wider gold-shimmer">
                Gates of Hell
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2 rounded-lg font-cinzel text-sm tracking-wider transition-all duration-300",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary/80"
                    )}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                        layoutId="activeNav"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Decorative element + Music Toggle */}
            <div className="flex items-center gap-4">
              {/* Music Toggle Button */}
              {isLoaded && (
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  title={isMuted ? "Unmute Music" : "Mute Music"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              )}
              
              <div className="flex items-center gap-2 text-primary/30">
                <span className="text-xs">✦</span>
                <Scroll className="w-4 h-4" />
                <span className="text-xs">✦</span>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
            isMobileMenuOpen
              ? "bg-primary text-primary-foreground"
              : "bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground border-2 border-primary/50"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            boxShadow: isMobileMenuOpen 
              ? "0 0 20px hsl(38 60% 50% / 0.4)" 
              : "0 4px 20px rgba(0,0,0,0.3), 0 0 15px hsl(38 60% 50% / 0.3)"
          }}
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className="md:hidden fixed bottom-24 right-6 z-50 w-56"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            >
              <div className="bg-gradient-to-b from-card to-background border-2 border-primary/30 rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-4 py-3 border-b border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="font-cinzel text-sm text-primary tracking-wider">
                      Navigation
                    </span>
                  </div>
                </div>

                {/* Nav Items */}
                <div className="p-2">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "text-muted-foreground hover:bg-primary/10 hover:text-primary/80"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-cinzel text-sm tracking-wider">
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="ml-auto text-xs text-primary/60">●</span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Music Toggle */}
                  {isLoaded && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navItems.length * 0.1 }}
                    >
                      <button
                        onClick={toggleMute}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-primary/10 hover:text-primary/80"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                        <span className="font-cinzel text-sm tracking-wider">
                          {isMuted ? "Unmute Music" : "Mute Music"}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-primary/10 bg-primary/5">
                  <p className="text-xs text-muted-foreground/50 text-center italic">
                    Gates of Hell Guild
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for desktop nav */}
      <div className="hidden md:block h-16" />
    </>
  );
}
