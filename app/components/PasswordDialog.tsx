"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PasswordDialog({ onSuccess, onCancel }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "goh-123") {
      onSuccess();
    } else {
      setError("The ancient seal rejects thee...");
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setError("");
      }, 600);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="fate-card p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Key className="w-12 h-12 text-primary mx-auto mb-4" />
          </motion.div>
          <h3 className="font-cinzel text-2xl text-parchment mb-2">
            The Ancient Seal
          </h3>
          <p className="text-sm text-muted-foreground italic">
            &quot;Only those who possess the sacred cipher may commune with the scrolls...&quot;
          </p>
        </div>

        {/* Lore */}
        <div className="bg-muted/20 border border-primary/20 rounded p-4 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The <span className="text-primary font-semibold">Guild Master&apos;s Seal</span> protects 
            these ancient scrolls from prying eyes. Only true members of the 
            <span className="text-parchment font-semibold"> Guild of Hunters</span> possess 
            the cipher to unlock fate&apos;s decree.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-cinzel text-parchment mb-2">
              Enter the Cipher
            </label>
            <motion.input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Guild cipher..."
              className={`w-full px-4 py-3 bg-muted/30 border-2 rounded font-cinzel text-parchment placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors ${
                error ? 'border-destructive' : 'border-primary/30'
              }`}
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              autoFocus
            />
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-destructive text-sm mt-2 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 btn-medieval font-cinzel"
            >
              <Key className="w-4 h-4 mr-2" />
              Unlock
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 font-cinzel border-primary/40"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Hint */}
        <div className="mt-6 pt-4 border-t border-primary/20 text-center">
          <p className="text-xs text-muted-foreground italic">
            Hint: Seek the Guild Master for the cipher...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
